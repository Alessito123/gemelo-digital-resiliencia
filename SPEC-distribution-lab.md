# distribution-lab

Alcance autorizado por el usuario: «impleméntalo», para CAPABILITY-MAP-ai-analytics.md.

## Objetivo y aceptación
Generación Box–Muller con PRNG y semilla; normales o mezclas de 2–3 normales con pesos normalizados positivos, medias y desviaciones. Conservar configuración generadora como verdad conocida sintética.

## Estructura y estilo
src/modules/statistics/datasets.ts. TypeScript con funciones puras para cálculo; React para presentación. Ejemplo de frontera: `analyzeDataset(dataset, seed)`. No añadir dependencias.

## Comandos
`npm test`, `npm run lint`, `npm run build`; ejecución local: PowerShell `$env:NODE_ENV='production'; npm start`.

## Verificación
Reproducibilidad, parámetros inválidos y momentos aproximados de muestras grandes. Pruebas con node:test/tsx en tests/statistics.test.ts.

## Límites
Siempre validar entradas, conservar origen/unidad y explicar incertidumbre. No afirmar normalidad, causalidad ni validación científica por obtener un ajuste. No publicar externamente, exponer claves o alterar el simulador existente.

