# Caso A — Intake y aprobación de RFP

## Idea que debe recordar quien entrevista

Construí un flujo que convierte una solicitud comercial en borradores por departamento y mantiene la revisión y aprobación final en manos humanas.

## Por qué elegir este caso

Es el foco más diferenciador de la rama actual. Permite mostrar IA integrada con una interfaz de trabajo, un proceso asíncrono, estados persistidos y decisiones humanas.

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

**Recorrido en pantalla:**

1. Enseña la carga del PDF o usa un ticket preparado para la demo.
2. Abre el detalle y muestra los datos extraídos, las secciones, los borradores y las preguntas abiertas.
3. Muestra estados y aprobaciones por sección.
4. Si el recorrido está listo, enseña el resultado de la revisión humana y el documento final descargable.

> La parte de IA está dentro de un flujo controlado: no es un chat libre que escribe directamente en el sistema. El backend coordina las etapas y mantiene el estado del proceso. Si el contenido requiere revisión, el ticket puede pasar a esa etapa; las secciones tienen aprobaciones independientes y las solicitudes de cambios pueden volver a generar solo la sección afectada.

> Cuando todas las secciones están aprobadas, todavía queda una revisión humana final. Solo entonces se compone y guarda el documento aprobado. Para una persona de negocio, lo importante es que puede ver qué se propuso, qué está pendiente y qué se aprobó.

**Explicación técnica en lenguaje sencillo:**

- El pipeline divide el trabajo en etapas visibles en lugar de una única llamada opaca al modelo.
- Los workers permiten procesar trabajo largo fuera de la petición web inmediata.
- LangGraph y los checkpoints permiten pausar el flujo y conservar su estado para continuar una aprobación.
- FastAPI expone la lógica y el backoffice permite cargar, revisar y decidir.
- Hay pruebas de flujo, permisos y aprobación. El ejemplo E2E de RFP documentado usa componentes simulados; no lo presentes como prueba del modelo en vivo.

### 4. Decisiones y reto — 45 segundos

> La decisión principal fue automatizar la preparación y la generación de borradores, pero no la aprobación final. Elegí aprobaciones por sección y una revisión humana final en vez de publicar automáticamente, porque una propuesta comercial puede contener compromisos sobre volumen, moneda o devoluciones. También añadí controles deterministas para ciertos conflictos y para contenido sospechoso en documentos de entrada; esos controles ayudan, pero no garantizan detectar toda instrucción maliciosa.

> El reto técnico fue coordinar etapas que pueden pausarse, reanudarse o terminar en revisión. Para eso separé el estado de negocio de la pausa del workflow, y añadí persistencia y pruebas para comprobar que aprobar un departamento no desbloquea por error los demás.

> De lo que estoy más orgulloso es de haber tratado la revisión humana como parte del diseño del sistema, no como una comprobación añadida al final.

**Versión corta del trade-off:**

> Elegí una aprobación humana por sección más una revisión final, en vez de publicar automáticamente, porque el borrador puede incluir compromisos comerciales. El coste es que sigue habiendo intervención humana; el beneficio es que el flujo no confunde texto generado con una decisión autorizada.

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
- La documentación registra pruebas de API y flujo end-to-end con componentes simulados.
- La documentación enumera límites pendientes de producción, entre ellos identidad del aprobador ligada a SSO, idempotencia/concurrencia, almacenamiento durable multi-instancia, migración real en staging y verificación completa del build/UI.
- No afirmes que está desplegado en producción ni que se midió ahorro de tiempo o dinero.

## Preparación de la demo

- Comprueba antes de grabar que el backoffice y la API arrancan y que la sesión está autenticada.
- Prepara un PDF de prueba y un ticket que llegue al estado que quieras mostrar.
- No dependas de esperar todo el procesamiento en la grabación; ten listo un ticket ya procesado para mostrar los estados y resultados.
- Evita mostrar credenciales, datos reales de clientes o secretos del entorno.