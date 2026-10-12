# advanced-analytics

Alcance autorizado por el usuario: «impleméntalo», para CAPABILITY-MAP-ai-analytics.md.

## Objetivo y aceptación
Media, mediana, desviación muestral, cuartiles, asimetría, exceso de curtosis, histograma/densidad y Q–Q normal. Comparar AIC/BIC sobre la misma muestra de ajuste; si n>=80 reservar 20% para evaluación logarítmica. Selección BIC solo en entrenamiento, sin usar prueba. División temporal si todos los registros tienen fecha; aleatoria reproducible en otro caso.

## Estructura y estilo
src/modules/statistics/engine.ts. TypeScript con funciones puras para cálculo; React para presentación. Ejemplo de frontera: `analyzeDataset(dataset, seed)`. No añadir dependencias.

## Comandos
`npm test`, `npm run lint`, `npm run build`; ejecución local: PowerShell `$env:NODE_ENV='production'; npm start`.

## Verificación
AIC/BIC algebraicos, selección de mezcla bien separada, partición disjunta y preservación de unidades. Pruebas con node:test/tsx en tests/statistics.test.ts.

## Límites
Siempre validar entradas, conservar origen/unidad y explicar incertidumbre. No afirmar normalidad, causalidad ni validación científica por obtener un ajuste. No publicar externamente, exponer claves o alterar el simulador existente.

