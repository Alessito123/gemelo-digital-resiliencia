# Mapa de capacidades: gemelo de resiliencia reproducible

| Módulo id | Responsabilidad | Depende de |
|---|---|---|
| `scenario-contracts` | Contratos de escenarios, procedencia, observaciones y resultados | — |
| `simulation-core` | Motor determinista micro–meso–macro y métricas trazables | `scenario-contracts` |
| `data-integration` | Validación e importación segura de datos observados o sintéticos | `scenario-contracts` |
| `public-data-connectors` | Consulta OSM, USGS y NASA solo para áreas y destinos permitidos, con caché y límites | `scenario-contracts` |
| `public-data-normalization` | Produce snapshots tipados con procedencia, licencia, métricas y limitaciones | `public-data-connectors` |
| `public-data-calibration` | Deriva multiplicadores acotados de accesibilidad, lluvia y contexto sísmico | `public-data-normalization`, `simulation-core` |
| `validation-lab` | Comparación, error, cobertura y estado de evidencia | `simulation-core`, `data-integration` |
| `community-evidence` | Encuesta agregada sin PII y parámetros de calibración | `data-integration` |
| `civic-interface` | Experiencia premium, accesible y responsive | todos los anteriores |
| `ai-advisory` | Diagnóstico y protocolos con salidas limitadas y validadas | `scenario-contracts` |
| `quality-gates` | Pruebas, compilación, seguridad, bundle y navegador | todos |

Orden: `scenario-contracts` → `simulation-core` + `data-integration` + `public-data-connectors` → `public-data-normalization` → `public-data-calibration` + `validation-lab` + `community-evidence` → `civic-interface` → `quality-gates`.
