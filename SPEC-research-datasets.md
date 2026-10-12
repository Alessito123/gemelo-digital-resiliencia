# research-datasets

Alcance autorizado por el usuario: «impleméntalo», para CAPABILITY-MAP-ai-analytics.md.

## Objetivo y aceptación
Datasets numéricos univariados con registros y procedencia, importación JSON/CSV de una columna, límite de 5.000 valores finitos y conversión de snapshots USGS/NASA. Unidades homogéneas; ningún reemplazo sintético ante fallos de fuentes.

## Estructura y estilo
src/modules/statistics/datasets.ts. TypeScript con funciones puras para cálculo; React para presentación. Ejemplo de frontera: `analyzeDataset(dataset, seed)`. No añadir dependencias.

## Comandos
`npm test`, `npm run lint`, `npm run build`; ejecución local: PowerShell `$env:NODE_ENV='production'; npm start`.

## Verificación
Importaciones válidas/incorrectas, límite, unidades y procedencia. Pruebas con node:test/tsx en tests/statistics.test.ts.

## Límites
Siempre validar entradas, conservar origen/unidad y explicar incertidumbre. No afirmar normalidad, causalidad ni validación científica por obtener un ajuste. No publicar externamente, exponer claves o alterar el simulador existente.

