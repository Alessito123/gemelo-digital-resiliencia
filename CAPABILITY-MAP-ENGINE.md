# Mapa de capacidades: motor orquestado con LangGraph

| Módulo id | Responsabilidad | Depende de |
|---|---|---|
| `engine-contracts` | Contratos validados de ejecución, resultado, traza y errores | `scenario-contracts` |
| `server-simulation-runtime` | Ejecutar el motor determinista en servidor sin depender de React | `engine-contracts`, `simulation-core` |
| `langgraph-orchestrator` | Coordinar calibración, simulación, validación, diagnóstico y protocolo | `server-simulation-runtime`, `validation-lab`, `ai-advisory` |
| `engine-api` | Exponer una operación REST estable para ejecutar el grafo | `langgraph-orchestrator` |
| `engine-console` | Ejecutar y auditar el flujo desde la interfaz | `engine-api` |
| `engine-quality-gates` | Verificar contratos, reproducibilidad, seguridad, tipos, build y experiencia | todos |

Orden: `engine-contracts` → `server-simulation-runtime` → `langgraph-orchestrator` → `engine-api` → `engine-console` → `engine-quality-gates`.

Seams aprobados:

1. `runResilienceWorkflow(input, dependencies)` para pruebas del motor orquestado.
2. `POST /api/engine/runs` para consumidores HTTP.
3. `runEngine(input)` para el frontend.

