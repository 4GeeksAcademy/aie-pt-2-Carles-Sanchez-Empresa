"""
test_suppliers.py — Pruebas unitarias para endpoints de proveedores (TrackFlow).

Cubre: CRUD completo de proveedores con filtros, actualización de tarifa y estado.

Endpoints:
  - POST   /suppliers          Crear proveedor
  - GET    /suppliers          Listar (con filtros opcionales)
  - GET    /suppliers/{id}     Obtener por ID
  - PATCH  /suppliers/{id}/rate    Actualizar tarifa
  - PATCH  /suppliers/{id}/status  Actualizar estado
  - DELETE /suppliers/{id}     Eliminar
"""

import pytest
from fastapi import HTTPException


# ───────────────────── Helpers ─────────────────────

class MockRequest:
    def __init__(self, lang="es"):
        self._headers = {"X-Language": lang}
        self._query_params = {}

    @property
    def headers(self):
        return self._headers

    @property
    def query_params(self):
        return self._query_params


# ═══════════════════════════════════════════════════════
#  CREATE SUPPLIER
# ═══════════════════════════════════════════════════════

class TestCreateSupplier:
    """Pruebas para POST /suppliers."""

    @pytest.mark.asyncio
    async def test_create_supplier_ok(self, mock_db):
        """
        S-H1: create_supplier_ok
        Datos válidos → 201, proveedor creado con todos los campos e ID
        """
        from routes.suppliers import create_supplier, SupplierCreate
        from models import SupplierStatus

        payload = SupplierCreate(
            name="New Carrier",
            country="Spain",
            categories=["carrier_last_mile"],
            rate_per_shipment=10.00,
            currency="EUR",
            status=SupplierStatus.ACTIVE,
        )
        req = MockRequest()
        result = await create_supplier(payload, req)

        assert result.name == "New Carrier"
        assert result.country == "Spain"
        assert result.rate_per_shipment == 10.00
        assert result.currency == "EUR"
        assert result.status.value == "active"
        assert result.id > 0
        assert result.updated_at is not None

    def test_create_supplier_rate_zero_fails(self, mock_db):
        """
        S-F1: create_supplier_rate_zero
        Tarifa <= 0 → ValidationError de Pydantic
        """
        from models import SupplierCreate, SupplierStatus
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            SupplierCreate(
                name="Bad Carrier",
                country="USA",
                categories=["carrier_last_mile"],
                rate_per_shipment=0,
                currency="USD",
                status=SupplierStatus.ACTIVE,
            )

    def test_create_supplier_invalid_country(self, mock_db):
        """
        S-F2: create_supplier_invalid_country
        País no soportado → ValidationError en model_validator
        """
        from models import SupplierCreate, SupplierStatus
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            SupplierCreate(
                name="Bad Carrier",
                country="France",
                categories=["carrier_last_mile"],
                rate_per_shipment=5.0,
                currency="EUR",
                status=SupplierStatus.ACTIVE,
            )

    def test_create_supplier_currency_mismatch(self, mock_db):
        """
        S-F3: create_supplier_currency_mismatch
        USA + EUR → ValidationError (validación cruzada)
        """
        from models import SupplierCreate, SupplierStatus
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            SupplierCreate(
                name="Bad Carrier",
                country="USA",
                categories=["carrier_last_mile"],
                rate_per_shipment=5.0,
                currency="EUR",
                status=SupplierStatus.ACTIVE,
            )


# ═══════════════════════════════════════════════════════
#  LIST SUPPLIERS
# ═══════════════════════════════════════════════════════

class TestListSuppliers:
    """Pruebas para GET /suppliers."""

    @pytest.mark.asyncio
    async def test_list_suppliers_all(self, mock_db):
        """
        S-H2: list_suppliers_all
        Sin filtros → todos los proveedores
        """
        from routes.suppliers import create_supplier, SupplierCreate, list_suppliers
        from models import SupplierStatus

        await create_supplier(SupplierCreate(
            name="Test Carrier Inc.", country="USA",
            categories=["carrier_last_mile"], rate_per_shipment=5.50,
            currency="USD", status=SupplierStatus.ACTIVE,
        ), MockRequest())
        await create_supplier(SupplierCreate(
            name="Transportes España SL", country="Spain",
            categories=["carrier_international"], rate_per_shipment=3.20,
            currency="EUR", status=SupplierStatus.ACTIVE,
        ), MockRequest())

        results = await list_suppliers(MockRequest(), country=None, category=None)
        assert len(results) >= 2
        names = [s.name for s in results]
        assert "Test Carrier Inc." in names
        assert "Transportes España SL" in names

    @pytest.mark.asyncio
    async def test_list_suppliers_filter_country(self, mock_db):
        """
        S-E1: list_suppliers_filter_country
        ?country=Spain → solo proveedores españoles
        """
        from routes.suppliers import create_supplier, SupplierCreate, list_suppliers
        from models import SupplierStatus

        await create_supplier(SupplierCreate(
            name="Carrier USA", country="USA",
            categories=["carrier_last_mile"], rate_per_shipment=5.50,
            currency="USD", status=SupplierStatus.ACTIVE,
        ), MockRequest())
        await create_supplier(SupplierCreate(
            name="Carrier Spain", country="Spain",
            categories=["carrier_international"], rate_per_shipment=3.20,
            currency="EUR", status=SupplierStatus.ACTIVE,
        ), MockRequest())

        results = await list_suppliers(MockRequest(), country="Spain", category=None)
        assert len(results) == 1
        assert results[0].country == "Spain"

    @pytest.mark.asyncio
    async def test_list_suppliers_filter_category(self, mock_db):
        """
        S-E2: list_suppliers_filter_category
        ?category=carrier_international → solo los que tienen esa categoría
        """
        from routes.suppliers import create_supplier, SupplierCreate, list_suppliers
        from models import SupplierStatus

        await create_supplier(SupplierCreate(
            name="Last Mile Co", country="USA",
            categories=["carrier_last_mile"], rate_per_shipment=5.50,
            currency="USD", status=SupplierStatus.ACTIVE,
        ), MockRequest())
        await create_supplier(SupplierCreate(
            name="International Co", country="Spain",
            categories=["carrier_international"], rate_per_shipment=3.20,
            currency="EUR", status=SupplierStatus.ACTIVE,
        ), MockRequest())

        results = await list_suppliers(MockRequest(), category="carrier_international", country=None)
        assert len(results) == 1
        assert "carrier_international" in results[0].categories

    @pytest.mark.asyncio
    async def test_list_suppliers_filter_no_match(self, mock_db):
        """
        S-E3: list_suppliers_no_match
        Filtro que no coincide → lista vacía (nunca 404)
        """
        from routes.suppliers import list_suppliers
        results = await list_suppliers(MockRequest(), country="Spain", category=None)
        assert results == []

    @pytest.mark.asyncio
    async def test_list_suppliers_filter_country_and_category(self, mock_db):
        """
        S-H3: list_suppliers_combined_filters
        ?country=USA&category=carrier_last_mile → 1 resultado
        """
        from routes.suppliers import create_supplier, SupplierCreate, list_suppliers
        from models import SupplierStatus

        await create_supplier(SupplierCreate(
            name="USA Last Mile", country="USA",
            categories=["carrier_last_mile"], rate_per_shipment=5.50,
            currency="USD", status=SupplierStatus.ACTIVE,
        ), MockRequest())
        await create_supplier(SupplierCreate(
            name="Spain Intl", country="Spain",
            categories=["carrier_international"], rate_per_shipment=3.20,
            currency="EUR", status=SupplierStatus.ACTIVE,
        ), MockRequest())

        results = await list_suppliers(MockRequest(), country="USA", category="carrier_last_mile")
        assert len(results) == 1
        assert results[0].country == "USA"


# ═══════════════════════════════════════════════════════
#  GET SUPPLIER
# ═══════════════════════════════════════════════════════

class TestGetSupplier:
    """Pruebas para GET /suppliers/{id}."""

    @pytest.mark.asyncio
    async def test_get_supplier_ok(self, mock_db):
        """
        S-H4: get_supplier_ok
        ID existente → 200, datos correctos
        """
        from routes.suppliers import create_supplier, SupplierCreate, get_supplier
        from models import SupplierStatus

        created = await create_supplier(SupplierCreate(
            name="Test Carrier Inc.", country="USA",
            categories=["carrier_last_mile"], rate_per_shipment=5.50,
            currency="USD", status=SupplierStatus.ACTIVE,
        ), MockRequest())

        result = await get_supplier(created.id, MockRequest())
        assert result.id == created.id
        assert result.name == "Test Carrier Inc."
        assert result.country == "USA"

    @pytest.mark.asyncio
    async def test_get_supplier_not_found(self, mock_db):
        """
        S-F4: get_supplier_not_found
        ID inexistente → 404
        """
        from routes.suppliers import get_supplier
        with pytest.raises(HTTPException) as exc:
            await get_supplier(9999, MockRequest())
        assert exc.value.status_code == 404


# ═══════════════════════════════════════════════════════
#  UPDATE RATE
# ═══════════════════════════════════════════════════════

class TestUpdateRate:
    """Pruebas para PATCH /suppliers/{id}/rate."""

    @pytest.mark.asyncio
    async def test_update_rate_ok(self, mock_db):
        """
        S-H5: update_rate_ok
        ID existente + nueva tarifa válida → tarifa actualizada
        """
        from routes.suppliers import create_supplier, SupplierCreate, update_supplier_rate, SupplierUpdateRate
        from models import SupplierStatus

        created = await create_supplier(SupplierCreate(
            name="Test Carrier", country="USA",
            categories=["carrier_last_mile"], rate_per_shipment=5.50,
            currency="USD", status=SupplierStatus.ACTIVE,
        ), MockRequest())

        payload = SupplierUpdateRate(rate_per_shipment=8.75)
        result = await update_supplier_rate(created.id, payload, MockRequest())
        assert result.rate_per_shipment == 8.75
        assert result.id == created.id

        # Verificar persistencia
        result2 = await update_supplier_rate(created.id, payload, MockRequest())
        assert result2.rate_per_shipment == 8.75

    def test_update_rate_negative_fails(self, mock_db):
        """
        S-F5: update_rate_negative
        Tarifa <= 0 → ValidationError de Pydantic
        """
        from models import SupplierUpdateRate
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            SupplierUpdateRate(rate_per_shipment=-1)

    @pytest.mark.asyncio
    async def test_update_rate_not_found(self, mock_db):
        """
        S-F6: update_rate_not_found
        ID inexistente → 404
        """
        from routes.suppliers import update_supplier_rate, SupplierUpdateRate
        payload = SupplierUpdateRate(rate_per_shipment=5.0)
        with pytest.raises(HTTPException) as exc:
            await update_supplier_rate(9999, payload, MockRequest())
        assert exc.value.status_code == 404


# ═══════════════════════════════════════════════════════
#  UPDATE STATUS
# ═══════════════════════════════════════════════════════

class TestUpdateStatus:
    """Pruebas para PATCH /suppliers/{id}/status."""

    @pytest.mark.asyncio
    async def test_update_status_ok(self, mock_db):
        """
        S-H6: update_status_ok
        ID existente + estado válido → estado actualizado
        """
        from routes.suppliers import create_supplier, SupplierCreate, update_supplier_status, SupplierUpdateStatus
        from models import SupplierStatus

        created = await create_supplier(SupplierCreate(
            name="Test Carrier", country="USA",
            categories=["carrier_last_mile"], rate_per_shipment=5.50,
            currency="USD", status=SupplierStatus.ACTIVE,
        ), MockRequest())

        payload = SupplierUpdateStatus(status=SupplierStatus.SUSPENDED)
        result = await update_supplier_status(created.id, payload, MockRequest())
        assert result.status == SupplierStatus.SUSPENDED

        # Volver a active
        payload2 = SupplierUpdateStatus(status=SupplierStatus.ACTIVE)
        result2 = await update_supplier_status(created.id, payload2, MockRequest())
        assert result2.status == SupplierStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_update_status_not_found(self, mock_db):
        """
        S-F7: update_status_not_found
        ID inexistente → 404
        """
        from routes.suppliers import update_supplier_status, SupplierUpdateStatus
        from models import SupplierStatus

        payload = SupplierUpdateStatus(status=SupplierStatus.SUSPENDED)
        with pytest.raises(HTTPException) as exc:
            await update_supplier_status(9999, payload, MockRequest())
        assert exc.value.status_code == 404


# ═══════════════════════════════════════════════════════
#  DELETE SUPPLIER
# ═══════════════════════════════════════════════════════

class TestDeleteSupplier:
    """Pruebas para DELETE /suppliers/{id}."""

    @pytest.mark.asyncio
    async def test_delete_supplier_ok(self, mock_db):
        """
        S-H7: delete_supplier_ok
        ID existente → 200, mensaje de confirmación, registro eliminado
        """
        from routes.suppliers import create_supplier, SupplierCreate, delete_supplier, get_supplier
        from models import SupplierStatus

        created = await create_supplier(SupplierCreate(
            name="Test Carrier", country="USA",
            categories=["carrier_last_mile"], rate_per_shipment=5.50,
            currency="USD", status=SupplierStatus.ACTIVE,
        ), MockRequest())

        result = await delete_supplier(created.id, MockRequest())
        assert result["message"] is not None
        assert result["id"] == created.id

        # Verificar que ya no existe
        with pytest.raises(HTTPException) as exc:
            await get_supplier(created.id, MockRequest())
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_supplier_not_found(self, mock_db):
        """
        S-F8: delete_supplier_not_found
        ID inexistente → 404
        """
        from routes.suppliers import delete_supplier
        with pytest.raises(HTTPException) as exc:
            await delete_supplier(9999, MockRequest())
        assert exc.value.status_code == 404