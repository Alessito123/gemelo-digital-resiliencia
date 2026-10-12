# Especificación: plataforma reproducible de resiliencia comunitaria

## Objetivo

Evolucionar el demostrador a una plataforma de investigación que permita ejecutar simulaciones deterministas micro–meso–macro, importar observaciones con procedencia, comparar resultados y comunicar con claridad el nivel de evidencia. Usuarios: investigadores, equipos municipales y organizaciones comunitarias.

## Stack y comandos

- React 19, TypeScript 5.8, Vite 6, Express 4.
- Desarrollo: `npm run dev`
- Pruebas: `npm test`
- Tipos: `npm run lint`
- Producción: `npm run build`
- Verificación: `npm run check`

## Estructura

- `src/domain`: contratos compartidos.
- `src/modules/simulation`: motor puro y determinista.
- `src/modules/data`: importación y procedencia.
- `src/modules/validation`: comparación y calidad de ajuste.
- `src/components`: interfaz visible; no contiene reglas científicas.
- `tests`: pruebas en los seams públicos.

## Interfaces y seams de prueba

```ts
const state = createSimulation(settlement, scenario, config);
const next = advanceSimulation(state, config);
const report = validateSimulation(next.metrics, observations);
```

Se prueban `simulation-core`, `data-integration` y `validation-lab`. Tiempo y azar son dependencias explícitas mediante `seed`; no se prueba estado privado.

## Criterios de éxito

- Misma semilla + configuración produce resultados idénticos.
- Desactivar el acople multi-escala cambia resultados de manera comprobable.
- El evento compuesto incluye sismo, tsunami y falla de infraestructura.
- Salidas incluyen personas/hogares afectados, evacuación, daño, pérdida económica, desplazamiento y recuperación estimada.
- Fragilidades se derivan de la ejecución, no de una lista fija.
- Importaciones externas se validan, limitan y conservan fuente, fecha, licencia y estado (`observed`, `calibrated`, `synthetic`).
- La validación no muestra “validado” sin observaciones reales suficientes.
- Encuestas trabajan con agregados y no recopilan nombres, teléfonos ni coordenadas de hogares.
- La interfaz explica evidencia, incertidumbre y limitaciones, es operable con teclado y funciona a 320–1440 px.
- Bundle inicial menor a 200 kB gzip y `npm run check` pasa.

## Límites

- Siempre: trazabilidad, validación de entradas, semilla reproducible, lenguaje no operacional.
- Consultar antes: proveedores externos con credenciales, almacenamiento de PII, despliegue o publicación.
- Nunca: inventar observaciones, afirmar validación comunitaria inexistente, emitir alertas oficiales o exponer secretos.

## Supuestos

- Los presets actuales son sintéticos y se etiquetan así.
- La importación real se hace mediante archivos del investigador; no se eluden licencias ni autenticación de proveedores.
- Las pérdidas y recuperación son estimaciones de planificación, no peritajes.

