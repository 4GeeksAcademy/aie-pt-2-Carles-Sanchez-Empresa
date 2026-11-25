"""Strict operational result models and legacy HTTP tools used by tests."""

import asyncio
import os
from typing import Literal

import httpx
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, ValidationError, field_validator, model_validator

from .url_policy import validate_support_base_url

INCIDENT_TIMEOUT_SECONDS = 5.0
INVENTORY_TIMEOUT_SECONDS = 5.0


class TicketInput(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    ticket_id: int | None = Field(default=None, gt=0)
    status: Literal["open", "in_progress", "resolved", "discarded"] | None = None

    @model_validator(mode="after")
    def validate_query(self):
        if self.ticket_id is None and self.status is None:
            raise ValueError("Specify an incident ID or status filter.")
        if self.ticket_id is not None and self.status is not None:
            raise ValueError("An incident ID lookup cannot include a status filter.")
        return self


class Incident(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    id: int = Field(gt=0)
    title: str
    description: str
    category: str
    status: str
    origin: str
    branch: str
    created_at: str
    updated_at: str


class IncidentSummary(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    id: int = Field(gt=0)
    title: str
    category: str
    status: str
    origin: str
    branch: str
    created_at: str


class TicketResult(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    outcome: Literal["found", "not_found", "timeout", "unauthorized", "unavailable", "invalid_response"]
    incident: Incident | None = None
    incidents: list[IncidentSummary] = Field(default_factory=list, max_length=10)

    @model_validator(mode="after")
    def validate_payload(self):
        has_data = self.incident is not None or bool(self.incidents)
        if (self.outcome == "found") != has_data:
            raise ValueError("Only a found result may contain incident data.")
        if self.incident is not None and self.incidents:
            raise ValueError("A result cannot contain both one incident and an incident list.")
        return self


class IncidentTool:
    def __init__(self, base_url: str | None = None, *, transport=None):
        configured_url = base_url or os.environ.get("SUPPORT_INCIDENTS_BASE_URL", "http://127.0.0.1:8000")
        self.base_url = validate_support_base_url(configured_url)
        self.transport = transport

    def __call__(self, payload: TicketInput, *, token: str | None = None) -> TicketResult:
        payload = TicketInput.model_validate(payload)
        if not token:
            return TicketResult(outcome="unauthorized")
        return asyncio.run(self._get(payload, token))

    async def _get(self, payload: TicketInput, token: str) -> TicketResult:
        try:
            async with asyncio.timeout(INCIDENT_TIMEOUT_SECONDS):
                async with httpx.AsyncClient(
                    base_url=self.base_url, transport=self.transport,
                    timeout=httpx.Timeout(INCIDENT_TIMEOUT_SECONDS), follow_redirects=False,
                ) as client:
                    path = f"/api/incidents/{payload.ticket_id}" if payload.ticket_id else "/api/incidents"
                    params = {"status": payload.status} if payload.status else None
                    response = await client.get(path, params=params, headers={"Authorization": f"Bearer {token}"})
                    if payload.ticket_id:
                        if response.status_code == 404:
                            return TicketResult(outcome="not_found")
                        if response.status_code in {401, 403}:
                            return TicketResult(outcome="unauthorized")
                        response.raise_for_status()
                        incident = Incident.model_validate(response.json())
                        if incident.id != payload.ticket_id:
                            return TicketResult(outcome="invalid_response")
                        return TicketResult(outcome="found", incident=incident)
                    if not payload.status:
                        return TicketResult(outcome="invalid_response")
                    if response.status_code in {401, 403}:
                        return TicketResult(outcome="unauthorized")
                    response.raise_for_status()
                    incidents = TypeAdapter(list[IncidentSummary]).validate_python(response.json())
                    if payload.status and any(item.status != payload.status for item in incidents):
                        return TicketResult(outcome="invalid_response")
                    if not incidents:
                        return TicketResult(outcome="not_found")
                    return TicketResult(outcome="found", incidents=incidents[:10])
        except (TimeoutError, httpx.TimeoutException):
            return TicketResult(outcome="timeout")
        except (ValidationError, ValueError):
            return TicketResult(outcome="invalid_response")
        except httpx.HTTPError:
            return TicketResult(outcome="unavailable")


class InventoryInput(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    product_id: int | None = Field(default=None, gt=0)
    sku_code: str | None = Field(default=None, min_length=1, max_length=200)
    product_name: str | None = Field(default=None, min_length=1, max_length=200)
    warehouse: Literal["LA", "ZGZ"] | None = None
    category: Literal["fashion", "electronics", "cosmetics"] | None = None
    low_stock: bool = False
    low_stock_threshold: int | None = Field(default=None, ge=0, le=1000000)

    @field_validator("sku_code", "product_name")
    @classmethod
    def validate_search_text(cls, value: str | None) -> str | None:
        if value is not None:
            value = value.strip()
            if not value:
                raise ValueError("A product search must not be blank.")
        return value

    @model_validator(mode="after")
    def validate_identifier(self):
        identifier_count = sum(value is not None for value in (self.product_id, self.sku_code, self.product_name))
        if self.low_stock:
            if identifier_count:
                raise ValueError("Low-stock listings cannot include a single-product identifier.")
            if self.low_stock_threshold is None:
                raise ValueError("Low-stock listings require an explicit threshold.")
        elif identifier_count != 1 or self.low_stock_threshold is not None:
            raise ValueError("Select exactly one product ID, SKU code or name.")
        return self


class InventoryProduct(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    id: int = Field(gt=0)
    name: str
    sku_code: str
    client_name: str
    category: str
    warehouse: str
    threshold_min: int | None = None
    current_stock: int
    created_at: str


class InventoryResult(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    outcome: Literal["found", "not_found", "ambiguous", "timeout", "unauthorized", "unavailable", "invalid_response"]
    products: list[InventoryProduct] = Field(default_factory=list, max_length=10)

    @model_validator(mode="after")
    def validate_payload(self):
        if self.outcome == "found" and 1 <= len(self.products) <= 10:
            return self
        if self.outcome == "ambiguous" and len(self.products) >= 2:
            return self
        if self.outcome not in {"found", "ambiguous"} and not self.products:
            return self
        raise ValueError("Product data must match the lookup outcome.")


class InventoryTool:
    def __init__(self, base_url: str | None = None, *, transport=None):
        configured_url = base_url or os.environ.get(
            "SUPPORT_INVENTORY_BASE_URL", os.environ.get("SUPPORT_INCIDENTS_BASE_URL", "http://127.0.0.1:8000"),
        )
        self.base_url = validate_support_base_url(configured_url)
        self.transport = transport

    def __call__(self, payload: InventoryInput, *, token: str | None = None) -> InventoryResult:
        payload = InventoryInput.model_validate(payload)
        if not token:
            return InventoryResult(outcome="unauthorized")
        return asyncio.run(self._get(payload, token))

    async def _get(self, payload: InventoryInput, token: str) -> InventoryResult:
        try:
            async with asyncio.timeout(INVENTORY_TIMEOUT_SECONDS):
                params = {key: value for key, value in {
                    "warehouse": payload.warehouse, "category": payload.category,
                    "low_stock_threshold": payload.low_stock_threshold if payload.low_stock else None,
                }.items() if value is not None}
                path = f"/inventory/products/{payload.product_id}" if payload.product_id else "/inventory/products"
                async with httpx.AsyncClient(
                    base_url=self.base_url, transport=self.transport,
                    timeout=httpx.Timeout(INVENTORY_TIMEOUT_SECONDS), follow_redirects=False,
                ) as client:
                    response = await client.get(path, params=params, headers={"Authorization": f"Bearer {token}"})
                    if response.status_code == 404:
                        return InventoryResult(outcome="not_found")
                    if response.status_code in {401, 403}:
                        return InventoryResult(outcome="unauthorized")
                    response.raise_for_status()
                    if payload.product_id:
                        product = InventoryProduct.model_validate(response.json())
                        if product.id != payload.product_id:
                            return InventoryResult(outcome="invalid_response")
                        products = [product]
                    else:
                        products = TypeAdapter(list[InventoryProduct]).validate_python(response.json())
                    products = [product for product in products
                                if (not payload.warehouse or product.warehouse == payload.warehouse)
                                and (not payload.category or product.category == payload.category)]
                    if payload.low_stock:
                        products = [product for product in products if product.current_stock < payload.low_stock_threshold]
                    if payload.sku_code:
                        products = [product for product in products if product.sku_code.casefold() == payload.sku_code.casefold()]
                    if payload.product_name:
                        exact = [product for product in products if product.name.casefold() == payload.product_name.casefold()]
                        products = exact or [product for product in products if payload.product_name.casefold() in product.name.casefold()]
                    if not products:
                        return InventoryResult(outcome="not_found")
                    return InventoryResult(
                        outcome="found" if payload.low_stock or len(products) == 1 else "ambiguous",
                        products=products[:10],
                    )
        except (TimeoutError, httpx.TimeoutException):
            return InventoryResult(outcome="timeout")
        except (ValidationError, ValueError):
            return InventoryResult(outcome="invalid_response")
        except httpx.HTTPError:
            return InventoryResult(outcome="unavailable")


class MCPTrackFlowTools:
    """Synchronous LangGraph adapter over an authenticated MCP client session.

    The request's OAuth bearer is provided only to the MCP transport. It is not
    persisted in graph state/checkpoints or forwarded directly to the TrackFlow API.
    """

    def __init__(self, server_url: str, *, token_provider, timeout: float = 10.0):
        self.server_url = server_url
        self.token_provider = token_provider
        self.timeout = timeout

    def _call(self, tool_name: str, arguments: dict, *, token: str | None = None):
        import anyio
        import httpx2
        from mcp import ClientSession
        from mcp.client.streamable_http import streamable_http_client

        token = token if token is not None else self.token_provider()
        if not token:
            raise PermissionError("A user OAuth access token is required for MCP")

        async def invoke():
            async with httpx2.AsyncClient(
                headers={"Authorization": f"Bearer {token}"}, timeout=self.timeout,
            ) as http_client:
                async with streamable_http_client(self.server_url, http_client=http_client) as (read_stream, write_stream, _):
                    async with ClientSession(read_stream, write_stream) as session:
                        await session.initialize()
                        return await session.call_tool(tool_name, arguments)

        return anyio.run(invoke)

    @staticmethod
    def _structured(result):
        if getattr(result, "isError", False):
            raise RuntimeError("MCP tool returned a controlled error")
        content = getattr(result, "structuredContent", None)
        if content is None:
            content = getattr(result, "structured_content", None)
        if content is None:
            raise ValueError("MCP tool response did not include structured content")
        return content

    def incident(self, payload: TicketInput, *, token: str | None = None) -> TicketResult:
        payload = TicketInput.model_validate(payload)
        if token is not None and not token:
            return TicketResult(outcome="unauthorized")
        try:
            if payload.ticket_id is not None:
                raw = self._structured(self._call(
                    "incidents_get", {"incident_id": payload.ticket_id}, token=token,
                ))
                result = TicketResult(outcome="found", incident=Incident.model_validate(raw))
                if result.incident.id != payload.ticket_id:
                    return TicketResult(outcome="invalid_response")
                return result
            raw = self._structured(self._call(
                "incidents_list", {"status": payload.status}, token=token,
            ))
            incidents = TypeAdapter(list[IncidentSummary]).validate_python(raw["result"])
            if payload.status and any(incident.status != payload.status for incident in incidents):
                return TicketResult(outcome="invalid_response")
            if not incidents:
                return TicketResult(outcome="not_found")
            return TicketResult(outcome="found", incidents=incidents[:10])
        except PermissionError:
            return TicketResult(outcome="unauthorized")
        except TimeoutError:
            return TicketResult(outcome="timeout")
        except ValueError:
            return TicketResult(outcome="invalid_response")
        except Exception:
            return TicketResult(outcome="unavailable")

    def inventory(self, payload: InventoryInput, *, token: str | None = None) -> InventoryResult:
        payload = InventoryInput.model_validate(payload)
        if token is not None and not token:
            return InventoryResult(outcome="unauthorized")
        try:
            if payload.product_id:
                raw = self._structured(self._call(
                    "inventory_get_product", {"product_id": payload.product_id}, token=token,
                ))
                products = [InventoryProduct.model_validate(raw)]
            else:
                raw = self._structured(self._call(
                    "inventory_list_products", {
                        key: value for key, value in {"warehouse": payload.warehouse, "category": payload.category}.items()
                        if value is not None
                    } | ({"low_stock_threshold": payload.low_stock_threshold} if payload.low_stock else {}), token=token,
                ))
                products = TypeAdapter(list[InventoryProduct]).validate_python(raw["result"])
            products = [product for product in products
                        if (not payload.warehouse or product.warehouse == payload.warehouse)
                        and (not payload.category or product.category == payload.category)]
            if payload.sku_code:
                products = [product for product in products if product.sku_code.casefold() == payload.sku_code.casefold()]
            if payload.product_name:
                exact = [product for product in products if product.name.casefold() == payload.product_name.casefold()]
                products = exact or [product for product in products if payload.product_name.casefold() in product.name.casefold()]
            if payload.low_stock:
                products = [product for product in products if product.current_stock < payload.low_stock_threshold]
                if any(product.current_stock >= payload.low_stock_threshold for product in products):
                    return InventoryResult(outcome="invalid_response")
            if not products:
                return InventoryResult(outcome="not_found")
            return InventoryResult(
                outcome="found" if len(products) == 1 or payload.low_stock else "ambiguous",
                products=products[:10],
            )
        except PermissionError:
            return InventoryResult(outcome="unauthorized")
        except TimeoutError:
            return InventoryResult(outcome="timeout")
        except ValidationError:
            return InventoryResult(outcome="invalid_response")
        except Exception:
            return InventoryResult(outcome="unavailable")