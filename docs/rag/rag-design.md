# Documento de Diseño RAG — TrackFlow Knowledge Base

Este documento describe la arquitectura, decisiones de diseño, estrategia de fragmentación, modelo de datos y calibración del sistema de **Recuperación Aumentada por Generación (RAG)** implementado para el equipo comercial y los account managers de **TrackFlow**.

---

## 1. Proceso RAG Extremo a Extremo

El sistema RAG de TrackFlow está diseñado con una arquitectura modular y desacoplada, sin frameworks de orquestación (sin LangChain ni LlamaIndex), operando directamente mediante el SDK de `qdrant-client` y el SDK de `openai` conectado al gateway de inferencia de 4Geeks.

```mermaid
flowchart TD
    subgraph Ingesta ["1. Ingestión e Indexación (data/process/rag.py)"]
        A["docs/company-knowledge-base/*.es.md"] -->|load_knowledge_documents| B["Chunking Semántico"]
        B -->|3 chunks autocontenidos por doc| C["embed(chunk_text)"]
        C -->|Vectores 1024 dim| D[("Qdrant: trackflow_knowledge")]
    end

    subgraph Consulta ["2. Pipeline de Consulta (data/pipelines/rag.py)"]
        Q["Pregunta del usuario / prospecto"] -->|embed| V["Vector consulta (1024 dim)"]
        V -->|query_points k=5| E["Qdrant Vector Search"]
        D -.-> E
        E -->|Filtrado min_score=0.35| F["Chunks supervivientes (Payloads)"]
        F -->|Si context vacío: fallback honesto| G["generate_answer(question, context)"]
        G -->|Prompt comercial + Restricciones| H["LLM Generación (DeepSeek)"]
        H -->|String final sintetizado| I["query(question) -> str"]
    end

    subgraph Canales ["3. Canales de Exposición"]
        I --> API["FastAPI: POST /knowledge/query"]
        API --> UI["Backoffice: /knowledge (Next.js)"]
    end
```

### Flujo numerado de ejecución:

1. **Lectura de Documentos Fuente**: `setup()` lee los 4 documentos oficiales en [docs/company-knowledge-base/](docs/company-knowledge-base/):
   - `trackflow-carrier-coverage.es.md`
   - `trackflow-returns-policy.es.md`
   - `trackflow-sla-delivery.es.md`
   - `trackflow-storage-pricing.es.md`
2. **Chunking Semántico**: `chunk_document()` divide cada documento en unidades lógicas autocontenidas (exactamente 3 chunks por archivo, 12 chunks en total), adjuntando metadatos de dominio (`company`, `source_document`, `section`, `language`, `chunk_index`, `text`).
3. **Vectorización de Ingesta**: Para cada fragmento, se llama a `embed(chunk_text)` usando el modelo dedicado de embeddings (`madrid-spain/openrouter/perplexity/pplx-embed-v1-0.6b`), obteniendo un vector denso de 1024 dimensiones.
4. **Indexación Idempotente**: Se crea o recrea la colección `trackflow_knowledge` en Qdrant con métrica `Distance.COSINE` y dimensión 1024. Los puntos se insertan con UUIDs deterministas (`uuid5`) generados con el prefijo `trackflow:{source_document}:{chunk_index}`, asegurando que volver a ejecutar `setup()` no genere puntos duplicados ni fragmentos huérfanos.
5. **Recepción de la Consulta**: El usuario envía una pregunta a través de la UI del Backoffice (`/knowledge`) o mediante el endpoint HTTP `POST /knowledge/query` de FastAPI.
6. **Recuperación con Filtrado (`retrieve`)**:
   - Se vectoriza la pregunta con la misma función `embed(question)`.
   - Se buscan los vecinos más cercanos en Qdrant (`limit=5`).
   - Se filtran aquellos resultados con similitud coseno inferior al umbral calibrado (`min_score = 0.35`).
   - Se retornan únicamente diccionarios limpios con el payload y el score.
7. **Generación con Reglas de Negocio (`generate_answer`)**:
   - Si ningún chunk supera el umbral, se devuelve de inmediato un mensaje honesto indicando que los acuerdos estándar no contienen información suficiente (evitando gastar tokens o arriesgar alucinaciones).
   - Si hay chunks relevantes, se construye el prompt con el rol de un Account Manager/Vendedor de TrackFlow en llamada comercial y se invoca al modelo de generación (`madrid-spain/openrouter/deepseek/deepseek-v4-flash`).
8. **Respuesta Final**: El endpoint responde exclusivamente con el JSON `{ "answer": "..." }`, protegiendo los fragmentos crudos y los metadatos técnicos internos de la base vectorial.

---

## 2. Estrategia de Chunking

### Justificación de la Estrategia Semántica
El corpus de TrackFlow no es un texto narrativo largo, sino un conjunto conciso de políticas operativas, compromisos contractuales, ventanas temporales, porcentajes y excepciones de personal clave.

El chunking de tamaño fijo con solapamiento (*fixed-size with overlap*) fue **descartado** porque corta condiciones y reglas dependientes:
- Separar una ventana de devolución (30 días) de quién asume los costes por producto defectuoso llevaría al modelo a contradecir la política de costes.
- Cortar el SLA del 90% separándolo de la compensación del 5% tras dos meses de incumplimiento rompería la causalidad legal.
- Dividir las fechas de alta demanda (Black Friday) separando la advertencia del incremento de tiempo (+40%) causaría promesas falsas de entregas express.

Por ello, se implementó una **estrategia semántica por secciones lógicas**:

| Documento Fuente | Secciones Semánticas Identificadas | Conteo de Chunks | Contenido y Reglas Preservadas |
|---|---|:---:|---|
| `carrier-coverage` | 1. Cobertura EE. UU. (Los Ángeles)<br>2. Cobertura España (Zaragoza)<br>3. Selección y excepciones | 3 | Agrupa transportistas por país, capacidades (>5 kg, express, internacional) y la regla de excepción de Carlos Vega. |
| `returns-policy` | 1. Proceso estándar reverse logistics<br>2. Ventana de devolución y costes<br>3. Devoluciones internacionales | 3 | Integra los 3 pasos de inspección, los 30 días, costes de transporte por defecto y la obligatoriedad de trámite manual con Sofía Ramos. |
| `sla-delivery` | 1. Tiempos de entrega por servicio<br>2. Cumplimiento contractual y penalización<br>3. Picos de alta demanda | 3 | Preserva los plazos por servicio (3-5d, 24-48h, 7-12d), la compensación del 5% si cae del 90%, y la suspensión del SLA en Black Friday (+40%). |
| `storage-pricing` | 1. Tarifa estándar y periodo de gracia<br>2. Inventario de larga duración (>180d)<br>3. Negociación y tarifas preferenciales (>50 m³) | 3 | Mantiene el precio en Los Ángeles ($18) y Zaragoza (€16), los 30 días de gracia, el 150% de recargo y la autorización de Miguel Torres. |

**Total de chunks en la colección**: 12 fragmentos.
**Tamaño medio por chunk**: ~300 - 550 caracteres (~60 - 110 tokens), lo que garantiza fragmentos compactos, de alta densidad informativa y sin ruido de contexto irrelevante.

---

## 3. Prácticas de Embeddings y Modelos

### Separación Estricta de Modelos (4Geeks AI Gateway)
En cumplimiento con las directrices de arquitectura y los criterios de evaluación, los modelos de vectorización e inferencia están totalmente separados:

| Responsabilidad | ID de Modelo | Proveedor / Gateway | Dimensiones |
|---|---|---|:---:|
| **Embeddings** | `madrid-spain/openrouter/perplexity/pplx-embed-v1-0.6b` | `https://llm.4geeks.ai/v1` | **1024** |
| **Generación** | `madrid-spain/openrouter/deepseek/deepseek-v4-flash` | `https://llm.4geeks.ai/v1` | N/A |

Una aserción en código (`validate_model_separation()`) valida en tiempo de ejecución tanto en `setup()` como en `embed()` que `EMBEDDING_MODEL != GENERATION_MODEL`, impidiendo cualquier reutilización indebida del modelo de generación para tareas de cálculo vectorial.

### Consistencia en `embed()`
La función `embed(text: str) -> list[float]` en [data/process/rag.py](data/process/rag.py) es la **única fuente de verdad** para la transformación texto $\rightarrow$ vector:
- Se invoca durante la indexación inicial en `setup()` para vectorizar el cuerpo de cada chunk.
- Se invoca de forma idéntica en `retrieve(query)` para vectorizar la pregunta del usuario.
- Esto garantiza que tanto los documentos como las preguntas residan exactamente en el mismo espacio vectorial latente.

### Configuración en Qdrant
- **Colección**: `trackflow_knowledge`
- **Métrica de Distancia**: `Distance.COSINE` (similitud del coseno, óptima para vectores normalizados de representación textual densa).
- **Dimensión del Vector**: 1024 floats.

### Calibración del Umbral `min_score`
Para evitar inyectar contexto irrelevante al prompt generador, se analizó empíricamente la distribución de scores con preguntas dentro y fuera de dominio:

| Tipo de Consulta | Ejemplos Evaluados | Rango de Similitud Coseno | Decisión |
|---|---|:---:|:---:|
| **Dentro de Dominio** | Plazos de devolución, transportistas en LA, tarifas de almacenamiento, Black Friday, penalizaciones de SLA | `0.56` — `0.85` | **Aceptados** |
| **Fuera de Dominio** | *"¿Cuánto cuesta el menú del restaurante?"*, *"¿Quién ganó la Champions en 2022?"*, *"¿Cómo reparar una bicicleta?"* | `0.10` — `0.22` | **Rechazados** |

Se fijó un umbral **`min_score = 0.35`**:
- Ofrece un margen de seguridad amplio respecto a las consultas fuera de dominio ($0.22 < 0.35$).
- Conserva el 100% de los fragmentos válidos de negocio ($0.35 \ll 0.56$).
- Si ningún fragmento supera `0.35`, `retrieve()` retorna una lista vacía `[]`, activando el fallback honesto del asistente.

---

## 4. Métricas de Evaluación y Calidad

En [data/eval/measure_rag_recall.py](data/eval/measure_rag_recall.py) se ejecuta una evaluación contra el dataset de prueba [data/eval/test-queries.json](data/eval/test-queries.json) (12 preguntas de negocio):
- **Recall@3 alcanzado**: **100.00%** (12/12 consultas recuperaron el documento correcto en el Rank #1).
- **Objetivo mínimo del CONTEXT**: $\ge 80\%$.
- **Faithfulness**: El prompt restringe la respuesta exclusivamente a las políticas descritas, prohibiendo ofrecer descuentos no aprobados por Miguel Torres o prometer SLAs estándar en Black Friday.
