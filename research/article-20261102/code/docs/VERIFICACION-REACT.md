# React + FastAPI: verificación local

## Interfaz principal

La entrada es `src/main.tsx` → `src/reactApp/Platform.tsx`. El frontend activo usa React/TypeScript y Three.js. Los estados, métricas, entrenamiento, predicciones, asistente y consultas externas se obtienen mediante HTTP de FastAPI, sin usar el motor TypeScript histórico.

- Desarrollo: `.venv-streamlit\Scripts\python.exe run_react.py` → http://127.0.0.1:5178.
- Compilación: `npm run build`. La API sirve esa compilación en http://127.0.0.1:8010.
- Producción local: `.venv-streamlit\Scripts\python.exe run_react.py --production`.
- API: http://127.0.0.1:8010/docs. Los puertos son configurables mediante `GEMELO_API_PORT` y `GEMELO_WEB_PORT`.

## Evidencia de verificación

- `npm run lint`: correcto. Comprueba el código activo y los módulos de soporte; excluye la entrada histórica `src/App.tsx`, además de entornos y artefactos generados.
- `npm run build`: correcto. Vistas de investigación, datos y Three.js se cargan por separado. Vite advierte que el chunk diferido de Three.js supera 500 kB sin comprimir; no se carga en Inicio.
- Suite Python: 19 pruebas correctas.
- Suite TypeScript histórica: 31 pruebas correctas, ejecutadas para conservar sus módulos de referencia; no sustituyen la verificación del nuevo frontend.
- Navegación real con Playwright: Inicio, Gemelo, Guía → EDA, entrenamiento, resultados y predicción.
- Simulación iniciada desde React: HTTP 200, 52 hogares en Lima y 21 estados temporales. Maqueta Three.js renderizada en `output/playwright/react-twin-3d.png`.
- Chat flotante: comparación de alerta recalculada por Python, con dos identificadores de ejecución y sin credenciales externas.
- Dataset UCI consultado desde React: EDA con muestra, histograma, correlaciones y particiones.
- Entrenamiento iniciado desde React y completado: ejecución `9030687aefe246949b5033107341230f`, conservada en `output/research/`. Seleccionó Gradient Boosting; el criterio y los límites estadísticos se muestran en la interfaz.
- Formulario React → endpoint de predicción: respuesta mostrada de 0.230 ha con los valores de ejemplo.
- Interfaz inspeccionada en inglés y tema negro. Guía comprobada a 320, 768, 1024 y 1440 px sin desbordamiento horizontal del documento. Capturas `output/playwright/react-guide-320.png` y `react-guide-1440.png`.
- Compilación servida desde FastAPI comprobada con navegador. Documentación de API comprobada a través del proxy de Vite (HTTP 200).

## Alcance

No certifica accesibilidad WCAG ni un despliegue público. La maqueta es sintética; las calles no son rutas calculadas. El benchmark observado de incendios no valida resiliencia urbana. El asistente usa herramientas locales, no un LLM generativo. Tras reiniciar la API, se conserva el informe JSON pero debe entrenarse de nuevo para obtener un estimador activo.

Se preservan Streamlit (`run_python.py`) y la entrada histórica React como referencias documentadas; no son el frontend principal.

## Figuras de alta resolución

- Botones de exportación de 1920/3840 px en el gemelo 3D, histograma, correlaciones, ranking y gráfico observado/predicho. Los gráficos admiten además SVG vectorial con estilos incorporados.
- Three.js vuelve a renderizar a resolución de salida y restaura tamaño, cámara y densidad del visor. No se amplía una captura de pantalla. Se añaden título, leyenda y contexto sintético.
- Descargas reales verificadas con Playwright y PNG inspeccionados visualmente: gemelo 3840×2740, histograma 3840×1741, correlaciones 3840×4368, ranking 3840×1817 y dispersión 3840×2039.
- PNG oscuro a 1920 px verificado; SVG de histograma, matriz y dispersión descargados y analizados como XML válido. Dimensiones de salida y tema se conservan.
- Evidencia: `output/playwright/export-twin-4k.png`, `histogram-4k.png`, `correlations-4k.png`, `model-ranking-4k.png`, `test-predictions-4k.png` y sus variantes SVG.
- Dos pruebas TypeScript nuevas verifican límites de resolución/memoria y nombres de archivo. Prueba Python de regresión para que la entrada React se sirva con `Cache-Control: no-store` al iniciar el servidor actualizado.
- Las dimensiones indican píxeles, no una promesa de metadatos de impresión de 300 ppp. SVG permite ampliación vectorial; las proporciones y etiquetas responden a la figura visible.
