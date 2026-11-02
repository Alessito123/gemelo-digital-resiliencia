# Revisión metodológica del 26 de octubre de 2026

## Alcance

Se evalúa el módulo de área quemada de GDDN (Gemelo Digital de Resiliencia Comunitaria), no la validez territorial de la escena urbana. El dataset histórico y los modelos permanecen separados del simulador de hogares. La corrección no intenta obtener un R² positivo cambiando la prueba.

## Decisiones y cambios

- `research_uncertainty.py`: bootstrap percentil por celdas completas, B=10000, nivel nominal 95 %, semilla del experimento. Mantiene fijas las predicciones; no incorpora variación del ajuste ni de selección. Con ocho celdas es exploratorio y no garantiza cobertura nominal.
- `research_data.partition_manifest`: igualdad exacta de etiquetas X/Y, filas y celdas por partición; no se atribuyen dimensiones métricas no documentadas. Rechaza superposición de filas o grupos.
- `research_ml`: integra intervalos, manifiesto, alcance de la evaluación y W de Kendall. El límite de resolución de Wilcoxon bilateral exacto sin ceros es 2/2^n; con n=5 vale 0,0625. Es una propiedad del test bajo esos supuestos, no una estimación de potencia. Los folds comparten ajuste.
- `ResearchAudit.tsx`: muestra la incertidumbre y la advertencia de R² negativo en React, conserva el manejo explícito de informes anteriores sin intervalos y permite inspeccionar celdas.
- `scripts.audit_research_report`: amplía un informe previo solo si coinciden hash del dataset, observaciones y reserva espacial. No reentrena ni atribuye al nuevo entorno las versiones originales del entrenamiento.

## Reproducir la ampliación del informe original

Desde la raíz del proyecto, usando el entorno de investigación:

```text
python -m scripts.audit_research_report --dataset RUTA/forest_fires_uci.csv --report RUTA/forest_fires_resultados.json --out RUTA/forest_fires_revision_pares.json
python -m unittest python_tests.test_research_uncertainty python_tests.test_research -v
npm run lint
npm run build
```

Las réplicas con varianza nula del objetivo no definen R² y se excluyen solo de ese intervalo; el JSON informa su número válido. Las filas conservan el identificador posicional del archivo depurado, no una fecha ni un identificador oficial de evento.

## Publicación

El código tiene licencia MIT, diferenciada de CC BY 4.0 del dataset. El DOI de Zenodo requiere un depósito real: no se inventa ni se declara realizado. El paquete de revisión debe identificarse por SHA-256 y mantenerse separado del commit público anterior hasta su publicación. No se modifican afirmaciones de validación de expertos o usuarios: no se ha realizado esa recogida.
