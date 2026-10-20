"""Read-only access to the existing authenticated incidents API."""

import asyncio
import os
from typing import Literal

import httpx
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, ValidationError, field_validator, model_validator

INCIDENT_TIMEOUT_SECONDS = 5.0
INVENTORY_TIMEOUT_SECONDS = 5.0


class TicketInput(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    ticket_id: int = Field(gt=0)


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


class TicketResult(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    outcome: Literal["found", "not_found", "timeout", "unauthorized", "unavailable", "invalid_response"]
    incident: Incident | None = None

    @model_validator(mode="after")
    def validate_payload(self):
        if (self.outcome == "found") != (self.incident is not None):
            raise ValueError("Only a found result may contain an incident.")
        return self


class IncidentTool:
    def __init__(self, base_url: str | None = None, *, transport=None):
        self.base_url = base_url or os.environ.get("SUPPORT_INCIDENTS_BASE_URL", "http://127.0.0.1:8000")
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
                    response = await client.get(
                        f"/api/incidents/{payload.ticket_id}",
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    if response.status_code == 404:
                        return TicketResult(outcome="not_found")
                    if response.status_code in {401, 403}:
                        return TicketResult(outcome="unauthorized")
                    response.raise_for_status()
                    incident = Incident.model_validate(response.json())
                    if incident.id != payload.ticket_id:
                        return TicketResult(outcome="invalid_response")
                    return TicketResult(outcome="found", incident=incident)
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
        if sum(value is not None for value in (self.product_id, self.sku_code, self.product_name)) != 1:
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
        if self.outcome == "found" and len(self.products) == 1:
            return self
        if self.outcome == "ambiguous" and len(self.products) >= 2:
            return self
        if self.outcome not in {"found", "ambiguous"} and not self.products:
            return self
        raise ValueError("Product data must match the lookup outcome.")


class InventoryTool:
    def __init__(self, base_url: str | None = None, *, transport=None):
        self.base_url = base_url or os.environ.get(
            "SUPPORT_INVENTORY_BASE_URL", os.environ.get("SUPPORT_INCIDENTS_BASE_URL", "http://127.0.0.1:8000"),
        )
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
                    if payload.sku_code:
                        products = [product for product in products if product.sku_code.casefold() == payload.sku_code.casefold()]
                    if payload.product_name:
                        exact = [product for product in products if product.name.casefold() == payload.product_name.casefold()]
                        products = exact or [product for product in products if payload.product_name.casefold() in product.name.casefold()]
                    if not products:
                        return InventoryResult(outcome="not_found")
                    return InventoryResult(outcome="found" if len(products) == 1 else "ambiguous", products=products[:10])
        except (TimeoutError, httpx.TimeoutException):
            return InventoryResult(outcome="timeout")
        except (ValidationError, ValueError):
            return InventoryResult(outcome="invalid_response")
        except httpx.HTTPError:
            return InventoryResult(outcome="unavailable")