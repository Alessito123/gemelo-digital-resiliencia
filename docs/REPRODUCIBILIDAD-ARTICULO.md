# Artefactos de investigación del artículo GDDN

El informe `research_artifacts/forest_fires_seed202609.json` es el resultado guardado del laboratorio de la app, semilla 202609. No se entrenó de nuevo para alterar su puntuación. Contiene particiones, parámetros, errores por fold y predicciones reservadas. UCI Forest Fires es observado; no valida los hogares sintéticos.

`research_artifacts/synthetic_scenarios_20261012.json` contiene ocho corridas del motor actual: cuatro amenazas, 60/90 minutos de anticipación, intensidad 8, semilla 202609, 20 pasos y perfil ilustrativo medellin-comuna13. Los nombres geográficos son etiquetas de presets: el terreno y los hogares no son observaciones de Medellín.

La escena 3D se genera con `twin_scene.scene_figure`. Los índices de resiliencia, daños y protocolos de alerta son sintéticos y no están calibrados contra un desastre local. No interpretar una diferencia de una sola semilla como efecto causal. Los 18 tests Python pasaron en la revisión del 12 de octubre de 2026; no constituyen validación científica externa.

Fuentes: https://archive.ics.uci.edu/dataset/162/forest+fires ; https://earthquake.usgs.gov/fdsnws/event/1/ ; https://power.larc.nasa.gov/docs/services/api/ ; https://www.openstreetmap.org/copyright

La primera descarga UCI requiere internet. USGS, NASA POWER y OSM aportan contexto consultable; no se acoplan automáticamente a las ecuaciones del gemelo. El uso operacional requiere datos de campo, calibración y validación independiente.
