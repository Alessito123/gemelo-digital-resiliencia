# Verificación de la entrega Python

- 18 pruebas unittest aprobadas: simulación, LangGraph, observaciones vacías, particiones espaciales externas/internas, pipelines, contrastes, contratos HTTP, estados individuales, geometría 3D reproducible y asistente con herramientas.
- compileall: correcto.
- pip check: sin dependencias incompatibles.
- pip-audit del entorno completo: sin vulnerabilidades conocidas después de actualizar pip de 24.3.1 a 26.2.1. Esto no prueba ausencia de vulnerabilidades desconocidas.
- UCI: 517 filas, 4 duplicados, hash 0d6586a1fa52f55bef48578aef14eb97273f1e9330e1a53423df497a77065253.
- Entrenamiento completo ejecutado mediante POST /api/ml/runs: 20 folds externos de cuatro modelos con búsquedas internas de cinco folds.
- Repetición con semilla 202609 produjo idéntico ranking y métricas de prueba.
- Predicción HTTP 200 del modelo seleccionado: verificada.
- Playwright: aplicación abierta, resultados y formulario de inferencia inspeccionados; consola final sin errores ni advertencias.
- USGS Lima: 50 eventos. NASA POWER Lima: 30 días. OSM Lima: 869 edificios en ventana aproximada; otra consulta presentó indisponibilidad y fue expuesta como HTTP 503.
- Informe de ejecución guardado: output/research/069af02b947a42c1a38ad6d002071c2e.json.

Limitaciones: pruebas de UI en escritorio; no certificación WCAG ni despliegue público multiusuario. El benchmark real de incendios no valida científicamente el gemelo urbano. Los modelos permanecen en memoria y deben entrenarse nuevamente tras reiniciar FastAPI; los informes JSON sí se conservan.

## Experiencia bilingüe y gemelo 3D

- Asistente disponible desde un botón circular fijo en la esquina inferior derecha de todas las páginas. Popover nativo con conversación compartida, preguntas sugeridas y formulario; envío de «Explica los 5 folds» verificado mediante FastAPI (HTTP 200).

- Interfaz reorganizada en Inicio, Gemelo 3D, Investigación, Datos públicos y Asistente, con español/inglés y apariencia blanca/negra.
- Vista Plotly 3D renderizada y capturada en `output/playwright/twin-3d-white.png`. Los edificios representan hogares sintéticos; su estado se toma del motor en cada paso temporal. El terreno y las posiciones son esquemáticos, no una reconstrucción geográfica observada.
- Tema negro inspeccionado visualmente en `output/playwright/home-black.png`; idioma inglés verificado en navegación y controles del gemelo.
- Conversación de escritorio verificada: «Explica los 5 folds» obtuvo una respuesta del endpoint del asistente con referencia a la especificación metodológica.
- El asistente es local y usa herramientas del proyecto. Puede explicar resultados y ejecutar un escenario con más alerta; no utiliza un LLM generativo ni credenciales externas.
- La consola de la vista 3D presentó una advertencia de rendimiento Canvas2D de Plotly, sin errores de aplicación.
