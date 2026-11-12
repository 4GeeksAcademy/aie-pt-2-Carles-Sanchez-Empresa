"""Durable chat sessions and message history for the First-line CX agent."""

import json
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class ChatStore:
    """SQLite-backed ChatSession/message history, independent of RFP events."""

    def __init__(self, path: Path):
        self.path = Path(path)
        self._lock = threading.RLock()
        self.path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        with self._connect() as connection:
            connection.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    session_id TEXT PRIMARY KEY,
                    agent_id TEXT NOT NULL CHECK (agent_id = 'first_line_cx'),
                    user_id TEXT NOT NULL,
                    client_id TEXT,
                    status TEXT NOT NULL CHECK (status IN ('active', 'interrupted', 'closed')),
                    created_at TEXT NOT NULL
                )
            """)
            connection.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    message_id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL REFERENCES chat_sessions(session_id),
                    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                    content TEXT NOT NULL,
                    status TEXT NOT NULL CHECK (status IN ('completed', 'streaming', 'interrupted')),
                    created_at TEXT NOT NULL
                )
            """)
            connection.execute("CREATE INDEX IF NOT EXISTS ix_chat_messages_session ON chat_messages(session_id, created_at)")

    def _connect(self):
        return sqlite3.connect(self.path, timeout=30)

    def create_session(self, user_id: str, client_id: str | None = None) -> dict:
        session = {
            "session_id": str(uuid4()), "agent_id": "first_line_cx", "user_id": str(user_id),
            "client_id": client_id, "status": "active", "created_at": utc_now(),
        }
        with self._lock, self._connect() as connection:
            connection.execute(
                "INSERT INTO chat_sessions VALUES (?, ?, ?, ?, ?, ?)",
                tuple(session.values()),
            )
        return session

    def get_session(self, session_id: str, user_id: str | None = None) -> dict | None:
        query = "SELECT session_id, agent_id, user_id, client_id, status, created_at FROM chat_sessions WHERE session_id = ?"
        params: tuple = (session_id,)
        if user_id is not None:
            query += " AND user_id = ?"
            params += (str(user_id),)
        with self._lock, self._connect() as connection:
            row = connection.execute(query, params).fetchone()
        return dict(zip(("session_id", "agent_id", "user_id", "client_id", "status", "created_at"), row)) if row else None

    def add_message(self, session_id: str, role: str, content: str, status: str = "completed") -> dict:
        message = {
            "message_id": str(uuid4()), "session_id": session_id, "role": role,
            "content": content, "status": status, "created_at": utc_now(),
        }
        with self._lock, self._connect() as connection:
            connection.execute(
                "INSERT INTO chat_messages VALUES (?, ?, ?, ?, ?, ?)",
                tuple(message.values()),
            )
        return message

    def update_message(self, message_id: str, content: str, status: str) -> None:
        with self._lock, self._connect() as connection:
            connection.execute("UPDATE chat_messages SET content = ?, status = ? WHERE message_id = ?", (content, status, message_id))

    def messages(self, session_id: str) -> list[dict]:
        with self._lock, self._connect() as connection:
            rows = connection.execute(
                "SELECT message_id, session_id, role, content, status, created_at FROM chat_messages WHERE session_id = ? ORDER BY rowid",
                (session_id,),
            ).fetchall()
        fields = ("message_id", "session_id", "role", "content", "status", "created_at")
        return [dict(zip(fields, row)) for row in rows]

    def set_session_status(self, session_id: str, status: str) -> None:
        if status not in {"active", "interrupted", "closed"}:
            raise ValueError("Invalid chat session status")
        with self._lock, self._connect() as connection:
            connection.execute("UPDATE chat_sessions SET status = ? WHERE session_id = ?", (status, session_id))

    def close(self) -> None:
        """Connections are scoped per operation; retained for runtime lifecycle symmetry."""
