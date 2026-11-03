"""Consent-gated memory, privacy and lifecycle contracts."""

import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "services"))

from support_agent.memory import MemoryDecision, MemoryProposal, MemoryStore, validate_memorizable


def proposal(**updates):
    value = {
        "category": "carrier_rule", "key": "SEUR-ZGZ-rural", "content":
            "Carrier SEUR ya no ofrece cobertura en zona rural de Zaragoza; usar el carrier local.",
        "rationale": "Corrección reutilizable de la regla de cobertura del carrier.",
        "country": "ES", "expires_in_days": 90,
    }
    value.update(updates)
    return MemoryProposal(**value)


def test_approved_cycle_persists_memory_and_is_auditable(tmp_path):
    store = MemoryStore(tmp_path / "agent_memory.sqlite3")
    conversation = str(uuid4())
    pid = store.propose("user-1", conversation, proposal(), "SEUR ya no cubre zona rural Zaragoza.")
    result = store.resolve("user-1", conversation, MemoryDecision(decision="approve", confidence=0.99), "Sí, recuérdalo.")
    assert result == "approve"
    assert pid
    assert store.relevant("user-1", "cobertura SEUR Zaragoza")
    audit = store.audit("user-1", conversation)
    assert [event["result"] for event in audit] == ["proposed", "approve"]
    assert audit[0]["proposed_content"] == proposal().content
    assert audit[0]["proposal_json"]
    assert audit[1]["proposal_json"]
    assert audit[1]["decision_message_redacted"] == "Sí, recuérdalo."


def test_rejected_cycle_is_audited_and_does_not_change_active_memory(tmp_path):
    store = MemoryStore(tmp_path / "agent_memory.sqlite3")
    conversation = str(uuid4())
    store.propose("user-1", conversation, proposal(), "La regla de SEUR cambió para zona rural.")
    assert store.resolve("user-1", conversation, MemoryDecision(decision="reject", confidence=0.99), "No, no lo guardes.") == "reject"
    assert store.active("user-1") == []
    assert [row["result"] for row in store.audit("user-1", conversation)] == ["proposed", "reject"]


def test_ambiguous_or_low_confidence_is_rejected_by_default(tmp_path):
    store = MemoryStore(tmp_path / "agent_memory.sqlite3")
    conversation = str(uuid4())
    store.propose("user-1", conversation, proposal(), "Regla corregida de carrier.")
    result = store.resolve("user-1", conversation, MemoryDecision(decision="approve", confidence=0.4), "¿Cuál es el stock de SKU-9?")
    assert result == "rejected_ambiguous"
    assert store.active("user-1") == []
    assert store.audit("user-1", conversation)[-1]["result"] == "rejected_ambiguous"


def test_edit_is_validated_before_becoming_active(tmp_path):
    store = MemoryStore(tmp_path / "agent_memory.sqlite3")
    conversation = str(uuid4())
    store.propose("user-1", conversation, proposal(), "Corrección explícita de cobertura.")
    result = store.resolve(
        "user-1", conversation,
        MemoryDecision(decision="edit", confidence=0.99, edited_content="La dirección 14 Main Street es la entrega del cliente."),
        "Edita la propuesta.",
    )
    assert result == "rejected_invalid_edit"
    assert store.active("user-1") == []


@pytest.mark.parametrize("candidate", [
    proposal(content="La dirección del cliente está en 14 Main Street."),
    proposal(content="La ruta interna del almacén Zaragoza conduce al muelle."),
    proposal(category="recurring_incident", key="package", content="Incidente puntual en un paquete.",
             rationale="Queja aislada sin patrón.", expires_in_days=30),
    proposal(category="b2b_report_preference", key="negotiation", content="El contrato está en negociación comercial.",
             rationale="Recordar el contrato activo.", expires_in_days=180),
])
def test_prohibited_or_nonrecurring_proposals_are_rejected(candidate):
    with pytest.raises(ValueError):
        validate_memorizable(candidate)


def test_b2b_preference_is_allowed_but_exact_business_address_is_not():
    allowed = proposal(
        category="b2b_report_preference", key="b2b-monthly-report",
        content="El cliente B2B prefiere informes mensuales de puntualidad por carrier.",
        rationale="Preferencia recurrente de formato para el informe B2B.",
        expires_in_days=180,
    )
    assert validate_memorizable(allowed) == allowed
    forbidden = allowed.model_copy(update={
        "content": "El cliente B2B del 14 Main Street prefiere informes mensuales.",
    })
    with pytest.raises(ValueError):
        validate_memorizable(forbidden)


def test_only_one_pending_proposal_and_user_isolation(tmp_path):
    store = MemoryStore(tmp_path / "agent_memory.sqlite3")
    conversation = str(uuid4())
    store.propose("user-1", conversation, proposal(), "Regla de carrier actualizada.")
    with pytest.raises(ValueError, match="one pending"):
        store.propose("user-1", conversation, proposal(key="another"), "Otra regla de carrier.")
    assert store.pending("user-2", conversation) is None
    assert store.active("user-2") == []


def test_other_actor_cannot_resolve_pending_proposal(tmp_path):
    store = MemoryStore(tmp_path / "agent_memory.sqlite3")
    conversation = str(uuid4())
    store.propose("user-1", conversation, proposal(), "Regla de carrier actualizada.")
    assert store.resolve("user-2", conversation,
                         MemoryDecision(decision="approve", confidence=1), "Sí") is None
    assert store.pending("user-1", conversation) is not None
    assert store.active("user-2") == []


def test_memory_consolidates_by_key_and_expiration_removes_active_entry(tmp_path):
    store = MemoryStore(tmp_path / "agent_memory.sqlite3")
    for content in (
        "Carrier SEUR ya no ofrece cobertura en zona rural de Zaragoza; usar el carrier local.",
        "Carrier SEUR sigue sin cobertura en zona rural de Zaragoza; usar el carrier local.",
    ):
        conversation = str(uuid4())
        store.propose("user-1", conversation, proposal(content=content), "Cambio carrier SEUR Zaragoza.")
        store.resolve("user-1", conversation, MemoryDecision(decision="approve", confidence=1), "Sí, guardar.")
    assert len(store.active("user-1")) == 1
    with store._connect() as db:
        db.execute("UPDATE approved_memories SET expires_at='2000-01-01T00:00:00+00:00'")
    assert store.active("user-1") == []
