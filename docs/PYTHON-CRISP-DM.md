# Guía para presentar el proyecto Python

## Arquitectura

Streamlit envía solicitudes HTTP a FastAPI. FastAPI ejecuta el grafo LangGraph del gemelo y el motor scikit-learn de investigación. El entrenamiento trabaja en segundo plano; la interfaz consulta su progreso. Las fuentes públicas se consultan desde el servidor.

Archivos principales:

- streamlit_app.py: navegación y gemelo.
- streamlit_research.py: CRISP-DM, EDA, resultados e inferencia.
- streamlit_public.py: observatorio.
- python_api.py: contratos HTTP, trabajos y predicción.
- python_engine/research_data.py: descarga, validación y particiones espaciales.
- python_engine/research_ml.py: pipelines, búsqueda, selección y estadística.
- python_engine/workflow.py: LangGraph.
- run_python.py: arranque de ambos servicios.

## Demostración

1. Ejecutar run_python.py con el Python del entorno virtual.
2. Abrir Streamlit en 8501 y explicar el objetivo de regresión y su diferencia con la simulación de hogares.
3. Mostrar CRISP-DM y la procedencia UCI; explicar licencia, hash, duplicados y conjunto reservado.
4. En EDA mostrar histograma logarítmico, correlaciones y faltantes de desarrollo.
5. Pulsar Entrenar y comparar cuatro modelos; observar los folds externos e internos.
6. Revisar ranking, mejores hiperparámetros, prueba reservada y contrastes.
7. Probar predicción y descargar el informe reproducible.
8. Cambiar a Gemelo poblacional para mostrar la traza real de LangGraph.
9. Abrir Datos públicos y consultar una fuente; descargar su snapshot.
10. Mostrar /docs en el puerto 8000 para demostrar que el frontend consume FastAPI.

## Qué significa mejor modelo

El criterio se fija antes de entrenar: menor MAE de log1p(area) en cinco folds externos comunes. No se elige usando el conjunto reservado. La selección puede favorecer el baseline. La búsqueda interna y la evaluación externa cumplen funciones diferentes.

El ensayo con semilla 202609 seleccionó Gradient Boosting, learning_rate=0.1 y max_depth=1, con 60 estimadores. MAE log externo 1.1155 ± 0.1757 (desviación entre folds, no intervalo de confianza). Prueba: MAE 12.4066 ha, RMSE 32.5052 ha, R² −0.1576. Estos números justifican seguir investigando; no permiten anunciar precisión alta.

Friedman p=0.7710 y ninguna comparación Wilcoxon-Holm significativa a 0.05. Los folds dependientes y la baja potencia limitan la inferencia. Shapiro–Wilk describe normalidad de residuos, no cuál modelo es mejor.

## Fuentes metodológicas

- UCI Forest Fires: https://archive.ics.uci.edu/dataset/162/forest+fires
- Validación anidada: https://scikit-learn.org/stable/auto_examples/model_selection/plot_nested_cross_validation_iris.html
- Pipelines: https://scikit-learn.org/stable/modules/compose.html

## Límites verificables

La división por celda evita compartir localizaciones entre particiones; no constituye validación temporal prospectiva. El dataset es de incendios rurales de Portugal y no contiene redes de apoyo, capacidad institucional ni hogares informales. Esas variables continúan en el motor de simulación sintético y requieren datos de campo antes de una validación científica.
