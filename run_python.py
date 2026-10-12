"""Arranque local de FastAPI y Streamlit con el mismo intérprete."""
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent


def main():
    for port in (8000, 8501):
        with socket.socket() as connection:
            if connection.connect_ex(("127.0.0.1", port)) == 0:
                raise SystemExit(f"Puerto {port} ocupado. Cierre la instancia anterior antes de iniciar.")
    children = []
    try:
        children.append(subprocess.Popen([sys.executable, "-m", "uvicorn", "python_api:app", "--host", "127.0.0.1", "--port", "8000"], cwd=ROOT))
        for _ in range(30):
            if children[0].poll() is not None:
                raise RuntimeError("FastAPI terminó durante el arranque")
            try:
                with urlopen("http://127.0.0.1:8000/api/health", timeout=1) as response:
                    if response.status == 200:
                        break
            except OSError:
                time.sleep(1)
        else:
            raise RuntimeError("FastAPI no respondió durante el arranque")
        children.append(subprocess.Popen([sys.executable, "-m", "streamlit", "run", "streamlit_app.py",
                                          "--server.address", "127.0.0.1", "--server.port", "8501"], cwd=ROOT))
        print("Streamlit: http://127.0.0.1:8501 · API: http://127.0.0.1:8000/docs", flush=True)
        while all(child.poll() is None for child in children):
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        for child in children:
            if child.poll() is None:
                child.terminate()
        for child in children:
            try:
                child.wait(timeout=10)
            except subprocess.TimeoutExpired:
                child.kill()


if __name__ == "__main__":
    main()
