# Especificación: `engine-quality-gates`

## Objetivo

Garantizar que la nueva orquestación sea reproducible, segura y compatible con el proyecto existente.

## Comandos

- `npm test`
- `npm run lint`
- `npm run build`
- `npm audit --omit=dev`
- `npm run check`

## Estrategia de pruebas

Pruebas verticales en los seams aprobados; no se prueban nodos privados ni estructuras internas de LangGraph.

## Criterios de éxito

- Las 26 pruebas previas continúan pasando.
- Las nuevas pruebas cubren los caminos observado, ilustrativo, sin protocolo y fallback del adaptador.
- No existen vulnerabilidades críticas o altas alcanzables sin mitigación.
- El build de producción y la revisión visual pasan.

