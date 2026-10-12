# Plataforma Python: Streamlit + FastAPI + CRISP-DM

Streamlit consume FastAPI por HTTP para simulación y aprendizaje automático. El arranque principal solo requiere Python. Se conserva el código anterior como referencia histórica, sin dependencia de Node para ejecutar esta entrega.

## Experimento reproducible

Dataset inicial: UCI Forest Fires, DOI 10.24432/C5D88D, CC BY 4.0, observaciones reales de Portugal. Objetivo: log1p del área quemada (ha). Es un benchmark de daños por incendio, no validación de resiliencia urbana ni censo del Sur Global.

Separar 20% de grupos espaciales X/Y antes de EDA. Deduplicación exacta. EDA solo sobre desarrollo. Los cinco folds externos y los cinco internos agrupan por celda espacial para evitar compartir localizaciones entre train y validación. Imputación, codificación y escalado se ajustan dentro de cada fold. GridSearchCV usa MAE logarítmico. Comparar Dummy, Ridge, Random Forest y Gradient Boosting en los mismos splits; seleccionar el menor MAE externo. Reajustar al desarrollo con cinco folds internos y evaluar exclusivamente el seleccionado en prueba reservada.

Reportar folds, desviación, parámetros por fold, todas las búsquedas, MAE/RMSE/R² en prueba y predicciones. Friedman y Wilcoxon pareados con Holm son exploratorios: cinco folds dependientes tienen poca potencia y no prueban superioridad poblacional. No forzar que gane un modelo complejo.

## Contratos

- GET /api/health: estado.
- POST /api/simulation/runs: WorkflowInput → WorkflowResult.
- GET /api/ml/dataset: procedencia, calidad y EDA de desarrollo.
- POST /api/ml/runs: seed acotada → trabajo 202; solo una ejecución simultánea (409 si ocupado).
- GET /api/ml/runs/{id}: estado, progreso y resultado; máximo ocho trabajos en memoria.
- POST /api/ml/runs/{id}/predictions: variables validadas → área estimada y advertencias.

Descarga exclusivamente desde URL fija UCI, timeout, límite de bytes, esquema y finitud validados. Sin credenciales. Servicios enlazados a loopback. Reportes descargables JSON. Modelos en memoria, no cargas pickle. Semilla, versiones, hash de dataset y configuración incluidos.

## Verificación

Pruebas de aislamiento de splits, cardinalidad cinco, contratos de API, errores, corrida completa sobre datos reales y UI Streamlit. Documentar resultados medidos, no anticipar un ganador.
