"""
trackflow_shared — Lógica compartida de TrackFlow para incidencias.

Submódulos:
  - incident_enums:       StatusEnum, OriginEnum, CategoryEnum, BranchEnum
  - incident_validation:  validate_incident_record() para el modelo del gestor
  - incident_transforms:  transform_csv_row() para mapeo CSV → modelo
  - legacy:               Constantes y validación del analizador CSV original
"""

from .incident_enums import (
    IncidentStatus,
    IncidentOrigin,
    IncidentCategory,
    IncidentBranch,
)

from .incident_validation import (
    validate_incident_record,
    VALID_TRANSITIONS,
)

from .incident_transforms import (
    transform_csv_row,
    STATUS_MAP,
    CATEGORY_MAP,
    BRANCH_MAP,
)

__all__ = [
    "IncidentStatus",
    "IncidentOrigin",
    "IncidentCategory",
    "IncidentBranch",
    "validate_incident_record",
    "VALID_TRANSITIONS",
    "transform_csv_row",
    "STATUS_MAP",
    "CATEGORY_MAP",
    "BRANCH_MAP",
]