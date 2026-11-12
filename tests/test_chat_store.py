from support_agent.chat_store import ChatStore


def test_chat_session_scopes_history_by_owner_and_rehydrates(tmp_path):
    store = ChatStore(tmp_path / "chat.sqlite3")
    session = store.create_session("owner-1")
    user_message = store.add_message(session["session_id"], "user", "Hola")
    assistant_message = store.add_message(session["session_id"], "assistant", "Parcial", "streaming")
    store.update_message(assistant_message["message_id"], "Parcial", "interrupted")

    assert session["client_id"] is None
    assert store.get_session(session["session_id"], "owner-1")["session_id"] == session["session_id"]
    assert store.get_session(session["session_id"], "other-user") is None
    assert [message["message_id"] for message in store.messages(session["session_id"])] == [
        user_message["message_id"], assistant_message["message_id"],
    ]
    assert store.messages(session["session_id"])[1]["status"] == "interrupted"


def test_chat_store_rejects_invalid_session_status(tmp_path):
    store = ChatStore(tmp_path / "chat.sqlite3")
    session = store.create_session("owner-1")
    try:
        store.set_session_status(session["session_id"], "unknown")
    except ValueError as error:
        assert "Invalid" in str(error)
    else:
        raise AssertionError("Invalid status must be rejected")