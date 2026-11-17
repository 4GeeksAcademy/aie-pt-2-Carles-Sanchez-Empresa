import pytest

from support_agent.url_policy import validate_support_base_url


@pytest.mark.parametrize("value", [
    "http://127.0.0.1:8000",
    "http://localhost:8000/",
    "http://api:8000",
    "https://api.trackflow.example",
])
def test_support_tool_url_policy_allows_loopback_internal_and_explicit_https_hosts(value, monkeypatch):
    monkeypatch.setenv("SUPPORT_TOOL_ALLOWED_HOSTS", "api.trackflow.example")
    assert validate_support_base_url(value) == value.rstrip("/")


@pytest.mark.parametrize("value", [
    "http://169.254.169.254/latest/meta-data",
    "http://10.0.0.1:8000",
    "http://attacker.example",
    "https://trusted.example@attacker.example",
    "https://api.trackflow.example/private/path",
    "https://api.trackflow.example/?target=localhost",
    "file:///etc/passwd",
])
def test_support_tool_url_policy_rejects_unsafe_or_unapproved_destinations(value, monkeypatch):
    monkeypatch.setenv("SUPPORT_TOOL_ALLOWED_HOSTS", "api.trackflow.example")
    with pytest.raises(ValueError):
        validate_support_base_url(value)


def test_support_tool_url_policy_requires_https_for_non_internal_host(monkeypatch):
    monkeypatch.setenv("SUPPORT_TOOL_ALLOWED_HOSTS", "api.trackflow.example")
    with pytest.raises(ValueError, match="HTTP is allowed"):
        validate_support_base_url("http://api.trackflow.example")