# ADR-003: Añadir Python y Streamlit como aplicación paralela

## Status

Accepted

## Date

2026-09-28

## Context

El proyecto existente utiliza React, TypeScript, Express y LangGraph JS. El requisito docente pide demostrar Python y Streamlit sin perder el visor WebGL, la interfaz premium ni las capacidades ya verificadas.

## Decision

Mantener la aplicación React y añadir una consola Streamlit independiente. El dominio Python será puro y determinista; LangGraph orquestará el workflow y Streamlit dependerá únicamente de su interface pública.

## Alternatives Considered

### Reemplazar React por Streamlit

- Ventaja: una única aplicación.
- Desventajas: pérdida del visor Three.js, menor control visual y regresión funcional.
- Rechazada porque destruye capacidades aprobadas.

### Streamlit como contenedor del frontend React

- Ventaja: apariencia idéntica.
- Desventajas: no demuestra un motor Python real y añade acoplamiento frágil entre procesos.
- Rechazada porque no satisface el objetivo académico.

## Consequences

- Existen dos entradas: `npm start` y `streamlit run streamlit_app.py`.
- El modelo Python debe mantenerse conceptualmente alineado con el TypeScript.
- No se requieren credenciales ni servicios externos.
