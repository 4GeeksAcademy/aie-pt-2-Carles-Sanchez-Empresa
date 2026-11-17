# Pitch de TrackFlow: guía principal

Este documento reúne el análisis completo para preparar un vídeo de pitch de aproximadamente cinco minutos. Los tres guiones alternativos están separados para poder practicarlos individualmente:

- [Caso A: intake y aprobación de RFP](caso-rfp.md)
- [Caso B: asistente de soporte](caso-asistente-soporte.md)
- [Caso C: reporting de almacén](caso-reporting.md)

## Tesis del pitch

> TrackFlow necesitaba dejar de depender de procesos manuales y de información dispersa; construí herramientas que conectan sus datos operativos con asistentes y flujos de trabajo, manteniendo controles humanos donde una decisión automática no debería ser definitiva.

## Qué proyecto vender

El monorepo tiene varias áreas y no caben todas en cinco minutos. La recomendación es contar una historia sobre una solución y usar las demás como contexto, no hacer un inventario de pantallas.

### Opción A — RFP y revisión humana (recomendada)

El flujo procesa una solicitud PDF, la divide por áreas, genera borradores y permite que responsables humanos revisen las secciones antes de publicar el documento final. Es el foco más diferenciador de la rama actual y permite explicar una decisión de ingeniería clara: automatizar el trabajo repetitivo, pero no la aprobación final.

**Precaución:** el briefing no describe explícitamente un flujo RFP ni un proceso de propuestas. Preséntalo como una herramienta comercial construida para TrackFlow, no como una necesidad escrita literalmente en el briefing.

### Opción B — Asistente de soporte para operaciones y políticas

El asistente del backoffice combina respuestas basadas en documentación oficial con consultas de incidencias e inventario. Puede pedir aclaraciones y manejar errores sin inventar el estado de un ticket o el stock. Enlaza directamente con el problema de consultas repetitivas descrito en el briefing.

**Precaución:** no afirmes que atiende WhatsApp, hace seguimiento de cualquier paquete o reemplaza a los 15 agentes. El código documenta límites concretos; por ejemplo, no hace búsquedas de tracking por falta de verificación de titularidad.

### Opción C — Reporting operativo

Un pipeline convierte eventos de inventario en KPIs semanales por almacén y cliente, y los muestra en el backoffice. Encaja con la necesidad de visibilidad entre Los Ángeles y Zaragoza.

**Precaución:** los KPIs son de inventario y desempeño operativo; no presentes el panel como el dashboard ejecutivo global de todos los KPIs del briefing.

### Recomendación práctica

Usa **RFP como la historia principal** si la pantalla se ve estable y puedes enseñar el recorrido completo. Si prefieres demostrar algo cuya necesidad está más explícita en el briefing, escoge **el asistente de soporte**. No intentes enseñar RFP, agente, dashboard, telemetría, forecast e inventario en profundidad: acabarías enumerando funcionalidades en vez de vender tu aportación.

## Guion general de cinco minutos

### 1. Introducción — unos 30 segundos

Empieza por el problema o el resultado, no por tu nombre.

**Apertura recomendada:**

> Cuando una operación logística depende de revisar documentos y coordinar varias áreas a mano, cada solicitud nueva puede convertirse en un cuello de botella. Soy Carles y construí para TrackFlow un flujo que convierte una solicitud comercial en borradores por departamento, con revisión humana antes de generar la propuesta final. Lo llamé flujo de intake y aprobación de RFP.

**Alternativa que adelanta el trade-off:**

> Una IA puede acelerar una propuesta comercial; la decisión de aprobarla debe seguir siendo de las personas responsables. Soy Carles y construí para TrackFlow un flujo que procesa solicitudes, organiza borradores por área y exige revisión antes de publicar el documento final.

Empieza a cámara. Después, al mencionar el flujo, corta al backoffice en `/rfp-intake`.

### 2. El problema y la oportunidad — 45–60 segundos

> TrackFlow opera en dos países y depende de que varias áreas coordinen almacén, transportistas, devoluciones y atención al cliente. El briefing describe procesos manuales y sistemas que no comparten una visión común. En una solicitud comercial, el reto es reunir información de distintas áreas sin perder condiciones importantes ni publicar una propuesta que nadie haya revisado. La oportunidad no es quitar a las personas del proceso: es reducir el trabajo repetitivo y hacer más visible qué falta y quién debe decidir.

Si usas RFP, enseña la lista de solicitudes y después un detalle con áreas y estados. No alargues esta sección con arquitectura.

**Alternativa si eliges el asistente de soporte:**

> El briefing dice que muchas consultas son repetitivas y que los agentes deben consultar documentación para responder. El coste no es solo el tiempo de cada respuesta: también existe el riesgo de contestar de forma inconsistente. Por eso enfoqué el asistente en recuperar información oficial y consultar datos operativos existentes, sin tratar cada pregunta como si pudiera resolverse con una respuesta inventada.

### 3. La solución de IA y demo — unos 2 minutos

Esta es la sección central. Muestra una aplicación funcionando y narra el flujo desde la perspectiva de quien la utiliza. El guion específico depende del caso elegido; consulta los documentos enlazados al principio.

Para el caso RFP, el recorrido recomendado es:

1. Abrir `/rfp-intake` y mostrar la carga del PDF o un ticket preparado.
2. Abrir el ticket y enseñar sus datos, secciones, borradores y preguntas abiertas.
3. Enseñar el estado de revisión y, si está preparado, el documento final descargable.

Explica la tecnología en función del valor, no como una lista:

- **Pipeline:** etapas explícitas de procesamiento, en vez de una única llamada opaca al modelo.
- **Workers asíncronos:** permiten procesar trabajo largo fuera de la petición web inmediata.
- **LangGraph y checkpoints:** el flujo puede pausarse y conservar estado para continuar una aprobación.
- **FastAPI y backoffice:** API para procesar y persistir el flujo; interfaz para subir, revisar y decidir.
- **Pruebas:** el repositorio contiene pruebas del flujo, permisos y aprobación. La prueba E2E de RFP documentada utiliza componentes simulados para el recorrido reproducible; no la describas como una validación de modelo en vivo.

### 4. Decisiones de ingeniería y retos — unos 45 segundos

> La decisión principal fue automatizar la preparación y la generación de borradores, pero no la aprobación final. Elegí aprobaciones por sección y una revisión humana final en vez de publicar automáticamente, porque una propuesta comercial puede contener compromisos sobre volumen, moneda o devoluciones. También añadí controles deterministas para ciertos conflictos y para contenido sospechoso en documentos de entrada; esos controles ayudan, pero no garantizan detectar toda instrucción maliciosa.

> El reto técnico fue coordinar etapas que pueden pausarse, reanudarse o terminar en revisión. Para eso separé el estado de negocio de la pausa del workflow, y añadí persistencia y pruebas para comprobar que aprobar un departamento no desbloquea por error los demás.

> De lo que estoy más orgulloso es de haber tratado la revisión humana como parte del diseño del sistema, no como una comprobación añadida al final.

**Trade-off en una frase:**

> Elegí una aprobación humana por sección más una revisión final, en vez de publicar automáticamente, porque el borrador puede incluir compromisos comerciales. El coste es que sigue habiendo intervención humana; el beneficio es que el flujo no confunde texto generado con una decisión autorizada.

### 5. Tu historia 4Geeks — cierre Q&A — 30–45 segundos

Las preguntas deben decirse exactamente como están escritas. Mira a cámara y deja dos segundos completos antes y después de cada respuesta. Repite cada pregunta en la frase para que el clip se entienda por sí solo.

**[Pausa de 2 segundos]**

> ¿Qué te hizo decidirte a estudiar Ingeniería de IA — y qué estuvo a punto de detenerte? Me hizo decidirme **[tu motivo real]**; lo que estuvo a punto de detenerme fue **[tu obstáculo real]**.

**[Pausa de 2 segundos]**

> ¿Hubo un momento, un proyecto o una persona durante el programa en el que todo encajó de verdad? Para mí, todo encajó cuando **[momento o proyecto real]**, porque vi cómo conectar una necesidad de negocio con una solución que se puede probar.

**[Pausa de 2 segundos]**

> ¿Qué le dirías a alguien que está indeciso sobre unirse a 4Geeks? Le diría que **[consejo que realmente darías]**, y que valore si quiere construir proyectos prácticos y aprender a explicar las decisiones que toma.

**[Pausa de 2 segundos antes de cortar.]**

Los campos entre corchetes quedan pendientes porque el repositorio no contiene tus motivos personales; no conviene inventarlos.

## Guiones alternativos por caso

Los documentos independientes tienen el guion completo y apuntes de demo. Esta sección conserva en esta guía las ideas centrales de las otras dos opciones.

### Opción B — Asistente de soporte

**Hook posible:**

> Cuando una consulta exige buscar en un documento, revisar un ticket y comprobar inventario, el agente de soporte pierde tiempo cambiando entre fuentes. Construí un asistente para el backoffice de TrackFlow que puede consultar documentación e información operativa existente, y que pide aclaración cuando no tiene suficiente información.

**Mini demo:** en `/knowledge`, muestra una pregunta sobre una política documentada y luego una pregunta sobre un ticket o producto con referencia clara. Opcionalmente, enseña una consulta ambigua que solicita precisión.

> El modelo decide qué fuente hace falta: documentación, incidencias, inventario o una combinación. La documentación se busca semánticamente en una base vectorial; tickets e inventario se consultan mediante herramientas de solo lectura contra las APIs existentes. Mantener estas fuentes separadas evita que el modelo trate una respuesta generada como si fuera un dato real del sistema.

**Trade-off:**

> Elegí que las referencias ambiguas pidan aclaración y que los datos operativos procedan de la API, en vez de dejar que el modelo estime esos datos. Puede añadir un turno, pero reduce respuestas operativas inventadas.

El repositorio registra una E2E del navegador para consultas de documentación, incidencias, inventario, consultas mixtas, autenticación inválida y un error de servicio controlado. Puedes decir que esos casos se verificaron; no que el asistente automatiza el 80% de consultas, porque ese porcentaje es una oportunidad mencionada en el briefing, no un resultado medido.

Consulta el [guion completo del asistente](caso-asistente-soporte.md).

### Opción C — Reporting de almacén

**Hook posible:**

> Si cada almacén mide las operaciones de forma distinta, cuesta comparar dónde se acumulan los problemas. Construí un pipeline que transforma eventos de inventario en indicadores semanales por cliente y almacén, y los presenta en el backoffice.

**Mini demo:** abre `/reporting`; enseña las cinco tarjetas KPI, la tendencia y el detalle por almacén y cliente.

> El pipeline lee eventos de inventario, agrupa los datos por almacén, cliente y semana, calcula las métricas y las publica de forma idempotente. Eso significa que volver a ejecutar el proceso para la misma clave actualiza el resultado en vez de duplicarlo.

> Separé el reporting de negocio del análisis de telemetría técnica, en vez de mezclarlos en un único endpoint, porque contestan preguntas diferentes: uno ayuda a entender las operaciones; el otro, el funcionamiento del sistema.

El reporting implementado es de rendimiento semanal de almacén y cliente. No lo presentes como dashboard ejecutivo completo ni atribuyas a la solución ahorros financieros sin una medición.

Consulta el [guion completo de reporting](caso-reporting.md).

## Habilidades que conviene resaltar

El pitch debería hacer visibles evidencias de estas habilidades, más que una lista de tecnologías:

1. **Entender el proceso de negocio:** partes de un dolor operativo y eliges un flujo demostrable.
2. **Integrar IA con sistemas reales:** no todo se resuelve preguntándole a un LLM; se combinan documentos, APIs, estado e interfaz.
3. **Diseñar límites y permisos:** datos sensibles, mutaciones y aprobaciones necesitan controles explícitos.
4. **Pensar en fallos:** pruebas, estados de error, recuperación y trazabilidad son parte de la solución.
5. **Explicar trade-offs:** qué se automatiza, qué no y por qué.
6. **Construir una solución vertical:** backoffice, API, pipeline, persistencia y validación, no solo un notebook o una interfaz de chat.

## Afirmaciones que conviene evitar

- **“La empresa ahora ahorra X horas o dinero.”** No hay medición de ahorro en lo revisado.
- **“Automatiza el 80% del soporte.”** El briefing plantea esa posibilidad; no es un resultado medido.
- **“El sistema de RFP es productivo o está desplegado.”** Hay implementación y pruebas documentadas, pero también pendientes de producción.
- **“Los controles detectan cualquier prompt injection.”** Las pruebas son defensas deterministas, no una garantía completa frente a modelos o documentos reales.
- **“El forecast predice con certeza los ingresos.”** Su documentación advierte limitaciones, datos consolidados y una banda que no es una garantía calibrada.
- **“Construí la app de RR. HH. de TrackFlow.”** No se encontró un producto de onboarding o RR. HH. implementado. El Talent Pipeline Tracker está orientado a candidaturas y no equivale al portal de Personas del briefing.
- **“Implementé selección automática de transportista o aprobación automática de devoluciones.”** Hay skills documentadas, pero la auditoría del repositorio advierte que no se confirmó un motor productivo para esos procesos.
- **“Todo el sistema está terminado.”** El repositorio registra tareas y verificaciones pendientes; delimita qué demuestras y qué está probado.

## Pendiente para pulir el guion

1. Elegir el foco: RFP es el trabajo visible de la rama actual; soporte conecta de forma más directa con el briefing.
2. Confirmar qué recorrido puede ejecutarse durante la grabación: PDF y ticket RFP, o asistente con datos de demo.
3. Completar las respuestas personales del Q&A con motivos y experiencias reales.
4. Decidir si se presenta el trabajo de la rama actual o el recorrido completo del proyecto TrackFlow. El estado actual es `feature/nist-security-practices`; si el pitch resume el proyecto completo, conviene decirlo claramente.