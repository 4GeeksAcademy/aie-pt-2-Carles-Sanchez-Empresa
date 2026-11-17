# Caso B — Asistente de soporte para operaciones y políticas

## Idea que debe recordar quien entrevista

Construí un asistente en el backoffice que combina documentación oficial con consultas de incidencias e inventario, y separa las respuestas generadas de los datos operativos.

## Por qué elegir este caso

Conecta directamente con el briefing: muchas consultas de clientes son repetitivas y los agentes consultan documentación para contestar. También es fácil mostrarlo en una demo breve.

**Límite:** no afirmes que atiende WhatsApp, que hace seguimiento de cualquier paquete o que sustituye a los 15 agentes. El agente no realiza búsquedas de tracking porque no existe verificación de titularidad disponible en ese flujo.

## Guion de cinco minutos

### 1. Introducción — 30 segundos

> Cuando una consulta exige buscar en un documento, revisar un ticket y comprobar inventario, el agente de soporte pierde tiempo cambiando entre fuentes. Soy Carles y construí un asistente para el backoffice de TrackFlow que puede consultar documentación e información operativa existente, y que pide aclaración cuando no tiene suficiente información.

**Pantalla:** empieza a cámara y luego abre `/knowledge` en el backoffice.

### 2. Problema y oportunidad — 45–60 segundos

> El briefing describe consultas repetitivas atendidas por personas y documentación consultada manualmente. El reto es responder con rapidez sin mezclar una política oficial con el estado real de un ticket o el stock de un producto. La oportunidad es ayudar al agente a encontrar la fuente correcta, sin presentar una respuesta del modelo como si fuera un dato confirmado del sistema.

**Pantalla:** muestra brevemente el panel del asistente y las preguntas sugeridas de políticas.

### 3. Solución y demo — unos 2 minutos

> El asistente decide qué fuente necesita: documentación, incidencias, inventario o una combinación. Para preguntas de política, recupera fragmentos de una base documental. Para tickets e inventario, consulta las APIs existentes mediante herramientas de solo lectura. Después presenta una respuesta en el mismo espacio de trabajo.

**Recorrido recomendado:**

1. Pregunta por una política documentada, por ejemplo transportistas, SLA o devoluciones.
2. Pregunta por un ticket o producto usando una referencia clara.
3. Si la demo está preparada, enseña una consulta ambigua que lleva al asistente a pedir precisión.

> La documentación se busca semánticamente en Qdrant: en vez de buscar solo palabras exactas, el sistema intenta recuperar fragmentos relacionados con el significado de la pregunta. Los datos operativos siguen otra ruta y se devuelven de forma estructurada. Si un producto no se puede identificar de forma inequívoca, el asistente pide aclaración en vez de sumar o adivinar existencias.

> También puede combinar fuentes, por ejemplo un ticket con una política. Si una fuente falla, el flujo puede conservar la información disponible de la otra y comunicar el límite en vez de inventar una respuesta.

**Conceptos técnicos explicados para una audiencia no técnica:**

- RAG: recuperar documentación relevante antes de redactar una respuesta.
- LangGraph: coordinar pasos distintos, como clasificar la pregunta, consultar datos y generar la respuesta.
- Herramientas de lectura: conectores a las APIs que consultan tickets o inventario sin modificarlos.
- JWT: la sesión del usuario permite autenticar la petición al backend.
- Trazas: permiten inspeccionar qué pasos y fuentes recorrió una ejecución.

### 4. Decisiones y reto — 45 segundos

> Elegí que los datos operativos se devuelvan de forma estructurada y que las preguntas ambiguas pidan aclaración, en vez de dejar que el modelo adivine. Eso puede añadir un turno más, pero reduce el riesgo de inventar un stock o un estado. También separé el contexto documental de los datos de tickets e inventario: cada fuente conserva su función y su nivel de confianza.

> El reto técnico fue coordinar fuentes con fallos distintos sin perder la respuesta que sí se puede dar. El flujo tiene rutas de fallback para datos no encontrados, errores de autorización o servicios no disponibles.

> De lo que estoy más orgulloso es de que el asistente no sea solo una caja de texto: conecta con fuentes existentes y comunica cuándo necesita más información.

### 5. Q&A — 30–45 segundos

Graba a cámara, con dos segundos de silencio antes y después de cada respuesta. Completa con experiencias reales.

**[Pausa de 2 segundos]**

> ¿Qué te hizo decidirte a estudiar Ingeniería de IA — y qué estuvo a punto de detenerte? Me hizo decidirme **[tu motivo real]**; lo que estuvo a punto de detenerme fue **[tu obstáculo real]**.

**[Pausa de 2 segundos]**

> ¿Hubo un momento, un proyecto o una persona durante el programa en el que todo encajó de verdad? Para mí, todo encajó cuando **[momento real]**, porque vi cómo conectar IA con datos y necesidades de un negocio.

**[Pausa de 2 segundos]**

> ¿Qué le dirías a alguien que está indeciso sobre unirse a 4Geeks? Le diría que **[consejo propio]**, y que piense si le interesa construir soluciones prácticas y aprender a comunicarlas.

**[Pausa de 2 segundos antes de cortar.]**

## Evidencia que puedes citar

El repositorio contiene evidencia E2E del backoffice en escritorio y móvil. Los casos documentados incluyen consultas de documentación, ticket, inventario, consultas combinadas, ticket inexistente, autenticación inválida y recuperación tras un error 503 controlado. Las pruebas indican que los datos operativos no se modificaron durante esos casos.

Puedes decir: **“Verifiqué estos recorridos en una prueba E2E documentada.”** No digas que automatiza el 80% de consultas: ese porcentaje aparece como oportunidad en el briefing, no como resultado medido del proyecto.

## Trade-off principal

> Elegí que las referencias ambiguas pidan aclaración y que los datos operativos procedan de la API, en vez de dejar que el LLM estime o complete esos datos. Puede añadir un paso, pero reduce respuestas operativas inventadas.

## Preparación de la demo

- Prepara una pregunta de política y una consulta operativa con datos conocidos.
- Deja abierta una sesión autenticada y confirma que API, Qdrant y gateway de modelos están disponibles.
- No uses información personal o datos de cliente reales en pantalla.
- No afirmes que hay cobertura de tracking de paquetes ni canales de WhatsApp.