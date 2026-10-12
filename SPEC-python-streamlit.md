# Spec: aplicación Python + Streamlit

## Objective

Añadir una aplicación académica independiente en Python que permita ejecutar y explicar el gemelo digital multi-escala desde Streamlit. Debe conservar la aplicación React existente, funcionar sin credenciales y demostrar explícitamente Python, Streamlit y LangGraph ante el docente.

## Tech Stack

- Python 3.12+
- Streamlit 1.40+
- LangGraph para Python
- Pydantic 2 para límites y contratos
- Pandas y Plotly para tablas y visualización
- `unittest` de la biblioteca estándar para pruebas reproducibles

## Commands

```powershell
python -m pip install --requirement requirements-streamlit.txt
python -m unittest discover -s python_tests -v
python -m streamlit run streamlit_app.py --server.port 8501
```

## Project Structure

```text
streamlit_app.py             → entrada de la interfaz
python_engine/
  models.py                  → contratos Pydantic
  presets.py                 → asentamientos y escenarios
  simulation.py              → motor determinista micro–meso–macro
  workflow.py                → orquestación LangGraph
  advisor.py                 → diagnóstico y protocolo local
python_tests/                → pruebas de seams públicos
requirements-streamlit.txt   → dependencias fijadas
```

## Public seams

```python
run_simulation(config: SimulationConfig) -> SimulationResult
run_workflow(input_data: WorkflowInput | dict) -> WorkflowResult
```

La aplicación Streamlit consumirá únicamente `run_workflow`; no accederá a nodos internos del grafo.

## Code Style

```python
def run_simulation(config: SimulationConfig) -> SimulationResult:
    """Ejecuta una simulación reproducible y acotada."""
    validated = SimulationConfig.model_validate(config)
    return _simulate(validated)
```

- `snake_case`, tipos explícitos y datamodels Pydantic.
- Funciones puras en el dominio; Streamlit solo presenta resultados.
- Textos científicos en español y nombres técnicos de código en inglés.

## Testing Strategy

- Seam `run_simulation`: misma semilla produce el mismo resultado; parámetros fuera de rango se rechazan; ayuda mutua cambia resultados.
- Seam `run_workflow`: traza ordenada, rama ilustrativa/observada y protocolo opcional.
- Smoke test: `streamlit_app.py` compila e importa sin iniciar servicios externos.

## Security and privacy boundaries

### Always

- Validar controles y datasets con Pydantic.
- Limitar pasos, tamaños de observaciones y magnitudes.
- Mantener datos únicamente en la sesión de Streamlit.
- Escapar texto mediante componentes nativos; el CSS fijo no incorpora entradas del usuario.

### Ask first

- Incorporar credenciales, LLM externos o almacenamiento persistente.
- Publicar la aplicación en una cuenta externa.

### Never

- Guardar nombres, teléfonos o coordenadas individuales.
- Ejecutar texto del usuario, aceptar URLs arbitrarias o incluir secretos en el código.
- Presentar una simulación como alerta oficial.

## Threat model breve

- Frontera: widgets y JSON importado → Pydantic; abuso: valores extremos/DoS → límites estrictos.
- Activo: integridad científica; abuso: afirmar validación inexistente → etiqueta de evidencia y limitaciones obligatorias.
- Activo: disponibilidad; abuso: ejecuciones grandes → máximo de 60 pasos y 5.000 observaciones.
- No hay autenticación, base de datos, PII ni llamadas externas en esta entrega.

## Success Criteria

- Arranca con el comando documentado en el puerto 8501.
- Permite seleccionar territorio, amenaza, intensidad, alerta, semilla y mecanismos multi-escala.
- Muestra métricas, curva temporal, fragilidades, traza LangGraph, diagnóstico y protocolo.
- Funciona offline después de instalar dependencias.
- Todas las pruebas Python pasan y el código compila.

## Open Questions

- Ninguna para esta entrega. Integraciones externas quedan fuera de alcance hasta autorización explícita.
