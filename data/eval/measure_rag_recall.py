"""data/eval/measure_rag_recall.py — Evaluación de Recall@3 para el pipeline RAG de TrackFlow.

Lee las preguntas de prueba de `data/eval/test-queries.json`, ejecuta `retrieve(k=3)`
contra la colección `trackflow_knowledge` y verifica si el documento esperado está
presente en el Top-3 devuelto.

Meta definida en CONTEXT-company.md:
  - Recall@3 >= 80%
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Añadir raíz al sys.path para resolución limpia de imports
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from data.pipelines.rag import retrieve


def evaluate_recall_at_k(
    test_queries_path: Path,
    k: int = 3,
    min_score: float = 0.35,
) -> dict:
    """Evalúa Recall@k sobre el conjunto de test queries."""
    if not test_queries_path.exists():
        raise FileNotFoundError(f"Archivo de evaluación no encontrado: {test_queries_path}")

    with open(test_queries_path, "r", encoding="utf-8") as f:
        test_cases = json.load(f)

    total_queries = len(test_cases)
    hits = 0
    detailed_results = []

    print(f"\n=======================================================")
    print(f" Evaluando Recall@{k} sobre {total_queries} preguntas de prueba (min_score={min_score})")
    print(f"=======================================================\n")

    for tc in test_cases:
        qid = tc.get("id")
        q = tc["question"]
        expected_doc = tc["expected_document"]

        # Recuperar top-k chunks
        retrieved_chunks = retrieve(q, k=k, min_score=min_score)
        retrieved_docs = [chunk.get("source_document") for chunk in retrieved_chunks]
        scores = [chunk.get("score") for chunk in retrieved_chunks]

        is_hit = expected_doc in retrieved_docs
        rank = (retrieved_docs.index(expected_doc) + 1) if is_hit else None

        if is_hit:
            hits += 1
            status_str = f"✅ HIT (Rank #{rank})"
        else:
            status_str = "❌ MISS"

        print(f"[{qid}] {status_str} | Esperado: {expected_doc:<18} | Recuperados: {retrieved_docs} | Scores: {scores}")
        print(f"     Pregunta: {q}")

        detailed_results.append({
            "id": qid,
            "question": q,
            "expected_document": expected_doc,
            "retrieved_documents": retrieved_docs,
            "scores": scores,
            "hit": is_hit,
            "rank": rank,
        })

    recall_at_k = (hits / total_queries) if total_queries > 0 else 0.0
    print(f"\n-------------------------------------------------------")
    print(f" Total preguntas: {total_queries}")
    print(f" Aciertos (Hits): {hits}")
    print(f" Recall@{k}:       {recall_at_k * 100:.2f}% (Objetivo mínimo: 80.0%)")
    print(f"-------------------------------------------------------\n")

    return {
        "k": k,
        "total_queries": total_queries,
        "hits": hits,
        "recall_at_k": recall_at_k,
        "recall_percent": round(recall_at_k * 100, 2),
        "target_met": recall_at_k >= 0.80,
        "details": detailed_results,
    }


if __name__ == "__main__":
    queries_file = REPO_ROOT / "data" / "eval" / "test-queries.json"
    result = evaluate_recall_at_k(queries_file, k=3, min_score=0.35)

    if not result["target_met"]:
        print(f"❌ FALLO: Recall@{result['k']} ({result['recall_percent']}%) está por debajo del 80% requerido.")
        sys.exit(1)
    else:
        print(f"✅ ÉXITO: Recall@{result['k']} cumplió el criterio de aceptación del CONTEXT.")
        sys.exit(0)
