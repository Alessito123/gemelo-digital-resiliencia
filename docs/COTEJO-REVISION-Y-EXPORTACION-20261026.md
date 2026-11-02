# Exportación y cotejo con la revisión por pares

Fecha: 2026-10-26. Ámbito: frontend React servido por FastAPI en el puerto 8010.

## Funcionalidad

El componente común DataTable exige título, explicación, interpretación y fuente. Exporta XLSX con Datos y Lectura, manteniendo números, booleanos y celdas vacías. Incluye la unión de columnas presentes en las filas. Los textos que parecen fórmulas permanecen literales; los objetos se serializan como texto. No se añade importación de Excel. La exportación corresponde a las filas de cada tabla, incluidas las limitaciones explícitas de las vistas previas.

Las cuatro figuras de investigación y la escena 3D muestran explicación e interpretación y las añaden al pie de sus imágenes exportadas. Las lecturas dependen de los resultados disponibles: no convierten una simulación sintética en observaciones reales ni un ranking en superioridad estadística.

La sección Guía contiene una matriz de 11 grupos de observaciones del informe de revisión por pares proporcionado por el usuario. Es una evaluación del software y de la evidencia disponible; no acredita correcciones en un manuscrito que no se ha proporcionado.

## Evidencia y límites

La ejecución 33f7ac3b460e4ceea7f5a5c59bf602ca contiene el entrenamiento sobre UCI Forest Fires, validación espacial anidada de cinco pliegues externos y cinco internos, manifiesto de 36 celdas y bootstrap de 10 000 réplicas sobre ocho celdas de prueba. Estas capacidades del motor ya estaban presentes y se conservan.

Gradient Boosting encabeza el ranking por MAE externo medio. Su R² de prueba es −0.157607981108375 y el p de Friedman es aproximadamente 0.771: estos resultados no demuestran utilidad operativa ni superioridad estadística. Los intervalos bootstrap mantienen fijas las predicciones; no incluyen incertidumbre del reentrenamiento o selección y su cobertura con pocas celdas requiere cautela. No existe una estimación formal de potencia.

Continúan pendientes la validación territorial y del gemelo 3D, evaluación con usuarios o expertos, depósito con DOI de Zenodo y verificación del manuscrito corregido (título, resumen, citas, bibliografía y comparación con literatura). La licencia MIT está disponible; no equivale a un depósito científico. No se han creado depósitos ni utilizado credenciales.

## Verificación

- Compilación de producción y comprobación TypeScript satisfactorias.
- Cuatro pruebas nuevas sobre exportación y lecturas: precisión numérica, unión de columnas, valores nulos, textos de fórmula literales, metadatos y conclusiones ligadas a los resultados.
- Suite completa de JavaScript/TypeScript: 37 pruebas aprobadas, sin fallos.
- Descargas reales de ranking, intervalos, vista previa y matriz del docente abiertas con SheetJS: hojas Datos y Lectura presentes; 11 filas en la matriz y 30 en la vista previa.
- Imagen del histograma exportada con explicación e interpretación visibles; tabla de ranking inspeccionada visualmente.
- Sin desbordamiento horizontal de página a 320, 768, 1024 y 1440 píxeles; consola del navegador sin errores ni advertencias durante la revisión.

No se modificó el documento Word original ni se efectuaron nuevas validaciones empíricas.
