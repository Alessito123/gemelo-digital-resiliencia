# Especificación: `engine-contracts`

## Objetivo

Definir una única entrada y salida tipadas para una ejecución completa del gemelo. La entrada solo acepta identificadores conocidos, configuración acotada, encuesta agregada, calibración pública y dataset con procedencia. La salida contiene resultado, diagnóstico, protocolo, validación, advertencias y traza de nodos.

## Stack y comandos

- TypeScript 5.8 y Zod.
- Pruebas: `npm test`
- Tipos: `npm run lint`

## Estructura

- `src/modules/engine/contracts.ts`: esquemas, tipos y errores públicos.
- `tests/engineWorkflow.test.ts`: comportamiento a través del seam del workflow.

## Estilo

```ts
const parsed = EngineRunInputSchema.safeParse(value);
if (!parsed.success) throw new EngineInputError(parsed.error.issues);
```

## Estrategia de pruebas

Validar entradas mínimas, límites numéricos, datasets y rechazo de campos que intenten ampliar el trabajo del grafo.

## Límites

- Siempre: validar en la entrada y mantener errores estructurados.
- Consultar antes: añadir PII o persistencia.
- Nunca: aceptar funciones, URLs arbitrarias o instrucciones ejecutables.

## Criterios de éxito

- El contrato limita pasos a 1–60, semilla a entero positivo e intensidad a 1–10.
- Una salida completa es validable sin conocer la implementación de LangGraph.
- La traza enumera solo nodos permitidos y estados acotados.

