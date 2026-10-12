# ADR-002: LangGraph.js para orquestar el motor de resiliencia en servidor

## Estado

Aceptado

## Fecha

2026-09-27

## Contexto

El proyecto dispone de un simulador determinista, validación, conectores públicos y asesoría, pero esas capacidades se invocan desde flujos separados. El docente requiere un motor completamente funcional y una integración demostrable con LangFlow o LangGraph.

## Decisión

Se adopta LangGraph.js en el backend TypeScript. Un grafo de profundidad fija coordina resolución del contexto, calibración, simulación, evaluación de evidencia, diagnóstico y protocolo. El grafo utiliza interfaces propias y recibe el adaptador de asesoría como dependencia. La implementación local determinista es obligatoria; Gemini es un adaptador opcional validado y nunca una condición para que el motor funcione.

Se añade `POST /api/engine/runs` como operación única. La interfaz visual muestra la traza de nodos, procedencia, incertidumbre, validación y limitaciones.

## Alternativas consideradas

### LangFlow como servicio separado

Rechazado para esta entrega: introduciría Python, un proceso adicional y despliegue separado. LangGraph.js conserva un único runtime y permite probar el workflow con el stack existente.

### Encadenar funciones manualmente

Rechazado: ejecutaría el cálculo, pero no cumpliría la necesidad académica de demostrar un grafo explícito, auditable y extensible.

### Depender siempre de Gemini

Rechazado: haría que la investigación dejara de ser reproducible y que la demostración fallara sin credenciales o conectividad.

## Consecuencias

- El servidor se vuelve la fuente de verdad para ejecuciones completas.
- La animación local continúa disponible y no se rompe el comportamiento actual.
- Se añade una dependencia de orquestación y validación que debe auditarse y mantenerse.
- La memoria del grafo no se usa como base de datos; cada ejecución devuelve su resultado completo y reproducible.
- Ninguna salida constituye una alerta oficial ni sustituye validación de campo.

