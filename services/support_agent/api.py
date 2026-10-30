"""Thin HTTP adapter for the precompiled support graph."""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, FastAPI, Request, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from .runtime import AgentRunError, AgentRuntime

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Support Agent"])
bearer = HTTPBearer(auto_error=False)


def default_state_dir() -> Path:
    return Path(os.environ.get("SUPPORT_AGENT_STATE_DIR", Path.home() / ".local/state/trackflow/support_agent"))


@asynccontextmanager
async def agent_lifespan(app: FastAPI):
    runtime = AgentRuntime(
        getattr(app.state, "support_agent_state_dir", default_state_dir()),
        mcp_server_url=os.getenv("SUPPORT_AGENT_MCP_URL"),
    )
    app.state.support_agent = runtime
    try:
        yield
    finally:
        runtime.close()


class QueryRequest(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")
    question: str = Field(max_length=10000)
    conversation_id: str | None = Field(default=None, max_length=36)


class QueryResponse(BaseModel):
    answer: str
    run_id: str
    thread_id: str


class ErrorDetail(BaseModel):
    message: str
    run_id: str | None = None


class ErrorResponse(BaseModel):
    detail: ErrorDetail


@router.post("/agent/query", response_model=QueryResponse, responses={
    400: {"model": ErrorResponse}, 401: {"model": ErrorResponse},
    500: {"model": ErrorResponse}, 503: {"model": ErrorResponse},
})
def agent_query(
    payload: QueryRequest, request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
):
    try:
        current_user = getattr(request.state, "current_user", None)
        # The unified API injects this only after get_current_user has validated
        # the bearer and confirmed the account is active. A bearer by itself is
        # not proof of authentication, so standalone deployments fail closed.
        if not isinstance(current_user, dict) or current_user.get("id") is None:
            return JSONResponse(status_code=401, content={
                "detail": {"message": "Debes iniciar sesión con una cuenta activa para consultar datos de TrackFlow.", "run_id": None},
            }, headers={"WWW-Authenticate": "Bearer"})
        result = request.app.state.support_agent.run(
            payload.question, token=credentials.credentials if credentials else None,
            actor_id=str(current_user["id"]),
            conversation_id=payload.conversation_id,
        )
        if result["error"]:
            return JSONResponse(status_code=400, content={
                "detail": {"message": result["error"], "run_id": result["run_id"]},
            })
        return QueryResponse(answer=result["answer"], run_id=result["run_id"], thread_id=result["thread_id"])
    except AgentRunError as exc:
        logger.error("Support agent run failed: %s", exc.run_id)
        return JSONResponse(status_code=exc.status_code, content={
            "detail": {"message": str(exc), "run_id": exc.run_id},
        })
    except Exception:
        logger.error("Support agent runtime or persistence unavailable")
        return JSONResponse(status_code=503, content={
            "detail": {"message": "Servicio del agente no disponible temporalmente.", "run_id": None},
        })


app = FastAPI(title="TrackFlow Support Agent", lifespan=agent_lifespan)
app.include_router(router)