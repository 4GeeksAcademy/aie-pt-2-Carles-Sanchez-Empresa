# Caso A — Intake y aprobación de RFP

## Idea que debe recordar quien entrevista

Construí un flujo que convierte una solicitud comercial en borradores por departamento y mantiene la revisión y aprobación final en manos humanas.

## Por qué elegir este caso

Es el foco más diferenciador del trabajo reciente. Permite mostrar IA integrada con una interfaz de trabajo, un proceso asíncrono, estados persistidos y decisiones humanas. Los últimos cambios también refuerzan cómo el flujo maneja clasificación incompleta y fallos de generación.

**Límite de contexto:** el briefing de TrackFlow no describe explícitamente un proceso RFP. Preséntalo como una herramienta comercial construida para la empresa, no como una necesidad mencionada literalmente en el briefing.

## Guion de cinco minutos

### 1. Introducción — 30 segundos

> Cuando una operación logística depende de revisar documentos y coordinar varias áreas a mano, cada solicitud nueva puede convertirse en un cuello de botella. Soy Carles y construí para TrackFlow un flujo que convierte una solicitud comercial en borradores por departamento, con revisión humana antes de generar la propuesta final. Lo llamé flujo de intake y aprobación de RFP.

**Alternativa con trade-off desde el inicio:**

> Una IA puede acelerar una propuesta comercial; la decisión de aprobarla debe seguir siendo de las personas responsables. Soy Carles y construí para TrackFlow un flujo que procesa solicitudes, organiza borradores por área y exige revisión antes de publicar el documento final.

**Pantalla:** empieza a cámara; luego abre el backoffice en `/rfp-intake`.

### 2. Problema y oportunidad — 45–60 segundos

> TrackFlow opera en dos países y depende de que varias áreas coordinen almacén, transportistas, devoluciones y atención al cliente. El briefing describe procesos manuales y sistemas que no comparten una visión común. En una solicitud comercial, el reto es reunir información de distintas áreas sin perder condiciones importantes ni publicar una propuesta que nadie haya revisado. La oportunidad no es quitar a las personas del proceso: es reducir el trabajo repetitivo y hacer más visible qué falta y quién debe decidir.

**Pantalla:** lista de tickets; después, detalle de uno con áreas y estados. No digas que el briefing pedía expresamente RFP.

### 3. Solución y demo — unos 2 minutos

> Este es el backoffice de TrackFlow. Una solicitud PDF entra como un ticket. El sistema procesa el documento, extrae la información relevante y la organiza en secciones de trabajo para los departamentos implicados. Después se generan borradores y preguntas abiertas para que quien revisa vea tanto la propuesta como lo que aún falta por aclarar.

> Si el PDF no produce texto suficiente para procesarse, el flujo conserva la solicitud y la marca para revisión manual en vez de tratarla como una clasificación segura. También puede pedir revisión cuando no logra asignar un departamento compatible. No infiere automáticamente departamentos que el clasificador no haya asignado.

**Recorrido en pantalla:**

1. Enseña la carga del PDF o usa un ticket preparado para la demo.
2. Abre el detalle y muestra los datos extraídos, las secciones, los borradores y las preguntas abiertas.
3. Muestra estados y aprobaciones por sección. Si decides enseñar una decisión, una aprobación mantiene cada sección independiente; una solicitud de cambios regenera la sección elegida y tanto los cambios como los rechazos departamentales requieren un comentario.
4. En la revisión humana final, enseña la edición de volumen/moneda o de un borrador. Para cerrar la historia, muestra el documento final aprobado; usa un ticket preparado para no invertir el tiempo del vídeo esperando la generación.

> La parte de IA está dentro de un flujo controlado: no es un chat libre que escribe directamente en el sistema. El backend coordina las etapas y mantiene el estado del proceso. Si el contenido requiere revisión, el ticket puede pasar a esa etapa; las secciones tienen aprobaciones independientes y las solicitudes de cambios pueden volver a generar solo la sección afectada.

> Cuando todas las secciones activas están aprobadas y no hay conflictos bloqueantes, el ticket pasa a revisión humana final; eso no publica todavía la propuesta. La persona revisora puede editar campos permitidos, solicitar una nueva vuelta de aprobación, devolver el ticket al cliente o aprobar. Solo al aprobar se compone y guarda el documento final.

> Si falla la generación de una sección, el flujo puede dejar un borrador explícito que indica que requiere revisión y que no se han asumido precios, capacidades ni compromisos no confirmados. Así el fallo no se disfraza de una respuesta correcta.

**Explicación técnica en lenguaje sencillo:**

- El pipeline divide el trabajo en etapas visibles en lugar de una única llamada opaca al modelo.
- Los workers permiten procesar trabajo largo fuera de la petición web inmediata.
- LangGraph y los checkpoints permiten pausar el flujo y conservar su estado para continuar una aprobación.
- FastAPI expone la lógica y el backoffice permite cargar, revisar y decidir.
- Hay pruebas de flujo, permisos y aprobación. El ejemplo E2E de RFP documentado usa componentes simulados; no lo presentes como prueba del modelo en vivo.

### 4. Decisiones y reto — 45 segundos

> La decisión principal fue automatizar la preparación y la generación de borradores, pero no la aprobación final. Elegí aprobaciones por sección y una revisión humana final en vez de publicar automáticamente, porque una propuesta comercial puede contener compromisos sobre volumen, moneda o devoluciones. También añadí controles deterministas para ciertos conflictos y para contenido sospechoso en documentos de entrada; esos controles ayudan, pero no garantizan detectar toda instrucción maliciosa.

> El reto técnico fue manejar entradas imperfectas y fallos parciales sin perder el control del proceso. Si el PDF no aporta texto suficiente o no se puede asignar a un departamento compatible, el flujo pide revisión manual en vez de presentar una clasificación como segura. Si falla la generación de un área, deja un placeholder transparente. Además, las aprobaciones por departamento se pueden pausar y reanudar sin que aprobar una sección desbloquee las demás.

> De lo que estoy más orgulloso es de haber diseñado la revisión humana y los casos de fallo como parte del flujo, no como una comprobación añadida al final.

**Versión corta del trade-off:**

> Elegí una aprobación humana por sección más una revisión final, en vez de publicar automáticamente, porque el borrador puede incluir compromisos comerciales. El coste es que sigue habiendo intervención humana; el beneficio es que el flujo no confunde texto generado con una decisión autorizada.

**Versión alternativa, más técnica y concreta:**

> Elegí enviar una clasificación incompleta a revisión con baja confianza y mostrar un borrador-placeholder cuando falla una generación, en vez de descartar el ticket o rellenar datos por inferencia. Se sacrifica automatización completa para no ocultar incertidumbre ni presentar compromisos inventados.

### 5. Q&A — 30–45 segundos

Graba a cámara, con dos segundos de silencio antes y después de cada respuesta. No improvises ni inventes las partes personales.

**[Pausa de 2 segundos]**

> ¿Qué te hizo decidirte a estudiar Ingeniería de IA — y qué estuvo a punto de detenerte? Me hizo decidirme **[tu motivo real]**; lo que estuvo a punto de detenerme fue **[tu obstáculo real]**.

**[Pausa de 2 segundos]**

> ¿Hubo un momento, un proyecto o una persona durante el programa en el que todo encajó de verdad? Para mí, todo encajó cuando **[momento real]**, porque vi cómo conectar una necesidad de negocio con una solución que se puede probar.

**[Pausa de 2 segundos]**

> ¿Qué le dirías a alguien que está indeciso sobre unirse a 4Geeks? Le diría que **[consejo propio]**, y que valore si quiere construir proyectos prácticos y aprender a explicar las decisiones que toma.

**[Pausa de 2 segundos antes de cortar.]**

## Evidencia y límites

- El backoffice tiene una vista de intake RFP, detalle, estados de procesamiento, secciones y controles de aprobación.
- El flujo admite aprobaciones por sección y una revisión humana final antes de generar el documento aprobado.
- Las solicitudes de cambio de un aprobador departamental vuelven a generar solo esa sección; requieren comentario. La solicitud de cambios desde la revisión final abre una nueva ronda para las secciones activas.
- El rechazo departamental requiere motivo y bloquea la aprobación final. La persona revisora final puede editar campos permitidos, devolver al cliente, archivar/descartar o aprobar.
- Si el PDF produce texto insuficiente, o no se asigna un departamento compatible, el flujo puede dejar la solicitud para revisión manual. No afirma que los departamentos omitidos se infieran automáticamente.
- La documentación registra pruebas de API y flujo end-to-end con componentes simulados.
- El backend restringe estas decisiones a usuarios admin, pero el nombre del aprobador departamental enviado por la interfaz no equivale a una identidad verificada por SSO. No afirmes que existe una separación de funciones certificada.
- Siguen pendientes de verificar para producción, entre otros, identidad de aprobadores ligada a SSO, idempotencia/concurrencia, almacenamiento durable multi-instancia y migración real en staging. No afirmes despliegue productivo.
- El ejemplo ModaViva de `docs/RFP_HUMAN_REVIEW_PR_EXAMPLE.md` es una prueba determinista con conversor, clasificador, workers y generador simulados. Sirve para explicar el flujo, pero no es una demo de IA en vivo.
- No afirmes que está desplegado en producción ni que se midió ahorro de tiempo o dinero.

## Preparación de la demo

- Arranca la demo en frío antes del día de grabación. Comprueba backoffice, API, worker/Celery, almacenamiento y los servicios externos que realmente use el intake; confirma que la cuenta tiene permisos admin.
- Prepara un PDF ficticio, sin datos personales ni secretos, con país, servicios, volumen y moneda claros y al menos dos áreas relevantes. Ten una segunda copia para probar la carga sin alterar el ticket de demostración.
- Haz una ejecución real con el entorno configurado antes de grabar. Confirma la conversión del PDF, el estado del ticket, la generación de borradores y el acceso a la revisión. No des por hecho que el ejemplo simulado de tests será visible en la UI.
- Ten un ticket preprocesado como respaldo para mostrar las secciones, aprobaciones y revisión final sin esperar al modelo durante la grabación.
- Guioniza un solo camino de decisión: lo más limpio es enseñar dos secciones aprobadas, editar un campo en la revisión final y aprobar para abrir el documento. Si quieres mostrar el nuevo ciclo de cambios, usa otro ticket y enseña una única sección; no intentes cubrir aprobación, rechazo, devolución y archivo en dos minutos.
- Si enseñas `request_changes` de la revisión final, explica que reinicia la aprobación de las secciones activas. No lo confundas con el cambio solicitado por un departamento, que regenera solo su sección.
- No pulses “devolver al cliente” en el ticket que necesitas aprobar: el flujo de reenvío del cliente no está automatizado.
- Evita mostrar credenciales, datos reales de clientes o secretos del entorno.