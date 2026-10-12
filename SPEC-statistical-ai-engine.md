# statistical-ai-engine

Alcance autorizado por el usuario: «impleméntalo», para CAPABILITY-MAP-ai-analytics.md.

## Objetivo y aceptación
Ajuste normal por máxima verosimilitud y GMM univariado por EM, estandarización, log-sum-exp, cinco inicios reproducibles, hasta 250 iteraciones y tolerancia 1e-7. Regularizar varianzas y señalar soluciones degeneradas o sin convergencia. Ejecutar en Web Worker cancelable.

## Estructura y estilo
src/modules/statistics/engine.ts y analysis.worker.ts. TypeScript con funciones puras para cálculo; React para presentación. Ejemplo de frontera: `analyzeDataset(dataset, seed)`. No añadir dependencias.

## Comandos
`npm test`, `npm run lint`, `npm run build`; ejecución local: PowerShell `$env:NODE_ENV='production'; npm start`.

## Verificación
Recuperación de parámetros, pesos/responsabilidades normalizados, casos constantes/extremos y no mutación. Pruebas con node:test/tsx en tests/statistics.test.ts.

## Límites
Siempre validar entradas, conservar origen/unidad y explicar incertidumbre. No afirmar normalidad, causalidad ni validación científica por obtener un ajuste. No publicar externamente, exponer claves o alterar el simulador existente.

