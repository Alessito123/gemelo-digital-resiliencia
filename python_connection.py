"""Dirección local compartida por el lanzador, la UI y sus enlaces."""
import os

API_PORT=int(os.environ.get("GEMELO_API_PORT", "8010"))
if not 1024 <= API_PORT <= 65535:
    raise ValueError("GEMELO_API_PORT debe estar entre 1024 y 65535")
API_URL=f"http://127.0.0.1:{API_PORT}"
