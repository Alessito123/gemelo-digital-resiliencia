# Recorrido de demostración para el docente

La presentación visual está en [index.html](index.html). La aplicación completa debe iniciarse con Python/FastAPI; una página estática de GitHub Pages no ejecuta ese motor.

| Paso | Dónde entrar | Qué demostrar | Cómo interpretarlo |
|---|---|---|---|
| 1 | Inicio | Propósito, navegación y controles de idioma y apariencia | Es un prototipo académico con dos módulos de evidencia distintos. |
| 2 | Gemelo 3D | Configuración, simulación, selección de hogares y tiempo | Son hogares sintéticos; la escena no es cartografía validada. |
| 3 | Investigación → EDA | Calidad, distribuciones y correlaciones de desarrollo | Las asociaciones no establecen causalidad. La prueba reservada no se usa en EDA. |
| 4 | Investigación → Entrenar | Cuatro modelos, 5 folds externos y 5 internos, hiperparámetros | El menor MAE externo establece un ranking; no prueba superioridad estadística. |
| 5 | Investigación → Validación | Predicciones reservadas, R², intervalos y pruebas | El experimento documentado tiene R² negativo; no acredita utilidad operativa. |
| 6 | Datos públicos | Consulta de USGS/NASA POWER/OSM y procedencia | Son registros contextuales, sin fusionarlos como etiquetas de resiliencia. |
| 7 | Tablas y figuras | Descargar Excel, PNG y SVG | Excel contiene Datos y Lectura; las exportaciones conservan explicaciones. |
| 8 | Guía para sustentar | Cotejo exportable de la revisión | Diferencia funciones implementadas y estudios científicos pendientes. |

El asistente flotante usa herramientas locales y explica el contexto disponible. No es un LLM generativo externo.

Para la instalación, consulta el apartado técnico desplegable del README. La dirección localhost corresponde al equipo que ejecuta el servidor: no permite al docente entrar desde su computadora por sí sola.
