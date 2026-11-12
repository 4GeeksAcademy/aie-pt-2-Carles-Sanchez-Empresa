import json
from types import SimpleNamespace

from data.pipelines import rag
from support_agent import memory


def _chunk(content=None, finish_reason=None):
    return SimpleNamespace(
        choices=[SimpleNamespace(delta=SimpleNamespace(content=content), finish_reason=finish_reason)]
    )


class _FakeCompletions:
    def __init__(self, response):
        self.response = response

    def create(self, **kwargs):
        assert kwargs["stream"] is True
        return iter(self.response)


class _FakeClient:
    def __init__(self, response):
        self.chat = SimpleNamespace(completions=_FakeCompletions(response))

    def with_options(self, **kwargs):
        return self


def test_structured_memory_stream_never_emits_internal_json(monkeypatch):
    private_content = "private memory candidate"
    response_json = json.dumps({
        "answer": "Respuesta segura para el cliente.",
        "memory_proposal": {
            "category": "carrier_rule",
            "key": "internal proposal",
            "content": private_content,
            "rationale": "internal candidate for memory",
            "country": "ES",
            "expires_in_days": 30,
        },
    })
    response = [_chunk(response_json[:19]), _chunk(response_json[19:]), _chunk(finish_reason="stop")]
    monkeypatch.setattr(rag, "get_openai_client", lambda: _FakeClient(response))

    emitted = []
    token = memory.STREAM_CALLBACKS.set((emitted.append, None))
    try:
        answer, proposal = memory.generate_structured_response(
            "Consulta logística", [{"text": "context"}], [],
        )
    finally:
        memory.STREAM_CALLBACKS.reset(token)

    assert answer == "Respuesta segura para el cliente."
    assert proposal.content == private_content
    assert emitted == []
