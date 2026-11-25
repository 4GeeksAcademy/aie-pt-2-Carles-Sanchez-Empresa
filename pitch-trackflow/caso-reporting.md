# Caso C — Reporting de rendimiento de almacén

## Idea que debe recordar quien entrevista

Construí un pipeline que transforma eventos operativos de inventario en KPIs semanales por almacén y cliente, y los presenta en un dashboard del backoffice.

## Por qué elegir este caso

Es una historia clara de datos a decisión: registrar eventos, transformarlos en métricas de negocio y mostrar el resultado para comparar periodos, almacenes y clientes. Conecta con la falta de visibilidad común descrita en el briefing.

**Límite:** no lo llames dashboard ejecutivo completo. El reporte implementado trata de rendimiento semanal de almacén y cliente; no incluye todos los KPIs ejecutivos enumerados en el briefing.

## Guion de cinco minutos

### 1. Introducción — 30 segundos

> Si cada almacén mide las operaciones de forma distinta, cuesta comparar dónde se acumulan los problemas. Soy Carles y construí un pipeline que transforma eventos de inventario en indicadores semanales por cliente y almacén, y los presenta en el backoffice de TrackFlow.

**Pantalla:** empieza a cámara y luego abre `/reporting`.

### 2. Problema y oportunidad — 45–60 segundos

> El briefing describe dos almacenes que no comparten una visión común del inventario y un proceso de reporting manual. Sin datos comparables, es más difícil detectar discrepancias o entender cómo cambia la actividad entre periodos. La oportunidad es convertir eventos que ya ocurren durante la operación en métricas que se puedan consultar con una misma estructura.

**Pantalla:** muestra el dashboard y señala que permite ver tanto indicadores agregados como detalle por almacén y cliente.

### 3. Solución y demo — unos 2 minutos

> El pipeline lee eventos de inventario, los agrupa por almacén, cliente y semana ISO, calcula los indicadores y publica el resultado en una tabla de reporting. El backoffice consume esos datos y los muestra como tarjetas KPI, una tendencia y una tabla de detalle.

**Recorrido recomendado:**

1. Enseña las tarjetas KPI.
2. Muestra la tendencia y explica qué representa.
3. Baja a la tabla por almacén y cliente.
4. Si está disponible durante la demo, enseña el resumen o la exportación, sin cambiar el alcance de lo que afirmas.

> Los indicadores implementados incluyen unidades entrantes, pedidos salientes, eventos de stock bajo, discrepancias y tasa de discrepancia. Por ejemplo, esa tasa relaciona las discrepancias con los pedidos salientes del mismo grupo. El proceso de publicación es idempotente: repetirlo para la misma clave actualiza el dato en lugar de duplicarlo.

> Separé este reporting de negocio del análisis de telemetría técnica. Una pregunta es cómo está funcionando el sistema; otra, cómo se está moviendo el inventario. Mantenerlas separadas hace que los indicadores tengan un significado más claro.

### 4. Decisiones y reto — 45 segundos

> Elegí agrupar por almacén, cliente y semana ISO, en vez de publicar solo totales globales, porque así el resultado permite comparar operaciones en un nivel que puede orientar una revisión. También mantuve el origen de eventos como fuente de solo lectura y publiqué los KPIs en una estructura separada.

> El reto fue asegurar que las fechas y el agrupamiento semanal coincidieran con el periodo consultado. Durante la validación, un seed colocaba algunos eventos en otra semana ISO y el extractor los excluía correctamente; corregí las fechas y los volúmenes del seed para que la demo representara el periodo esperado.

> De lo que estoy más orgulloso es de haber unido instrumentación, transformación, publicación y visualización, con pruebas sobre la lógica de los indicadores.

### 5. Q&A — 30–45 segundos

Graba a cámara, con dos segundos de silencio antes y después de cada respuesta. Completa las partes personales con tu experiencia real.

**[Pausa de 2 segundos]**

> ¿Qué te hizo decidirte a estudiar Ingeniería de IA — y qué estuvo a punto de detenerte? Me hizo decidirme **[tu motivo real]**; lo que estuvo a punto de detenerme fue **[tu obstáculo real]**.

**[Pausa de 2 segundos]**

> ¿Hubo un momento, un proyecto o una persona durante el programa en el que todo encajó de verdad? Para mí, todo encajó cuando **[momento real]**, porque vi cómo los datos pueden convertirse en una herramienta para decidir.

**[Pausa de 2 segundos]**

> ¿Qué le dirías a alguien que está indeciso sobre unirse a 4Geeks? Le diría que **[consejo propio]**, y que valore si quiere construir proyectos prácticos y aprender a resolver problemas de principio a fin.

**[Pausa de 2 segundos antes de cortar.]**

## Qué está implementado

El pipeline publica las métricas `inbound_units_count`, `outbound_orders_count`, `stockout_events_count`, `discrepancy_events_count` y `discrepancy_rate`, agrupadas por almacén, cliente y semana ISO. El backoffice presenta cinco tarjetas KPI, una visualización de tendencia y una tabla de detalle. La documentación registra un seed reproducible y pruebas del sistema.

No atribuyas a la solución una mejora financiera o un ahorro de horas sin una medición. Tampoco afirmes que cubre ingresos, costes, CSAT o todo el dashboard ejecutivo solicitado por el briefing.

## Trade-off principal

> Separé el reporting de negocio de la telemetría técnica, en vez de mezclar ambos en un único endpoint, porque contestan preguntas diferentes: uno ayuda a entender operaciones; el otro, el funcionamiento del sistema.

## Preparación de la demo

- Comprueba que hay datos para el periodo que mostrarás y que corresponden al almacén/cliente visible.
- Ten claro qué significa cada KPI, especialmente la tasa de discrepancia.
- Si usas datos seed, preséntalos como datos de demostración, no como resultados reales de TrackFlow.
- Evita llamar “tiempo real” al dashboard si no vas a demostrar frescura en tiempo real.