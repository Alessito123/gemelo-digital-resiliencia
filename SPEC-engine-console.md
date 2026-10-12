# Especificación: `engine-console`

## Objetivo

Permitir que investigadores y docentes ejecuten y auditen el grafo desde el Laboratorio IA.

## Estructura

- `src/modules/engine/client.ts`: adaptador HTTP `runEngine`.
- `src/components/EngineWorkflowPanel.tsx`: estado, traza, validación y resultado.

## Interface

```ts
const result = await runEngine(input, signal);
```

## Estrategia de pruebas

El contrato del cliente se valida en runtime; la revisión en navegador comprueba carga, error, resultado y diseño responsive.

## Límites

- Siempre: React escapa todo texto; mostrar procedencia y limitaciones.
- Nunca: renderizar HTML del modelo ni llamar directamente al proveedor de IA.

## Criterios de éxito

- El usuario ve nodos completados/omitidos, métricas, evidencia y fuente del diagnóstico.
- El panel funciona a 320 px y con teclado.

