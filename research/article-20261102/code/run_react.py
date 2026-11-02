"""Arranca React/Vite y FastAPI. --production sirve el build desde FastAPI."""
import argparse
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from urllib.request import urlopen
from python_connection import API_PORT, API_URL

ROOT=Path(__file__).resolve().parent


def listening(port):
    with socket.socket() as connection:
        return connection.connect_ex(("127.0.0.1", port)) == 0


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--production",action="store_true")
    args=parser.parse_args()
    web_port=int(os.environ.get("GEMELO_WEB_PORT","5178"))
    if not 1024 <= web_port <= 65535:
        raise SystemExit("GEMELO_WEB_PORT debe estar entre 1024 y 65535")
    if args.production and not (ROOT/"dist"/"index.html").is_file():
        raise SystemExit("Ejecute npm run build antes de iniciar producción local.")
    if not args.production and listening(web_port):
        raise SystemExit(f"Puerto React {web_port} ocupado. Use GEMELO_WEB_PORT para elegir otro.")
    venv=ROOT/".venv-streamlit"/("Scripts/python.exe" if os.name=="nt" else "bin/python")
    python=str(venv) if venv.is_file() else sys.executable
    children=[]
    try:
        if not listening(API_PORT):
            children.append(subprocess.Popen([python,"-m","uvicorn","python_api:app","--host","127.0.0.1","--port",str(API_PORT)],cwd=ROOT))
        for _ in range(60):
            try:
                with urlopen(API_URL+"/api/health",timeout=1) as response:
                    status=json.load(response)
                if status.get("stack")!="Python / FastAPI / LangGraph / scikit-learn":
                    raise SystemExit(f"Otra aplicación ocupa {API_PORT}. Cambie GEMELO_API_PORT.")
                break
            except OSError:
                time.sleep(1)
        else:
            raise RuntimeError("FastAPI no respondió durante el arranque")
        if not args.production:
            command=["node",str(ROOT/"node_modules"/"vite"/"bin"/"vite.js"),"--configLoader","runner"]
            children.append(subprocess.Popen(command,cwd=ROOT))
        print(f"React: {API_URL if args.production else f'http://127.0.0.1:{web_port}'} · API: {API_URL}/docs",flush=True)
        while children and all(child.poll() is None for child in children):
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        for child in reversed(children):
            if child.poll() is None:
                child.terminate()
        for child in children:
            try: child.wait(timeout=10)
            except subprocess.TimeoutExpired: child.kill()


if __name__=="__main__":
    main()
