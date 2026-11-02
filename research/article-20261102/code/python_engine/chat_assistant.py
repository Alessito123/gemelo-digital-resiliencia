"""Asistente local con herramientas verificables; no depende de un LLM."""
import unicodedata
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from .models import SimulationConfig
from .workflow import run_workflow

class ChatTurn(BaseModel):
    role: Literal["user","assistant"]
    content: str = Field(max_length=4000)

class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str = Field(min_length=1,max_length=2000)
    language: Literal["es","en"] = "es"
    config: SimulationConfig | None = None
    run_id: str | None = Field(default=None,pattern=r"^[a-f0-9]{32}$")
    history: list[ChatTurn] = Field(default_factory=list,max_length=12)

class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    mode: Literal["local-tools"] = "local-tools"

def answer_question(request: ChatRequest, report=None):
    en = request.language == "en"
    def t(es,eng): return eng if en else es
    message = unicodedata.normalize("NFKD",request.message.casefold())
    message = "".join(c for c in message if not unicodedata.combining(c))
    if message.strip() in ("explica mas","mas","why","tell me more","por que"):
        previous = next((turn.content for turn in reversed(request.history) if turn.role=="user"),"")
        message += " " + previous.casefold()
    sources=[]
    if any(word in message for word in ("mas alerta","more warning","anticipacion","what if","que pasa si","comparar escenario","compare scenario")):
        if request.config is None:
            answer=t("Primero ejecuta un escenario en Gemelo 3D. Después puedo repetirlo con 30 minutos más de alerta y comparar los resultados.",
                     "Run a scenario in Digital twin 3D first. I can then rerun it with 30 extra warning minutes and compare the results.")
        else:
            original=run_workflow({"config":request.config.model_dump(),"include_protocol":False})
            new_config=request.config.model_copy(update={"warning_lead_time_min":min(1440,request.config.warning_lead_time_min+30)})
            alternative=run_workflow({"config":new_config.model_dump(),"include_protocol":False})
            a,b=original.simulation.metrics,alternative.simulation.metrics
            answer=t(f"Recalculé el mismo escenario y semilla con {new_config.warning_lead_time_min:g} minutos de alerta. Evacuación: {a.evacuation_rate_pct:.1f}% → {b.evacuation_rate_pct:.1f}%. Hogares atrapados: {a.trapped_households} → {b.trapped_households}. Es una comparación del modelo sintético, no evidencia de una intervención real.",
                     f"I reran the same scenario and seed with {new_config.warning_lead_time_min:g} warning minutes. Evacuation: {a.evacuation_rate_pct:.1f}% → {b.evacuation_rate_pct:.1f}%. Trapped households: {a.trapped_households} → {b.trapped_households}. This compares synthetic simulations, not observed interventions.")
            sources=[original.execution_id,alternative.execution_id]
    elif any(word in message for word in ("modelo","model","r2","r²","mae","rmse","ganador","winner","significa","significan")):
        if report is not None:
            metrics=report["test_metrics"]
            p=report["statistics"]["friedman"]["p_value"]
            answer=t(f"El modelo seleccionado es {report['winner']}, por el menor MAE log medio en los cinco folds externos. En prueba reservada: MAE {metrics['mae_ha']:.3f} ha; RMSE {metrics['rmse_ha']:.3f} ha; R² {metrics['r2']:.3f}. Friedman p={p:.4f}. Un R² negativo significa que la predicción es peor, según error cuadrático, que usar la media del conjunto de prueba. Selección no equivale a superioridad estadística ni valida resiliencia urbana.",
                     f"The selected model is {report['winner']}, with the lowest mean log MAE across five outer folds. Held-out test: MAE {metrics['mae_ha']:.3f} ha; RMSE {metrics['rmse_ha']:.3f} ha; R² {metrics['r2']:.3f}. Friedman p={p:.4f}. Negative R² means predictions have higher squared error than the test-set mean. Selection does not imply statistical superiority or validate urban resilience.")
            sources=[request.run_id or "research report","UCI DOI:10.24432/C5D88D"]
        else:
            answer=t("Todavía no tengo una ejecución de entrenamiento en el contexto. Abre Investigación, entrena y regresa aquí. MAE es el error absoluto medio; RMSE penaliza más los errores grandes. El mejor modelo se elige por validación, nunca mirando primero la prueba reservada.",
                     "There is no training run in my context yet. Open Research, train and return here. MAE is mean absolute error; RMSE penalizes large errors more strongly. Selection uses validation, never the held-out test.")
    elif any(word in message for word in ("fold","crisp","eda","hiperparam","hyperparam","validacion","cross-validation")):
        answer=t("El flujo sigue CRISP-DM: definir el problema, comprender y preparar datos, entrenar, evaluar y usar el modelo. El EDA explora solo desarrollo. Cinco folds externos evalúan; dentro de cada uno, otros cinco ajustan hiperparámetros. Las celdas espaciales no se comparten entre lados del fold, y el preprocesamiento se aprende únicamente del entrenamiento. La prueba final queda apartada de la selección.",
                 "CRISP-DM covers problem definition, data understanding and preparation, modeling, evaluation and deployment. EDA uses development data only. Five outer folds evaluate models; five inner folds tune hyperparameters. Spatial cells are kept separate, and preprocessing learns only from training data. The final test is excluded from selection.")
        sources=["SPEC-python-ml.md"]
    elif any(word in message for word in ("3d","terreno","terrain","hogar","household","real","dato","data","fuente","source")):
        answer=t("Los edificios 3D representan hogares sintéticos del motor. Sus estados sí proceden de la simulación, pero las posiciones y el terreno son esquemáticos; no son una reconstrucción satelital. UCI aporta incendios observados de Portugal para entrenamiento. USGS, NASA POWER y OpenStreetMap aportan contexto público; no constituyen datos observados de resiliencia de hogares.",
                 "The 3D buildings represent synthetic households. Their states come from the simulation, but positions and terrain are schematic, not a satellite reconstruction. UCI provides observed Portuguese fires for training. USGS, NASA POWER and OpenStreetMap provide public context, not observed household resilience.")
        sources=["SPEC-experience-3d.md","UCI DOI:10.24432/C5D88D"]
    elif any(word in message for word in ("resumen","summary","resultado","result","evacua","riesgo","risk","resilien")):
        if request.config is None:
            answer=t("Ejecuta el gemelo primero para que pueda explicar tus resultados concretos.","Run the digital twin first so I can explain your specific results.")
        else:
            result=run_workflow({"config":request.config.model_dump(),"include_protocol":False})
            m=result.simulation.metrics
            answer=t(f"En {result.simulation.city}, esta simulación tiene {m.total_households} hogares. {m.safe_households} llegan a salvo ({m.evacuation_rate_pct:.1f}%) y {m.trapped_households} quedan atrapados. El índice sintético de resiliencia es {m.resilience_index:.1f}/100. La geometría 3D no agrega precisión geográfica al modelo. Puedes pedirme '¿Qué pasa con más alerta?' para comparar una intervención.",
                     f"In {result.simulation.city}, this simulation contains {m.total_households} households. {m.safe_households} reach safety ({m.evacuation_rate_pct:.1f}%) and {m.trapped_households} remain trapped. The synthetic resilience index is {m.resilience_index:.1f}/100. 3D geometry does not add geographic accuracy. Ask 'What if we have more warning?' to compare an intervention.")
            sources=[result.execution_id]
    else:
        answer=t("Soy un asistente local especializado en este proyecto, basado en herramientas y explicaciones verificables; no un modelo generativo general. Puedo resumir tu simulación, comparar más tiempo de alerta, explicar el modelo seleccionado, CRISP-DM, EDA y cinco folds, o aclarar de dónde salen los datos. ¿Cuál de esos temas quieres explorar?",
                 "I am a local project assistant using tools and verifiable explanations, not a general generative model. I can summarize your simulation, compare extra warning time, explain model selection, CRISP-DM, EDA and five folds, or clarify data sources. Which would you like to explore?")
    return ChatResponse(answer=answer,sources=sources)
