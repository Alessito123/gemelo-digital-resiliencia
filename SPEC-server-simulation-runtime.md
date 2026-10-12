# Especificación: `server-simulation-runtime`

## Objetivo

Resolver presets y ejecutar el motor multi-escala existente en Node.js con los mismos resultados reproducibles que en el navegador.

## Comandos

- Pruebas: `npm test`
- Tipos: `npm run lint`

## Estructura

- Reutiliza `src/modules/simulation/simulationEngine.ts`.
- Selecciona datos desde `src/data/settlementPresets.ts` y `src/data/disasterScenarios.ts`.

## Interface

```ts
const state = executeServerSimulation(input);
```

## Estrategia de pruebas

Misma entrada produce métricas, hogares, historia y fragilidades idénticas; encuesta y calibración pública no mutan el preset fuente.

## Límites

- Siempre: semilla explícita y máximo 60 pasos por ejecución HTTP.
- Nunca: temporizadores, azar global o estado compartido entre ejecuciones.

## Criterios de éxito

- Funciona sin DOM, navegador ni credenciales.
- Conserva todas las métricas científicas existentes.

