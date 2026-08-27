"""
test_incidents.py — Pruebas unitarias para endpoints de incidencias (TrackFlow).

Cubre: CRUD de incidencias con filtros, transiciones de estado y resumen.

Endpoints:
  - POST   /api/incidents              Crear incidencia
  - GET    /api/incidents              Listar (con filtros opcionales)
  - GET    /api/incidents/summary      Métricas agregadas
  - GET    /api/incidents/{id}         Obtener por ID
  - PATCH  /api/incidents/{id}/status  Actualizar estado
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
#  CREATE INCIDENT
# ═══════════════════════════════════════════════════════

class TestCreateIncident:
    """Pruebas para POST /api/incidents."""

    @pytest.mark.asyncio
    async def test_create_incident_ok(self, mock_db):
        """
        I-H1: create_incident_ok
        Datos válidos → 201, incidencia creada con todos los campos e ID
        """
        from routes.incidents import create_incident, IncidentCreate

        created = await create_incident(IncidentCreate(
            title="Paquete perdido",
            description="El paquete no llegó a su destino.",
            category="lost_parcel",
            origin="customer",
            branch="central",
        ), MockRequest())

        assert created.id is not None
        assert created.title == "Paquete perdido"
        assert created.category == "lost_parcel"
        assert created.status == "open"
        assert created.created_at is not None
        assert created.updated_at is not None

    @pytest.mark.asyncio
    async def test_create_incident_with_custom_status(self, mock_db):
        """
        I-E1: create_incident_custom_status
        Status explícito 'in_progress' → se respeta
        """
        from routes.incidents import create_incident, IncidentCreate

        created = await create_incident(IncidentCreate(
            title="Fallo de entrega",
            description="El conductor no pudo entregar el paquete.",
            category="delivery_failure",
            origin="branch",
            branch="zaragoza_warehouse",
            status="in_progress",
        ), MockRequest())

        assert created.status == "in_progress"

    @pytest.mark.asyncio
    async def test_create_incident_short_description_fails(self, mock_db):
        """
        I-E2: create_incident_short_desc
        Descripción < 5 caracteres → error de validación
        """
        from routes.incidents import create_incident, IncidentCreate
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            IncidentCreate(
                title="Paquete",
                description="abc",  # demasiado corta
                category="lost_parcel",
                origin="customer",
                branch="central",
            )

    @pytest.mark.asyncio
    async def test_create_incident_invalid_category_fails(self, mock_db):
        """
        I-E3: create_incident_invalid_category
        Categoría no válida → ValidationError
        """
        from routes.incidents import IncidentCreate
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            IncidentCreate(
                title="Test",
                description="Descripción válida.",
                category="fake_category",
                origin="customer",
                branch="central",
            )

    @pytest.mark.asyncio
    async def test_create_incident_invalid_origin_fails(self, mock_db):
        """
        I-E4: create_incident_invalid_origin
        Origen no válido → ValidationError
        """
        from routes.incidents import IncidentCreate
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            IncidentCreate(
                title="Test",
                description="Descripción válida.",
                category="lost_parcel",
                origin="fake_origin",
                branch="central",
            )

    @pytest.mark.asyncio
    async def test_create_incident_invalid_branch_fails(self, mock_db):
        """
        I-E5: create_incident_invalid_branch
        Sede no válida → ValidationError
        """
        from routes.incidents import IncidentCreate
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            IncidentCreate(
                title="Test",
                description="Descripción válida.",
                category="lost_parcel",
                origin="customer",
                branch="fake_branch",
            )


# ═══════════════════════════════════════════════════════
#  LIST INCIDENTS
# ═══════════════════════════════════════════════════════

class TestListIncidents:
    """Pruebas para GET /api/incidents."""

    @pytest.mark.asyncio
    async def test_list_incidents_all(self, mock_db):
        """
        I-H2: list_incidents_all
        Sin filtros → todas las incidencias
        """
        from routes.incidents import create_incident, IncidentCreate, list_incidents

        await create_incident(IncidentCreate(
            title="Incidencia A",
            description="Descripción de la incidencia A.",
            category="lost_parcel",
            origin="customer",
            branch="central",
        ), MockRequest())
        await create_incident(IncidentCreate(
            title="Incidencia B",
            description="Descripción de la incidencia B.",
            category="delivery_failure",
            origin="branch",
            branch="la_warehouse",
        ), MockRequest())

        results = await list_incidents(
            status=None, origin=None, branch=None, category=None,
        )
        assert len(results) >= 2
        titles = [i.title for i in results]
        assert "Incidencia A" in titles
        assert "Incidencia B" in titles

    @pytest.mark.asyncio
    async def test_list_incidents_filter_status(self, mock_db):
        """
        I-E6: list_incidents_filter_status
        ?status=open → solo incidencias abiertas
        """
        from routes.incidents import create_incident, IncidentCreate, list_incidents

        await create_incident(IncidentCreate(
            title="Abierta",
            description="Descripción de incidencia abierta.",
            category="lost_parcel",
            origin="customer",
            branch="central",
        ), MockRequest())
        await create_incident(IncidentCreate(
            title="En progreso",
            description="Descripción de incidencia en progreso.",
            category="delivery_failure",
            origin="branch",
            branch="la_warehouse",
            status="in_progress",
        ), MockRequest())

        results = await list_incidents(status="open", origin=None, branch=None, category=None)
        assert len(results) == 1
        assert results[0].title == "Abierta"

    @pytest.mark.asyncio
    async def test_list_incidents_filter_origin(self, mock_db):
        """
        I-E7: list_incidents_filter_origin
        ?origin=customer → solo incidencias de cliente
        """
        from routes.incidents import create_incident, IncidentCreate, list_incidents

        await create_incident(IncidentCreate(
            title="Cliente",
            description="Descripción cliente.",
            category="lost_parcel",
            origin="customer",
            branch="central",
        ), MockRequest())
        await create_incident(IncidentCreate(
            title="Interno",
            description="Descripción interno.",
            category="system_failure",
            origin="internal",
            branch="la_office",
        ), MockRequest())

        results = await list_incidents(origin="customer", status=None, branch=None, category=None)
        assert len(results) == 1
        assert results[0].title == "Cliente"

    @pytest.mark.asyncio
    async def test_list_incidents_filter_branch(self, mock_db):
        """
        I-E8: list_incidents_filter_branch
        ?branch=central → solo incidencias de sede central
        """
        from routes.incidents import create_incident, IncidentCreate, list_incidents

        await create_incident(IncidentCreate(
            title="Central",
            description="Descripción central.",
            category="lost_parcel",
            origin="customer",
            branch="central",
        ), MockRequest())
        await create_incident(IncidentCreate(
            title="Warehouse",
            description="Descripción warehouse.",
            category="delivery_failure",
            origin="branch",
            branch="la_warehouse",
        ), MockRequest())

        results = await list_incidents(branch="central", status=None, origin=None, category=None)
        assert len(results) == 1
        assert results[0].title == "Central"

    @pytest.mark.asyncio
    async def test_list_incidents_filter_category(self, mock_db):
        """
        I-E9: list_incidents_filter_category
        ?category=lost_parcel → solo incidencias de esa categoría
        """
        from routes.incidents import create_incident, IncidentCreate, list_incidents

        await create_incident(IncidentCreate(
            title="Perdido",
            description="Descripción perdido.",
            category="lost_parcel",
            origin="customer",
            branch="central",
        ), MockRequest())
        await create_incident(IncidentCreate(
            title="Entrega",
            description="Descripción entrega.",
            category="delivery_failure",
            origin="branch",
            branch="la_warehouse",
        ), MockRequest())

        results = await list_incidents(category="lost_parcel", status=None, origin=None, branch=None)
        assert len(results) == 1
        assert results[0].title == "Perdido"

    @pytest.mark.asyncio
    async def test_list_incidents_filter_no_match(self, mock_db):
        """
        I-E10: list_incidents_no_match
        Filtro que no coincide → lista vacía (nunca 404)
        """
        from routes.incidents import list_incidents
        results = await list_incidents(
            status="resolved", origin=None, branch=None, category=None,
        )
        assert results == []


# ═══════════════════════════════════════════════════════
#  GET SUMMARY
# ═══════════════════════════════════════════════════════

class TestGetSummary:
    """Pruebas para GET /api/incidents/summary."""

    @pytest.mark.asyncio
    async def test_summary_empty(self, mock_db):
        """
        I-E11: summary_empty
        Sin incidencias → métricas con total=0 y todos los contadores vacíos
        """
        from routes.incidents import get_summary
        summary = await get_summary()
        assert summary["total"] == 0
        assert summary["by_status"] == {}
        assert summary["by_category"] == {}

    @pytest.mark.asyncio
    async def test_summary_with_data(self, mock_db):
        """
        I-H3: summary_with_data
        Con incidencias → métricas correctas por status/categoría/origen/sede
        """
        from routes.incidents import create_incident, IncidentCreate, get_summary

        for i in range(3):
            await create_incident(IncidentCreate(
                title=f"Incidencia {i}",
                description=f"Descripción {i}.",
                category="lost_parcel",
                origin="customer",
                branch="central",
            ), MockRequest())

        await create_incident(IncidentCreate(
            title="Resuelta",
            description="Descripción resuelta.",
            category="delivery_failure",
            origin="branch",
            branch="la_warehouse",
            status="resolved",
        ), MockRequest())

        summary = await get_summary()
        assert summary["total"] == 4
        assert summary["by_status"].get("open") == 3
        assert summary["by_status"].get("resolved") == 1
        assert summary["by_category"].get("lost_parcel") == 3
        assert summary["by_category"].get("delivery_failure") == 1
        assert summary["by_origin"].get("customer") == 3
        assert summary["by_origin"].get("branch") == 1
        assert summary["by_branch"].get("central") == 3
        assert summary["by_branch"].get("la_warehouse") == 1


# ═══════════════════════════════════════════════════════
#  GET INCIDENT
# ═══════════════════════════════════════════════════════

class TestGetIncident:
    """Pruebas para GET /api/incidents/{id}."""

    @pytest.mark.asyncio
    async def test_get_incident_ok(self, mock_db):
        """
        I-H4: get_incident_ok
        ID existente → 200, datos correctos
        """
        from routes.incidents import create_incident, IncidentCreate, get_incident

        created = await create_incident(IncidentCreate(
            title="Test",
            description="Descripción de prueba.",
            category="lost_parcel",
            origin="customer",
            branch="central",
        ), MockRequest())

        result = await get_incident(created.id, MockRequest())
        assert result.id == created.id
        assert result.title == "Test"
        assert result.category == "lost_parcel"

    @pytest.mark.asyncio
    async def test_get_incident_not_found(self, mock_db):
        """
        I-E12: get_incident_not_found
        ID inexistente → HTTPException 404
        """
        from routes.incidents import get_incident

        with pytest.raises(HTTPException) as exc:
            await get_incident(9999, MockRequest())
        assert exc.value.status_code == 404


# ═══════════════════════════════════════════════════════
#  UPDATE INCIDENT STATUS
# ═══════════════════════════════════════════════════════

class TestUpdateIncidentStatus:
    """Pruebas para PATCH /api/incidents/{id}/status."""

    @pytest.mark.asyncio
    async def test_update_status_ok(self, mock_db):
        """
        I-H5: update_status_ok
        open → in_progress → transición válida
        """
        from routes.incidents import create_incident, IncidentCreate, update_incident_status, IncidentStatusUpdate

        created = await create_incident(IncidentCreate(
            title="Test",
            description="Descripción de prueba.",
            category="lost_parcel",
            origin="customer",
            branch="central",
        ), MockRequest())

        updated = await update_incident_status(
            created.id,
            IncidentStatusUpdate(status="in_progress"),
            MockRequest(),
        )
        assert updated.status == "in_progress"

    @pytest.mark.asyncio
    async def test_update_status_to_resolved(self, mock_db):
        """
        I-E13: update_status_to_resolved
        open → in_progress → resolved → transición válida completa
        """
        from routes.incidents import create_incident, IncidentCreate, update_incident_status, IncidentStatusUpdate

        created = await create_incident(IncidentCreate(
            title="Test",
            description="Descripción de prueba.",
            category="lost_parcel",
            origin="customer",
            branch="central",
        ), MockRequest())

        # open → in_progress
        await update_incident_status(
            created.id,
            IncidentStatusUpdate(status="in_progress"),
            MockRequest(),
        )
        # in_progress → resolved
        updated = await update_incident_status(
            created.id,
            IncidentStatusUpdate(status="resolved"),
            MockRequest(),
        )
        assert updated.status == "resolved"

    @pytest.mark.asyncio
    async def test_update_status_invalid_transition(self, mock_db):
        """
        I-E14: update_status_invalid_transition
        open → resolved (salto inválido) → error 400
        """
        from routes.incidents import create_incident, IncidentCreate, update_incident_status, IncidentStatusUpdate

        created = await create_incident(IncidentCreate(
            title="Test",
            description="Descripción de prueba.",
            category="lost_parcel",
            origin="customer",
            branch="central",
        ), MockRequest())

        with pytest.raises(HTTPException) as exc:
            await update_incident_status(
                created.id,
                IncidentStatusUpdate(status="resolved"),
                MockRequest(),
            )
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_update_status_from_terminal_fails(self, mock_db):
        """
        I-E15: update_status_from_terminal
        resolved → in_progress (terminal) → error 400
        """
        from routes.incidents import create_incident, IncidentCreate, update_incident_status, IncidentStatusUpdate

        created = await create_incident(IncidentCreate(
            title="Test",
            description="Descripción de prueba.",
            category="lost_parcel",
            origin="customer",
            branch="central",
            status="resolved",
        ), MockRequest())

        with pytest.raises(HTTPException) as exc:
            await update_incident_status(
                created.id,
                IncidentStatusUpdate(status="in_progress"),
                MockRequest(),
            )
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_update_status_not_found(self, mock_db):
        """
        I-E16: update_status_not_found
        ID inexistente → 404
        """
        from routes.incidents import update_incident_status, IncidentStatusUpdate

        with pytest.raises(HTTPException) as exc:
            await update_incident_status(
                9999,
                IncidentStatusUpdate(status="in_progress"),
                MockRequest(),
            )
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_update_status_invalid_status_value_fails(self, mock_db):
        """
        I-E17: update_status_invalid_value
        Estado no válido → ValidationError
        """
        from routes.incidents import IncidentStatusUpdate
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            IncidentStatusUpdate(status="fake_status")