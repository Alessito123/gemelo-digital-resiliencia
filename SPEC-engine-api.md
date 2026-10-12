# Especificación: `engine-api`

## Objetivo

Exponer una operación HTTP estable para ejecutar el grafo completo desde cualquier cliente.

## Interface REST

```text
POST /api/engine/runs
Content-Type: application/json

200 { success: true, data: EngineRunResult }
422 { success: false, error: { code: "VALIDATION_ERROR", message, details } }
429 { success: false, error: { code: "RATE_LIMITED", message } }
500 { success: false, error: { code: "ENGINE_RUN_FAILED", message } }
```

## Estrategia de pruebas

Probar el seam `runResilienceWorkflow`; la ruta solo valida, invoca y traduce errores.

## Límites

- Siempre: límite JSON de 64 kB, rate limit existente y mensajes genéricos.
- Nunca: stack traces, prompts, claves o respuestas crudas del proveedor.

## Criterios de éxito

- Una solicitud válida devuelve fuente del análisis, versión del motor y traza completa.
- Una entrada inválida no inicia LangGraph.

