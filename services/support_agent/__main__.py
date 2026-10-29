"""Local inspection and resumption; traces are not exposed over public HTTP."""

import argparse
import json
import os
from pathlib import Path

from .api import default_state_dir
from .runtime import AgentRuntime, TraceStore


def main():
    parser = argparse.ArgumentParser(description="Inspect or run the TrackFlow support agent")
    parser.add_argument("--state-dir", type=Path, default=default_state_dir())
    parser.add_argument("command", choices=["query", "trace", "history", "resume"])
    parser.add_argument("value", help="Question, run_id for trace, or thread_id for history/resume")
    args = parser.parse_args()
    if args.command == "trace":
        result = TraceStore(args.state_dir / "traces.sqlite3").get(args.value)
    else:
        runtime = AgentRuntime(args.state_dir)
        token = os.environ.get("SUPPORT_AGENT_TOKEN") or os.environ.get("SUPPORT_INCIDENTS_TOKEN")
        try:
            if args.command == "history":
                result = [{"checkpoint": item.config["configurable"]["checkpoint_id"],
                           "next": list(item.next), "state": item.values}
                          for item in runtime.history(args.value)]
            elif args.command == "resume":
                result = runtime.resume(args.value, token=token)
            else:
                result = runtime.run(args.value, token=token)
        finally:
            runtime.close()
    print(json.dumps(result, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()