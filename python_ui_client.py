"""Cliente HTTP usado por Streamlit; la computación vive en FastAPI."""
import requests

API = "http://127.0.0.1:8000"


def api_request(method: str, path: str, payload=None):
    response = requests.request(method, API + path, json=payload, timeout=(3, 60))
    if not response.ok:
        try:
            detail = response.json().get("detail", "Error de API")
        except ValueError:
            detail = "Respuesta no válida de FastAPI"
        raise ValueError(f"HTTP {response.status_code}: {detail}")
    return response.json()
