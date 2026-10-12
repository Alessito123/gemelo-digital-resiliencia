"""API local del gemelo y del laboratorio CRISP-DM."""
from __future__ import annotations

import logging
import json
import threading
import uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from typing import Literal

import numpy as np
import pandas as pd
import requests
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from python_engine.models import WorkflowInput, WorkflowResult
from python_engine.workflow import run_workflow
from python_engine.research_data import FEATURES, explore_dataset
from python_engine.research_ml import train_experiment
from python_engine.public_sources import public_snapshot
from python_engine.chat_assistant import ChatRequest, ChatResponse, answer_question

app = FastAPI(title="Gemelo de resiliencia · motor Python", version="2.0.0")
logger = logging.getLogger(__name__)
pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="research")
gate = threading.BoundedSemaphore(1)
lock = threading.Lock()
jobs: dict = {}
estimators: dict = {}
REPORT_DIRECTORY = Path(__file__).resolve().parent / "output" / "research"


class RunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    seed: int = Field(default=202609, ge=1, le=2147483647)


class JobView(BaseModel):
    id: str
    status: Literal["running", "completed", "failed"]
    progress: float
    message: str
    result: dict | None = None


class PredictionInput(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    X: int = Field(ge=1, le=9)
    Y: int = Field(ge=1, le=9)
    month: Literal["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    day: Literal["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    FFMC: float = Field(ge=0, le=101)
    DMC: float = Field(ge=0, le=500)
    DC: float = Field(ge=0, le=1500)
    ISI: float = Field(ge=0, le=100)
    temp: float = Field(ge=-30, le=60)
    RH: float = Field(ge=0, le=100)
    wind: float = Field(ge=0, le=150)
    rain: float = Field(ge=0, le=1000)


class PredictionResult(BaseModel):
    model: str
    predicted_area_ha: float
    warning: str


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "stack": "Python / FastAPI / LangGraph / scikit-learn"}


@app.post("/api/assistant/messages", response_model=ChatResponse)
def assistant_message(payload: ChatRequest):
    with lock:
        report = jobs.get(payload.run_id, {}).get("result") if payload.run_id else None
    try:
        return answer_question(payload, report)
    except ValueError as error:
        raise HTTPException(422, "Invalid simulation context") from error


@app.get("/api/public-data/{source}")
def public_data(source: Literal["usgs", "nasa", "osm"],
                settlement: Literal["medellin-comuna13", "lima-sjl", "cartagena-cienaga", "lapaz-cotahuma"]):
    try:
        return public_snapshot(source, settlement)
    except (requests.RequestException, ValueError, KeyError, TypeError, IndexError) as error:
        raise HTTPException(503, "La fuente externa no respondió con datos verificables; reintente más tarde.") from error


@app.post("/api/simulation/runs", response_model=WorkflowResult)
def simulate(payload: WorkflowInput):
    try:
        return run_workflow(payload)
    except ValueError as error:
        raise HTTPException(422, "Configuración de simulación inválida") from error


@app.get("/api/ml/dataset")
def dataset(seed: int = Query(default=202609, ge=1, le=2147483647)) -> dict:
    try:
        return explore_dataset(seed)
    except (requests.RequestException, ValueError) as error:
        logger.warning("Dataset no disponible: %s", type(error).__name__)
        raise HTTPException(503, "No se pudo verificar el dataset UCI; reintente la consulta.") from error


def execute_job(run_id: str, seed: int):
    def progress(value, message):
        with lock:
            jobs[run_id] = {**jobs[run_id], "progress": value, "message": message}
    try:
        report, estimator = train_experiment(seed, progress)
        REPORT_DIRECTORY.mkdir(parents=True, exist_ok=True)
        (REPORT_DIRECTORY / f"{run_id}.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        with lock:
            estimators[run_id] = estimator
            jobs[run_id] = {"id": run_id, "status": "completed", "progress": 1.,
                            "message": "Experimento terminado", "result": report}
    except Exception:
        logger.exception("Error en experimento %s", run_id)
        with lock:
            jobs[run_id] = {"id": run_id, "status": "failed", "progress": 0.,
                            "message": "Falló el experimento. Consulte el registro local de la API.", "result": None}
    finally:
        gate.release()


@app.post("/api/ml/runs", status_code=202, response_model=JobView)
def create_run(payload: RunRequest):
    if not gate.acquire(blocking=False):
        raise HTTPException(409, "Ya hay un entrenamiento activo; espere su finalización.")
    run_id = uuid.uuid4().hex
    job = {"id": run_id, "status": "running", "progress": 0.,
           "message": "Preparando experimento", "result": None}
    with lock:
        while len(jobs) >= 8:
            oldest = next(iter(jobs))
            jobs.pop(oldest)
            estimators.pop(oldest, None)
        jobs[run_id] = job
    try:
        pool.submit(execute_job, run_id, payload.seed)
    except Exception:
        with lock:
            jobs.pop(run_id, None)
        gate.release()
        raise
    return job


@app.get("/api/ml/runs/{run_id}", response_model=JobView)
def get_run(run_id: str):
    with lock:
        job = jobs.get(run_id)
        if job is None:
            raise HTTPException(404, "Experimento inexistente o retirado de memoria")
        return dict(job)


@app.get("/api/ml/runs")
def list_runs() -> list[dict]:
    with lock:
        return [{"id": job["id"], "status": job["status"], "message": job["message"]} for job in jobs.values()]


@app.post("/api/ml/runs/{run_id}/predictions", response_model=PredictionResult)
def predict(run_id: str, payload: PredictionInput):
    with lock:
        estimator = estimators.get(run_id)
        job = jobs.get(run_id)
    if estimator is None or job is None:
        raise HTTPException(404, "El modelo entrenado no está disponible")
    row = pd.DataFrame([payload.model_dump()])[FEATURES]
    value = float(max(0., np.expm1(estimator.predict(row)[0])))
    return PredictionResult(model=job["result"]["winner"], predicted_area_ha=value,
                            warning="Estimación experimental de área quemada; no extrapolar a resiliencia urbana.")
