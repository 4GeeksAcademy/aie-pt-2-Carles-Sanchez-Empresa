"""Explicit capture operation, separate from offline evaluation."""

import argparse
import json
import os
import sys
from contextlib import ExitStack
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest.mock import Mock, patch

import httpx
from qdrant_client import QdrantClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "services"))

from data.pipelines import rag
from data.process import rag as ingestion
from support_agent.runtime import AgentRunError, AgentRuntime
from support_agent.routing import ROUTING_PROMPT
from support_agent.tools import IncidentTool, InventoryTool

QUESTIONS = {
    "storage": "Cual es la tarifa estandar de almacenamiento en Zaragoza?",
    "out_of_domain": "Como reparo una bicicleta?",
    "empty": "   ",
}


def offline_embedding(text):
    normalized = text.lower()
    if "bicicleta" in normalized:
        return [0.0, 0.0, 1.0]
    if "almacenamiento" in normalized:
        return [1.0, 0.0, 0.0]
    return [0.0, 1.0, 0.0]


def capture(output: Path, *, offline: bool, ticket_id: int = 482, product_id: int = 7):
    questions = {
        **QUESTIONS,
        "ticket": f"En que estado esta el ticket {ticket_id}?",
        "mixed": f"En que estado esta el ticket {ticket_id} y cual es la tarifa de almacenamiento en Zaragoza?",
        "inventory": f"Cuanto stock tiene el producto con ID {product_id}?",
        "inventory_mixed": f"Cuanto stock tiene el producto con ID {product_id} y cual es la tarifa de almacenamiento en Zaragoza?",
        "all_sources": f"Estado del ticket {ticket_id}, stock del producto con ID {product_id} y tarifa de almacenamiento en Zaragoza?",
    }
    with ExitStack() as stack:
        state_dir = Path(stack.enter_context(TemporaryDirectory()))
        runtime_options = {}
        token = os.environ.get("SUPPORT_AGENT_TOKEN") or os.environ.get("SUPPORT_INCIDENTS_TOKEN")
        if not offline and not token:
            raise ValueError("Live captures require SUPPORT_AGENT_TOKEN from an authenticated user.")
        if offline:
            questions["ticket_unavailable"] = f"Puedo consultar el estado del ticket {ticket_id}?"
            questions["inventory_unavailable"] = f"Puedo consultar el stock del producto con ID {product_id}?"
            decisions = {
                question: {"source": "rag", "ticket_id": None, "knowledge_question": question}
                for question in QUESTIONS.values() if question.strip()
            }
            decisions[questions["ticket"]] = {"source": "incidents", "ticket_id": ticket_id, "knowledge_question": None}
            decisions[questions["mixed"]] = {
                "source": "both", "ticket_id": ticket_id,
                "knowledge_question": QUESTIONS["storage"],
            }
            decisions[questions["ticket_unavailable"]] = decisions[questions["ticket"]]
            inventory_query = {"product_id": product_id}
            decisions[questions["inventory"]] = {"source": "inventory", "inventory_query": inventory_query}
            decisions[questions["inventory_mixed"]] = {
                "source": "inventory_rag", "inventory_query": inventory_query, "knowledge_question": QUESTIONS["storage"],
            }
            decisions[questions["all_sources"]] = {
                "source": "all", "ticket_id": ticket_id, "inventory_query": inventory_query,
                "knowledge_question": QUESTIONS["storage"],
            }
            decisions[questions["inventory_unavailable"]] = decisions[questions["inventory"]]
            token = "simulated-capture-credential"
            unavailable = False

            def incident_response(request):
                return httpx.Response(503 if unavailable else 404)

            runtime_options["incident_fn"] = IncidentTool(
                "http://simulated-incidents", transport=httpx.MockTransport(incident_response),
            )
            runtime_options["inventory_fn"] = InventoryTool(
                "http://simulated-inventory", transport=httpx.MockTransport(incident_response),
            )
            client = QdrantClient(":memory:")
            stack.callback(client.close)
            ingestion.setup(
                source_dir=ROOT / "docs/company-knowledge-base",
                qdrant_client=client, embed_fn=offline_embedding,
            )
            completion = SimpleNamespace(choices=[SimpleNamespace(
                finish_reason="stop", message=SimpleNamespace(
                    content="La tarifa estandar de almacenamiento en Zaragoza es de 16 EUR por metro cubico al mes.",
                ),
            )])
            llm = Mock()
            llm.with_options.return_value = llm

            def complete(**kwargs):
                if kwargs["messages"][0]["content"] == ROUTING_PROMPT:
                    decision = decisions[kwargs["messages"][1]["content"]]
                    return SimpleNamespace(choices=[SimpleNamespace(
                        finish_reason="stop", message=SimpleNamespace(content=json.dumps(decision)),
                    )])
                return completion

            llm.chat.completions.create.side_effect = complete
            stack.enter_context(patch.object(rag, "embed", side_effect=offline_embedding))
            stack.enter_context(patch.object(rag, "get_qdrant_client", return_value=client))
            stack.enter_context(patch.object(rag, "get_openai_client", return_value=llm))
        runtime = AgentRuntime(state_dir, capture_kind="simulated" if offline else "live", **runtime_options)
        stack.callback(runtime.close)
        traces = {}
        for name, question in questions.items():
            if offline:
                unavailable = name in {"ticket_unavailable", "inventory_unavailable"}
            result = runtime.run(question, token=token)
            traces[name] = runtime.traces.get(result["run_id"])
            if not offline and name == "ticket":
                if result["decision"]["source"] != "incidents" or result["ticket_result"]["outcome"] != "found":
                    raise ValueError("Live ticket capture must read an existing ticket successfully.")
            if not offline and name == "inventory":
                if result["decision"]["source"] != "inventory" or result["inventory_result"]["outcome"] != "found":
                    raise ValueError("Live inventory capture must read an existing product successfully.")
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(traces, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
    print(f"Captured {len(traces)} traces ({'simulated' if offline else 'live'}): {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Simulated embeddings/LLM, real in-memory Qdrant and graph")
    parser.add_argument("--output", type=Path, default=ROOT / "tests/pipelines/fixtures/support_agent/reference_traces.json")
    parser.add_argument("--ticket-id", type=int, default=482, help="Existing incident ID for live captures")
    parser.add_argument("--product-id", type=int, default=7, help="Existing product ID for live captures")
    args = parser.parse_args()
    try:
        capture(args.output, offline=args.offline, ticket_id=args.ticket_id, product_id=args.product_id)
    except (AgentRunError, ValueError) as exc:
        parser.exit(1, f"Capture failed: {exc}\n")