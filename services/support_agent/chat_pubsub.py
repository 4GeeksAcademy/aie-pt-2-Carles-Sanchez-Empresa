"""Per-session in-process pub/sub for agent producer and WebSocket consumer."""

import asyncio
from collections import defaultdict


class ChatPubSub:
    def __init__(self):
        self._subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)

    def subscribe(self, session_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers[session_id].add(queue)
        return queue

    def unsubscribe(self, session_id: str, queue: asyncio.Queue) -> None:
        self._subscribers[session_id].discard(queue)
        if not self._subscribers[session_id]:
            self._subscribers.pop(session_id, None)

    def publish(self, session_id: str, event: dict) -> None:
        for queue in tuple(self._subscribers.get(session_id, ())):
            queue.put_nowait(event)

    def publish_threadsafe(self, loop: asyncio.AbstractEventLoop, session_id: str, event: dict) -> None:
        loop.call_soon_threadsafe(self.publish, session_id, event)
