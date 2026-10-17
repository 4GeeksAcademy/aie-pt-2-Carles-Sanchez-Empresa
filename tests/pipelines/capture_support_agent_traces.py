"""Explicit capture operation, separate from offline evaluation."""

import argparse
import json
import sys
from contextlib import ExitStack
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest.mock import Mock, patch

from qdrant_client import QdrantClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "services"))

from data.pipelines import rag
from data.process import rag as ingestion
from support_agent.runtime import AgentRunError, AgentRuntime

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


def capture(output: Path, *, offline: bool):
    with ExitStack() as stack:
        state_dir = Path(stack.enter_context(TemporaryDirectory()))
        if offline:
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
            llm.chat.completions.create.return_value = completion
            stack.enter_context(patch.object(rag, "embed", side_effect=offline_embedding))
            stack.enter_context(patch.object(rag, "get_qdrant_client", return_value=client))
            stack.enter_context(patch.object(rag, "get_openai_client", return_value=llm))
        runtime = AgentRuntime(state_dir, capture_kind="simulated" if offline else "live")
        stack.callback(runtime.close)
        traces = {}
        for name, question in QUESTIONS.items():
            result = runtime.run(question)
            traces[name] = runtime.traces.get(result["run_id"])
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(traces, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
    print(f"Captured {len(traces)} traces ({'simulated' if offline else 'live'}): {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Simulated embeddings/LLM, real in-memory Qdrant and graph")
    parser.add_argument("--output", type=Path, default=ROOT / "tests/pipelines/fixtures/support_agent/reference_traces.json")
    args = parser.parse_args()
    try:
        capture(args.output, offline=args.offline)
    except AgentRunError as exc:
        parser.exit(1, f"Capture failed: {exc}\n")