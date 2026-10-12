# Capability Map: versión Python + Streamlit

## Supuestos para aprobación

1. La versión React/TypeScript existente se conserva sin cambios funcionales.
2. Se añade una aplicación ejecutable independiente con `streamlit run streamlit_app.py`.
3. El motor Python será determinista, reproducible y cubrirá las escalas hogar, comunidad y ciudad.
4. LangGraph Python orquestará contexto, calibración, simulación, evidencia, diagnóstico y protocolo.
5. La aplicación funcionará sin credenciales mediante asesor heurístico local; cualquier IA externa será opcional.
6. La primera versión reutilizará los asentamientos, escenarios y conceptos científicos del proyecto, sin duplicar el visor WebGL 3D dentro de Streamlit.

## Módulos

| Module id | Responsabilidad | Depende de |
|---|---|---|
| `py-domain-engine` | Modelos, escenarios y simulación multi-escala determinista en Python | — |
| `py-langgraph-workflow` | Grafo de ejecución, ramas de evidencia y protocolo local | `py-domain-engine` |
| `streamlit-research-console` | Interfaz premium, controles, métricas, gráficas, trazabilidad y exportación | `py-langgraph-workflow` |
| `python-quality-docs` | Pruebas, requisitos, comandos y documentación reproducible | módulos anteriores |

Build order: `py-domain-engine` → `py-langgraph-workflow` → `streamlit-research-console` → `python-quality-docs`.

## Resultado esperado

- Ejecución completa desde Streamlit sin API key.
- Misma semilla y configuración producen el mismo resultado.
- El usuario puede elegir asentamiento, amenaza, intensidad, anticipación y ayuda mutua.
- La interfaz muestra métricas, curva temporal, fragilidades, traza LangGraph y protocolo.
- Pruebas Python verifican reproducibilidad, límites de entrada y ramas del grafo.
