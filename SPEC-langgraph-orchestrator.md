# Especificación: `langgraph-orchestrator`

## Objetivo

Implementar un `StateGraph` ejecutable que produzca una evaluación completa y auditable del escenario.

## Stack y comandos

- `@langchain/langgraph` 1.4.x, `@langchain/core`, Zod.
- Pruebas: `npm test`

## Flujo

`resolve-context` → `calibrate` → `simulate` → (`validate-evidence` | `mark-illustrative`) → `analyze` → (`build-protocol` | `skip-protocol`) → `finalize`.

## Interface

```ts
const result = await runResilienceWorkflow(input, { advisor });
```

El adaptador `advisor` tiene dos implementaciones reales: heurística local y Gemini opcional. LangGraph no crea proveedores ni conoce secretos.

## Estrategia de pruebas

- Camino sin dataset queda marcado como ilustrativo.
- Dataset observado ejecuta validación.
- `includeProtocol=false` omite el protocolo sin romper el resultado.
- Adaptador inválido o fallido degrada al análisis local.

## Límites

- Siempre: profundidad fija, salida de IA validada y fallback local.
- Nunca: herramientas con escritura, shell, URLs de usuario o bucles autónomos.

## Criterios de éxito

- La traza demuestra qué nodos corrieron y cuáles fueron omitidos.
- El grafo funciona totalmente sin API key.
- El resultado no afirma validación con evidencia sintética o ausente.

