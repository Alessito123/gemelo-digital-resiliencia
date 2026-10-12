# research-workbench

Alcance autorizado por el usuario: «impleméntalo», para CAPABILITY-MAP-ai-analytics.md.

## Objetivo y aceptación
Sección Laboratorio IA enlazada desde cabecera: elegir datos públicos/importados/sintéticos, generar, ajustar y cancelar, ver estado y errores, parámetros, gráficos, explicaciones y exportación JSON completa/CSV. Mantener tokens de tema, etiquetas accesibles y ancho móvil.

## Estructura y estilo
src/components/statistics/. TypeScript con funciones puras para cálculo; React para presentación. Ejemplo de frontera: `analyzeDataset(dataset, seed)`. No añadir dependencias.

## Comandos
`npm test`, `npm run lint`, `npm run build`; ejecución local: PowerShell `$env:NODE_ENV='production'; npm start`.

## Verificación
Verificar flujo en navegador, fallos, exportaciones, responsive y compilación. Pruebas con node:test/tsx en tests/statistics.test.ts.

## Límites
Siempre validar entradas, conservar origen/unidad y explicar incertidumbre. No afirmar normalidad, causalidad ni validación científica por obtener un ajuste. No publicar externamente, exponer claves o alterar el simulador existente.

