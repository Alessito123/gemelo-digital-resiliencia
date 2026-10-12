# Propuesta: IA, datasets y análisis avanzado

Estado: significado de «normales y mezclas» confirmado por el usuario; propuesta pendiente de revisión del alcance. No describe funciones ya implementadas.

## Evidencia del estado actual

- `server.ts`: integración de Gemini para diagnóstico, protocolos y conversación; sin `GEMINI_API_KEY`, devuelve respuestas basadas en reglas. La existencia del código no confirma disponibilidad del proveedor.
- `src/server/publicDataGateway.ts`: conectores implementados para OpenStreetMap/Overpass, USGS y NASA POWER. Su disponibilidad externa debe verificarse durante la implementación.
- `src/modules/data/dataIntegration.ts`: importación JSON con procedencia y niveles observado, calibrado y sintético.
- `src/modules/validation/validationLab.ts`: comparación con la última observación. El error absoluto medio actual combina porcentajes y personas, por lo que necesita desagregarse por variable y unidad.

## Requisito confirmado

El usuario confirmó que el docente se refiere a distribución normal y mezclas de distribuciones. El origen público, importado o simulado es independiente de la distribución estadística. No se supondrá que un dataset público sigue una normal ni se lo etiquetará así sin evaluación.

Para la primera versión se propone trabajar con variables numéricas univariadas, una normal y mezclas de dos o tres normales. Un dataset público puede no ajustarse a ninguno de estos modelos. Se propone un motor local que estime los parámetros y componentes de la mezcla, complementado por la integración generativa existente para explicar resultados cuando esté disponible.

## Módulos propuestos

| Módulo id | Responsabilidad | Depende de |
|---|---|---|
| `research-datasets` | Gestionar datos públicos, importados y sintéticos; normalizar variables compatibles y conservar fuente, fecha, unidad y procedencia por registro/campo | `data-integration`, `public-data-normalization` existentes |
| `distribution-lab` | Generar muestras normales y mezclas de dos o tres normales con pesos, medias y desviaciones configurables; semilla reproducible y origen sintético explícito | `research-datasets` |
| `statistical-ai-engine` | Estimar una normal y mezclas gaussianas mediante EM con múltiples inicializaciones; devolver pesos, medias, desviaciones, responsabilidades, convergencia y límites numéricos | `research-datasets` |
| `advanced-analytics` | Estadística descriptiva, histogramas, densidades ajustadas, gráfico Q–Q, comparación AIC/BIC entre ajustes de la misma muestra y evaluación en datos reservados cuando la cantidad y estructura lo permitan | `statistical-ai-engine` |
| `research-workbench` | Integrar selección de datos públicos o muestras sintéticas, generación, ajuste, comparación de modelos y exportación en la interfaz actual | los cuatro módulos anteriores |

Orden: `research-datasets` → `distribution-lab` + `statistical-ai-engine` → `advanced-analytics` → `research-workbench`.

## Resultado demostrable propuesto

1. Consultar una fuente pública y ver registros con procedencia; un fallo de conexión se muestra como fallo, sin reemplazarlo silenciosamente por datos inventados.
2. Generar una muestra normal y una mezcla con parámetros conocidos y repetirlas exactamente mediante la semilla.
3. Ajustar una normal y mezclas a una variable numérica, mostrando parámetros aprendidos y convergencia. Rechazar muestras insuficientes o degeneradas con mensajes claros.
4. Mostrar histogramas, curvas ajustadas, Q–Q y comparación AIC/BIC. La mejor opción entre los modelos probados no se presenta como prueba de que describe correctamente los datos.
5. Exportar registros y análisis con fuente, unidad, procedencia, configuración, semilla, modelo y criterios de evaluación.

El ajuste de mezclas es un modelo estadístico de aprendizaje no supervisado, no un predictor de desastres. Los grupos estimados no se interpretarán automáticamente como categorías reales de vulnerabilidad. Una normal permite valores negativos; no se aplicará directamente como generador de precipitación o conteos sin un tratamiento explícito del dominio. Los registros de distinta variable o unidad no se mezclarán en una única muestra. Las fuentes actuales tienen ventanas y cantidades limitadas: un ajuste insuficiente debe indicarlo en vez de forzar conclusiones. La evaluación sobre datos simulados solo comprueba recuperación de parámetros y funcionamiento técnico.

## Decisión pendiente

Revisar el alcance propuesto: variables univariadas, normal y mezclas gaussianas de dos o tres componentes, motor de ajuste local y comparación estadística. El número de componentes y los métodos concretos son una propuesta técnica, no requisitos confirmados del docente.
