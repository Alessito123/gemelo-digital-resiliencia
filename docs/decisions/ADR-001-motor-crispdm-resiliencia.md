# ADR-001: Motor CRISP-DM local para riesgo de evacuación

## Estado

Aceptado

## Contexto

El proyecto ya analizaba distribuciones normales y mezclas gaussianas, pero no tenía un flujo explícito de aprendizaje supervisado conectado con el dominio del gemelo digital. El motor Python de referencia aporta seis fases CRISP-DM, partición reproducible, comparación de modelos, validación, equidad y drift.

## Decisión

Se incorpora `src/modules/crispdm/resilienceEngine.ts` como motor puro y local. Construye registros a partir de hogares, escenario y métricas activas; normaliza variables de pendiente, vulnerabilidad estructural, dependencia, movilidad, acceso a alerta y confianza social; y calcula una etiqueta exploratoria de prioridad.

El motor compara cinco familias transparentes sin añadir dependencias externas: regresión logística, bagging de árboles pequeños, boosting de reglas, stacking e híbrido logística + boosting. Usa una división reproducible 70/15/15, ROC-AUC, PR-AUC, recall, especificidad, precisión, F1, Brier, log-loss, bootstrap de ROC-AUC, brechas descriptivas entre grupos y desplazamiento de riesgo entre ajuste y prueba.

La interfaz lo expone dentro del Laboratorio IA como un panel CRISP-DM con umbral configurable, fases, comparación de modelos, validación responsable y limitaciones.

## Alternativas consideradas

### Copiar el motor Python y ejecutarlo desde el navegador

Rechazado: obligaría a introducir un runtime Python y una frontera de despliegue adicional. El proyecto actual ejecuta su motor estadístico en TypeScript/Web Worker y necesita continuar funcionando localmente sin claves ni servicios externos.

### Presentar los comparadores como LightGBM o una red neuronal reales

Rechazado: sin esas bibliotecas no sería una afirmación verificable. La interfaz identifica los modelos locales como comparadores transparentes y declara la limitación.

### Convertir la probabilidad en una alerta oficial

Rechazado: los objetivos se derivan del estado del gemelo y no de siniestros históricos longitudinales. La salida sirve para exploración y priorización dentro de la simulación.

## Consecuencias

- El flujo CRISP-DM queda reproducible con una semilla y se puede exportar o auditar desde la interfaz.
- El modelo puede ejecutarse offline y no transmite datos del hogar a terceros.
- La etiqueta no equivale a una observación real; se requieren datos históricos observados para validar anticipación de 6–12 meses.
- Cualquier integración futura con un servicio Python deberá conservar este contrato de entrada, métricas y limitaciones.
