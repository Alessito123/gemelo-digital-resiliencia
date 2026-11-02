# Reproducir la revisión del 26 de octubre de 2026

## Entorno y datos

El motor se verificó en Windows con Python 3.12.9. requirements-lock.txt congela los paquetes instalados en ese entorno; no representa un entorno Linux probado. El conjunto histórico UCI se conserva sin alterar, bajo CC BY 4.0, separado de la licencia MIT del código. Su hash debe coincidir con el archivo original de entrenamiento.

## Auditoría sin reentrenar

Desde la carpeta codigo, con el entorno instalado:

```text
python -m scripts.audit_research_report --dataset research_artifacts/forest_fires_uci.csv --report research_artifacts/forest_fires_original.json --out research_artifacts/revision_reproducida.json
python -m unittest discover -s python_tests -v
```

El script comprueba hash, 58 filas reservadas y valores observados. Calcula bootstrap por ocho celdas con 10000 réplicas y semilla 202609. El resultado esperado es MAE [6.9121379229, 27.4684339425], RMSE [16.4684555328, 61.3479469415], R² [−0.3069735707, −0.1025946491]. Intervalos condicionales exploratorios, no incluyen nuevos ajustes o selección. No acreditan efectividad operacional.

## App React y nuevo entrenamiento

```text
python -m pip install -r requirements-lock.txt
npm ci
npm run lint
npm run build
python run_react.py --production
```

En Investigación → Entrenar, ejecutar el experimento con semilla 202609. El entrenamiento nuevo descarga UCI y requiere conexión. La ampliación del informe ya guardado funciona con los archivos locales; no requiere descargar datos. Las consultas públicas del resto de la app requieren conexión. El reentrenamiento local de verificación coincidió con las métricas originales con tolerancia 1e-9.

## Evidencias y estado

26 pruebas Python aprobaron; TypeScript y compilación de React aprobaron. La compilación mantiene una advertencia de tamaño del paquete 3D, sin error. Verificacion_motor.json documenta reentrenamiento y exportación FastAPI. Evidencia_app_intervalos.png muestra los resultados reales en React. La respuesta al docente enumera cambios y pendientes. No se han realizado encuestas, juicio de expertos ni validación territorial. GitHub conserva la revisión pública previa; este paquete es una versión local con hash. Zenodo/DOI sigue pendiente.
