# TrackFlow — Línea base de auditoría OWASP Top 10

**Fecha de captura:** 2026-11-14  
**Rama:** `feature/owasp-top10-audit`  
**Tipo:** evaluación estática inicial; no incluye aún correcciones ni pruebas dinámicas.  
**Estado:** línea base previa a las correcciones de esta auditoría.

## 1. Resumen y límites de evidencia

Se inspeccionaron la configuración Compose, el backend FastAPI, los agentes/RAG, el servidor MCP, los workflows y pruebas/documentación seleccionados. No se modificó código para esta captura. El inventario de puertos refleja `docker compose config` del entorno local, no escaneo de red ni exposición a Internet. No se tuvo acceso al host Linux/servidor, a un despliegue productivo, al proveedor de secretos, a los acuerdos de terceros ni a datos productivos.

El repositorio tiene un `.env` ignorado por Git; no se leyó ni se copia su contenido a este informe. `git ls-files` mostró `.env.example` y `services/api/.env.example`, no `.env` ni otros archivos con patrón de entorno. `git status --short --branch` indicó la rama anterior a los cambios documentales de este informe, sin cambios rastreados; los directorios locales ignorados incluían `.env`, `.venv`, cachés y `node_modules`. `git diff --check` no informó problemas antes de crear este archivo. Esta captura no es una certificación de que el `.env` no contenga secretos válidos.

## 2. Servidor y puertos — estado observado

### Acceso administrativo

**No verificado.** El repositorio y el entorno de desarrollo no demuestran si SSH permite login como root, qué usuario utiliza el operador, qué carpetas existen en el host o qué reglas de firewall aplican. No se ejecutó ningún cambio remoto.

### Puertos publicados por Docker Compose

La configuración Compose efectiva declara estos puertos de host, todos sin una dirección de host explícita (Compose normalmente los publica en todas las interfaces disponibles):

| Servicio | Puerto publicado → contenedor | Evaluación inicial |
|---|---:|---|
| Interfaces | 3000 → 3000, 3001 → 3001 | Frontends de desarrollo Next.js; no asumir aptos para exposición pública. |
| API | 8000 → 8000 | API FastAPI; el alcance público esperado del briefing requiere decidir si se publica directamente o tras proxy HTTPS. |
| Flower | 5555 → 5555 | Interfaz operativa; publicación host innecesaria para producción salvo necesidad y controles explícitos. |
| Redis | 6379 → 6379 | Servicio interno; no debería exponerse públicamente. |
| Qdrant | 6333 → 6333, 6334 → 6334 | Servicio interno/vectorial; no debería exponerse públicamente. |
| Worker | Ninguno | Sin puertos publicados por este servicio en Compose. |

La red declarada es una bridge de Docker. Los puertos publicados por Compose no prueban accesibilidad desde Internet; debe verificarse firewall del host, reglas cloud, proxy, DNS, visibilidad del Codespace y servicios en escucha. La orientación del briefing es HTTPS para API/frontend y SSH para operaciones, pero falta identificar puertos y arquitectura de producción concretos.

## 3. Inventario de IA y propietarios preliminares

Los propietarios de negocio se asignan según el organigrama aportado por el usuario. El usuario del monorepo es responsable de coordinar los cambios de este proyecto; Andrés Kim/Equipo de Tecnología mantiene los controles de plataforma y aplicación. Las asignaciones técnicas/personales deben confirmarse con la organización.

| Componente | Estado comprobado en fork / función | Responsable de negocio | Responsable técnico / tercero |
|---|---|---|---|
| Agente CX / soporte | Implementado en `services/support_agent/`; atiende preguntas y usa RAG, herramientas de incidencias/inventario y memoria de soporte. | Valentina Cruz | Andrés Kim + equipo de Tecnología. Proveedor LLM/gateway opera modelo/servicio; TrackFlow controla prompt, datos enviados, ACL y validación. |
| RAG de conocimiento | Implementación en `data/pipelines/rag.py` y corpus `docs/company-knowledge-base/`; recupera documentación para respuestas. | Valentina Cruz (uso CX); Miguel Torres para contenido B2B/confidencial, sujeto a confirmación | Andrés Kim + equipo de Tecnología. Proveedores de embeddings/modelo/vector DB tienen responsabilidades contractuales que revisar. |
| Herramientas y servidor MCP | Implementados en `mcps/trackflow_tools_mcp/`; expone herramientas OAuth con lecturas de inventario e incidencias y operaciones de incidencias. | Ana Whitfield (inventario de almacén) / Carlos Vega (incidencias logísticas), según herramienta | Andrés Kim + equipo de Tecnología. Terceros OAuth/infraestructura bajo revisión contractual. |
| Selección de carrier | Existe skill `skills/carrier-selection-optimizer/`; no se confirmó en esta captura un servicio desplegado que confirme despachos. | Carlos Vega | Andrés Kim + equipo de Tecnología. Los couriers son terceros para transporte e integración; revisar control de credenciales/API. |
| Triage/aprobación de devoluciones | Existe skill `skills/returns-triage-assistant/`; el motor automático descrito por briefing no se confirmó como servicio productivo en el código inspeccionado. | Sofía Ramos | Andrés Kim + equipo de Tecnología. Proveedor LLM/gateway si se invoca; TrackFlow retiene control de reglas, autorización y decisión final. |
| Workflows RFP/intake/aprobación | Implementados en `data/pipelines/rfp_*` y endpoints/worker; generan propuestas y requieren gates de aprobación humana en el flujo RFP. No equivale a aprobación de devoluciones. | Miguel Torres (relación comercial); Ana Whitfield y Carlos Vega según sección; confirmar proceso | Andrés Kim + equipo de Tecnología. Proveedor LLM/gateway y extracción PDF: tercero; TrackFlow controla documentos, permisos, revisión y publicación. |
| Celery/worker y tareas | `services/celery_app.py`, `services/job_runner.py` y pipelines ejecutan tareas asíncronas; no se identificó agente autónomo adicional en esta captura. | Dueño del proceso que inicia la tarea | Andrés Kim + equipo de Tecnología; Redis/infraestructura si administrados por tercero. |

**Responsabilidad de terceros:** el proveedor controla disponibilidad y seguridad de la parte de servicio que opera según contrato; TrackFlow mantiene responsabilidad de selección/configuración, gestión de credenciales, minimización y autorización de datos, permisos de herramientas, validación de salidas, revisión humana y uso de resultados. Contratos, retención y subprocesadores aún no verificados.

**Datos relevantes del briefing:** direcciones/contacto de destinatarios B2C y datos contractuales/de volumen B2B. La evidencia de pruebas debe ser sintética o redactada. Propietarios adicionales: Ana Whitfield (almacén), Sofía Ramos (logística inversa), Miguel Torres (comercial), Rafael Sanz (Personas), Thomas Espinoza (CEO); Personas y Dirección se incorporarán cuando el inventario de datos/procesos identifique responsabilidades directas.

## 4. Matriz OWASP Top 10:2021 — evaluación estática inicial

Las severidades son una clasificación de triage preliminar, no CVSS ni aceptación final de riesgo. Las categorías marcadas «pendiente» requieren inspección adicional o prueba dinámica.

| Categoría | Aplica | Hallazgo y evidencia inicial | Severidad preliminar | Estado |
|---|---|---|---|---|
| **A01 Broken Access Control** | Sí | El agente CX ya rechaza explícitamente lookups de tracking que no tienen verificación de propiedad (`services/support_agent/guardrails.py`, `_TRACKING_LOOKUP`). Su documentación confirma que el agente no consulta tracking por falta de verificación de ownership. MCP exige scopes OAuth por herramienta, y sus pruebas cubren denegaciones. Falta demostrar ACL de pedidos B2C y aislamiento multi-tenant B2B en datos reales/rutas aplicables. | Alta / pendiente | No corregir aún; verificar permisos efectivos en API, MCP y cualquier portal B2B. |
| **A02 Cryptographic Failures** | Sí | Variables de entorno/credenciales se configuran para integración MCP; `.env` local está ignorado y las plantillas están versionadas. No se inspeccionó el valor de ningún secreto. No se verificó TLS de despliegue ni la ausencia de secretos en todo el historial Git/builds. | Alta / pendiente | Escaneo seguro de patrones, revisión de transporte/despliegue y rotación si procede. |
| **A03 Injection** | Sí | Hay guardrail determinista de jailbreak de entrada y prueba reproducible `test_instruction_change_variants_are_rejected_before_routing` en `tests/pipelines/test_support_agent.py`. RFP documenta como no confiable el contenido PDF y pruebas de detección que fuerzan revisión manual (`tests/pipelines/test_rfp_pipeline.py`). Estas pruebas cubren patrones conocidos, no neutralización general de prompt injection indirecta. Falta probar instrucción hostil en documento RAG/resultado de herramienta. | Alta / pendiente | Ampliar pruebas adversariales con fixture sintético y verificar que no genera llamadas/acciones. |
| **A04 Insecure Design** | Sí | RFP tiene flujo explícito de aprobación/revisión humana y controles descritos en `docs/rfp-intake-security.md`; pruebas RFP validan aprobadores y revisión. No se encontró prueba equivalente de confirmación humana para las acciones irreversibles específicas del briefing (devoluciones de alto valor, despacho de alto valor, cambio de carrier en tránsito, compartir datos B2B). Skills existentes no prueban por sí mismas un flujo productivo. | Alta / pendiente | Mapear acciones productivas, propietarios y umbrales; asegurar gate humano verificable. |
| **A05 Security Misconfiguration** | Sí | `docker-compose.yml` publica API y frontends, además de Flower, Redis y Qdrant; las interfaces ejecutan `next dev`. `services/api/main.py` configura CORS `allow_origins=["*"]` (credenciales deshabilitadas) y añade cabeceras de seguridad, pero no HSTS. Configuración de producción, depuración, TLS, hosts y firewall no inspeccionada. | Alta en caso de despliegue público inadvertido; impacto pendiente | Restringir puertos por entorno y revisar configuración productiva. No aplicar cambios de red sin acceso/plan aprobado. |
| **A06 Vulnerable and Outdated Components** | Sí | Hay dependencias Python/npm y lockfiles; no se ejecutó escaneo de advisories ni comprobación de soporte/versiones por limitación de alcance de esta línea base. | Pendiente | Ejecutar auditoría reproducible de dependencias e imágenes, registrar advisories. |
| **A07 Identification and Authentication Failures** | Sí | La API usa autenticación JWT y MCP OAuth; las pruebas documentan denegaciones. Agente `/agent/query` exige usuario activo inyectado por la API. WebSocket recibe token en query parameter (`services/support_agent/chat_api.py`); los tokens en URL pueden acabar en logs/proxies. Se debe probar expiración, revocación, sesiones, origen WebSocket y redacción de URLs/logs. | Media-alta / pendiente | Revisar transporte de token WebSocket y probar controles de autenticación/sesión. |
| **A08 Software and Data Integrity Failures** | Sí | Dependencias fijadas parcialmente mediante lockfiles; Compose usa imagen `qdrant/qdrant:latest`, etiqueta mutable. No se verificó política de revisión de dependencias, firma/provenance de imágenes ni integridad de artefactos. | Media / pendiente | Pinning por versión/digest y controles de cadena de suministro. |
| **A09 Security Logging and Monitoring Failures** | Sí | El agente persiste trazas estructuradas por nodo con razón/resultado en `services/support_agent/runtime.py`; MCP registra `mcp_tool_invocation` sin payload/token en `mcps/trackflow_tools_mcp/server.py`. El API tiene logs de latencia y guardrails. No se verificaron persistencia/retención/alertas/controles de acceso a logs ni se evidenció almacenamiento operacional durable para todos los eventos. | Media / pendiente | Verificar backend de logs, retención, alertas y protección de datos. |
| **A10 SSRF** | Pendiente | MCP llama a una base URL configurada y las herramientas del agente usan endpoints configurados; no se observó en esta captura una URL arbitraria aceptada directamente del usuario. Falta revisar todos los fetchers, redirects, parsers de URL y conectores, y probar destinos internos en aislamiento. | Pendiente | No declarar no aplica hasta completar búsqueda y pruebas. |

## 5. Controles agénticos y pruebas observadas

- **Entrada:** `QueryRequest` limita pregunta a 10 000 caracteres y rechaza campos extra; el WebSocket limita mensajes a 10 000 caracteres. Guardrails CX rechazan patrones de cambio de instrucciones y peticiones de tracking que no pueden autorizar.
- **Prompt injection directa reproducible:** existen cuatro variantes parametrizadas de intento de jailbreak que verifican rechazo antes de invocar el router. Esto verifica la política determinista local; no prueba comportamiento de un LLM vivo.
- **Prompt injection documental:** RFP trata documentos como datos no confiables y prueba detección de variantes explícitas; su documentación reconoce que la detección por patrones no es completa.
- **Trazabilidad:** runtime del agente persiste secuencia de nodos, fuente, estado y razón; MCP emite evento estructurado por invocación. Falta confirmar persistencia/retención del logging en despliegue.
- **Rate limiting:** la inspección de código y búsquedas no encontró un limitador implementado para `/agent/query` o chat. Debe considerarse **no verificado/posible brecha**, y comprobarse con pruebas antes de dar por satisfecho el criterio.
- **Acciones irreversibles:** RFP tiene aprobación humana en su propio ciclo; no se confirmó control operativo de aprobación para las cuatro acciones TrackFlow del briefing. Debe permanecer abierto.
- **Data leakage cross-tenant:** no probado dinámicamente; requiere casos sintéticos B2C y B2B y confirmar ACL de identidad, pedido, cliente/marca y herramientas.

## 6. Marco de negocio y regulación aplicable

De acuerdo con el briefing TrackFlow aportado por el usuario:

- **RGPD (España/UE):** datos de clientes finales y marcas cliente; notificación a la AEPD dentro de 72 horas ante brecha con riesgo para los derechos de las personas, según el briefing.
- **CCPA/CPRA (California):** derechos de acceso, eliminación y opt-out, y notificación razonablemente rápida ante brechas, según el briefing.
- Datos de mayor sensibilidad: direcciones/contacto B2C y datos contractuales/de volumen B2B confidenciales por contrato.

Este informe no es asesoramiento legal ni determina aplicabilidad contractual por producto; las obligaciones se reflejan según el briefing y deben validarse con el responsable de privacidad/legal.

## 7. Acciones NIST iniciales y brechas

| Función NIST | Acción concreta priorizada |
|---|---|
| **Govern** | Confirmar propietarios de negocio/técnicos y responsabilidad de proveedores; aprobar política de revisión humana para acciones de alto impacto. |
| **Identify** | Completar inventario de IA, flujos B2C/B2B, puertos y dependencias, incluyendo dueños, terceros y datos tratados. |
| **Protect** | Eliminar exposición host innecesaria, aplicar mínimo privilegio, revisar ACL multi-tenant y añadir rate limiting al endpoint de modelo. |
| **Detect** | Confirmar logs durables del agente/MCP, retención, acceso restringido y alertas para denegaciones/anomalías. |
| **Respond** | Preparar procedimiento de incidente con evaluación de riesgo, escalamiento a responsables y notificación alineada a RGPD/AEPD 72h y CCPA/CPRA. |
| **Recover** | Documentar restauración y probar recuperación de datos/servicios sin restaurar secretos comprometidos; registrar validación posterior. |

Brechas aún no corregidas: acceso/puertos del host no comprobados; ACL B2C/B2B sin prueba E2E; revisión indirecta de prompt injection incompleta; rate limiting no encontrado; aprobación humana de acciones irreversibles no demostrada; TLS/secretos y dependencias sin verificación completa; configuración y retención de logs pendiente; SSRF pendiente de prueba.

## 8. Evidencia y siguiente fase

Evidencia estática referenciada: `docker-compose.yml`, `services/api/main.py`, `services/support_agent/{api.py,chat_api.py,guardrails.py,runtime.py}`, `mcps/trackflow_tools_mcp/server.py`, `tests/pipelines/test_support_agent.py`, `tests/pipelines/test_rfp_pipeline.py`, `docs/rfp-intake-security.md`, `mcps/trackflow_tools_mcp/README.md` y lockfiles.

Próximos pasos: ejecutar inventario ampliado de secretos sin imprimir valores; escaneo de dependencias; pruebas de autorización B2C/B2B, inyección indirecta y rate limiting; revisar las rutas de acción irreversibles; obtener evidencia segura del host/firewall. Las correcciones empezarán después de conservar y validar esta línea base.