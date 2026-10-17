# `services` folder

This folder contains **all the backend services** (APIs and background workers) related to the company for the cross-functional AI Engineering project.

Each subfolder inside `services/` must correspond to **one specific service** (for example: `admin-api`, `data-processor-worker`) and include its own technical and functional documentation.

- **Main purpose**: to centralize all the backend logic, APIs, and queue consumers that support the company's use cases.
- **Recommendation**: document in this file (or in sub-READMEs) the services you add, their objective, the technology used, and how to run them.

> _Spanish version: [README.es.md](./README.es.md)._

## Support agent

[`support_agent`](./support_agent/README.md) orchestrates the existing RAG with
LangGraph, persistent SQLite checkpoints and queryable traces. The unified API
exposes `POST /agent/query` alongside the existing knowledge endpoint. Its README
documents standalone startup, inspection, resumption and offline/live evaluation.
