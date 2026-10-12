"""Investigación bilingüe con pasos guiados y términos explicados."""
import json
import numpy as np
import pandas as pd
import plotly.express as px
import requests
import streamlit as st
from python_ui_client import api_request
from ui_design import tr,heading,chart_theme

@st.cache_data(ttl=600,show_spinner=False)
def fetch_dataset(seed):
    return api_request("GET",f"/api/ml/dataset?seed={seed}")

def display_model(name):
    return tr("Base mediana","Median baseline") if name=="Base mediana" else name

@st.fragment(run_every="3s")
def watch_run():
    run_id=st.session_state.get("ml_run_id")
    if not run_id or (st.session_state.get("ml_displayed_id")==run_id and st.session_state.get("ml_result") is not None):
        return
    try:
        job=api_request("GET",f"/api/ml/runs/{run_id}")
        if job["status"]=="running":
            st.progress(job["progress"],text=tr("Entrenando y comparando modelos…","Training and comparing models…"))
        elif job["status"]=="failed":
            st.error(tr("No se pudo completar el entrenamiento. Revisa la API y reintenta.","Training could not complete. Check the API and retry."))
        else:
            st.session_state.ml_result=job["result"]
            if st.session_state.get("ml_displayed_id")!=run_id:
                st.session_state.ml_displayed_id=run_id
                st.rerun()
    except (ValueError,requests.RequestException):
        st.error(tr("La ejecución no está disponible. Puede que el servidor se haya reiniciado.","This run is unavailable. The server may have restarted."))

def render_results(run_id,result):
    st.header(tr("El resultado, explicado","The result, explained"))
    st.write(tr("Modelo seleccionado: ","Selected model: ")+display_model(result["winner"]))
    st.caption(tr("Se elige por menor error en validación; no es una garantía de precisión.","Selection uses the lowest validation error; it is not a guarantee of accuracy."))
    summary,detail,statistics,prediction=st.tabs([tr("Comparar","Compare"),tr("5 folds y parámetros","5 folds & parameters"),tr("Estadística","Statistics"),tr("Predecir","Predict")])
    with summary:
        rank=pd.DataFrame(result["ranking"])
        rank["model"]=rank["model"].map(display_model)
        st.table(rank.rename(columns={"model":tr("Modelo","Model"),"mean_mae_log":tr("Error medio · menor es mejor","Mean error · lower is better"),"std_mae_log":tr("Variación","Variation")}).round(4))
        frame=pd.DataFrame(result["fold_results"])
        frame["model"]=frame["model"].map(display_model)
        st.plotly_chart(chart_theme(px.box(frame,x="model",y="mae_log",points="all",labels={"model":tr("Modelo","Model"),"mae_log":tr("Error logarítmico","Log error")})),theme=None,width="stretch")
        m=result["test_metrics"]
        a,b,c=st.columns(3)
        a.metric(tr("Error medio (ha)","Mean error (ha)"),f"{m['mae_ha']:.3f}")
        b.metric("RMSE (ha)",f"{m['rmse_ha']:.3f}")
        c.metric("R²",f"{m['r2']:.3f}")
        st.info(tr("MAE: cuánto se equivoca en promedio. RMSE: penaliza más los errores grandes. R² negativo: peor que usar la media de prueba. Estas métricas se calculan en datos reservados.",
                   "MAE: average prediction error. RMSE: penalizes large errors more. Negative R²: worse than the test-set mean. These metrics use held-out data."))
        observed=pd.DataFrame(result["test_predictions"])
        st.plotly_chart(chart_theme(px.scatter(observed,x="observed_ha",y="predicted_ha",labels={"observed_ha":tr("Área real (ha)","Observed area (ha)"),"predicted_ha":tr("Área estimada (ha)","Predicted area (ha)")})),theme=None,width="stretch")
    with detail:
        st.write(tr("Cada modelo pasa por cinco evaluaciones externas. Dentro de cada una, cinco particiones buscan los mejores parámetros.","Each model undergoes five outer evaluations. Within each, five inner splits find the best parameters."))
        st.dataframe(pd.DataFrame(result["fold_results"]),hide_index=True,width="stretch")
        st.write(tr("Parámetros finales","Final parameters"))
        st.json(result["best_params"])
        with st.expander(tr("Todas las búsquedas (campos técnicos originales)","All searches (original technical fields)")):
            st.dataframe(pd.DataFrame(result["hyperparameter_search"]),hide_index=True,width="stretch")
    with statistics:
        st.write(tr("Friedman compara los cuatro modelos. Wilcoxon compara pares; Holm corrige las comparaciones múltiples.","Friedman compares all four models. Wilcoxon compares pairs; Holm adjusts for multiple comparisons."))
        st.metric("Friedman · p",f"{result['statistics']['friedman']['p_value']:.4f}")
        st.dataframe(pd.DataFrame(result["statistics"]["wilcoxon_holm"]),hide_index=True,width="stretch")
        st.info(tr("Cinco folds tienen poca potencia y comparten entrenamiento. No encontrar significancia no demuestra que los modelos sean equivalentes.","Five folds have low power and share training data. A non-significant result does not prove equivalence."))
        st.write(tr("Shapiro–Wilk evalúa normalidad de los residuos, no calidad predictiva.","Shapiro–Wilk checks residual normality, not predictive quality."))
        st.json(result["residual_shapiro"] if st.session_state.language=="es" else {k:v for k,v in result["residual_shapiro"].items() if k!="interpretation"})
    with prediction:
        try:
            example=fetch_dataset(result["seed"])["preview"][0]
        except (ValueError,requests.RequestException):
            st.error(tr("No se pudo cargar el formulario.","Unable to load the prediction form."))
            return
        st.caption(tr("Variables del parque de Montesinho, Portugal. X/Y son celdas, no latitud/longitud.","Variables from Montesinho park, Portugal. X/Y are grid cells, not latitude/longitude."))
        with st.form("prediction"):
            values={}
            columns=st.columns(3)
            for index,name in enumerate(["X","Y","FFMC","DMC","DC","ISI","temp","RH","wind","rain"]):
                with columns[index%3]:
                    if name in ("X","Y"):
                        values[name]=st.number_input(name,1,9,int(example[name]),key="predict_"+name)
                    else:
                        values[name]=st.number_input(name,value=float(example[name]),key="predict_"+name)
            values["month"]=st.selectbox(tr("Mes","Month"),"jan feb mar apr may jun jul aug sep oct nov dec".split(),key="predict_month")
            values["day"]=st.selectbox(tr("Día","Day"),"mon tue wed thu fri sat sun".split(),key="predict_day")
            submit=st.form_submit_button(tr("Estimar área quemada","Estimate burned area"))
        if submit:
            try:
                answer=api_request("POST",f"/api/ml/runs/{run_id}/predictions",values)
                st.metric(tr("Área estimada","Estimated area"),f"{answer['predicted_area_ha']:.3f} ha")
            except (ValueError,requests.RequestException):
                st.error(tr("Modelo no disponible o valores inválidos. Si reiniciaste el servidor, vuelve a entrenar.","Model unavailable or invalid values. Retrain if the server was restarted."))
    st.download_button(tr("Descargar informe JSON","Download JSON report"),json.dumps(result,ensure_ascii=False,indent=2),f"research-{run_id}.json","application/json")
    st.caption(tr("El informe conserva campos y textos técnicos originales.","The report preserves original technical fields and source text."))

def render_research():
    heading(tr("LABORATORIO / DATOS OBSERVADOS","LABORATORY / OBSERVED DATA"),tr("Aprender de la evidencia.","Learn from evidence."),
            tr("Explora datos reales, entrena cuatro modelos y entiende por qué se selecciona uno.","Explore real data, train four models and understand why one is selected."))
    seed=int(st.number_input(tr("Semilla · usa la misma para repetir resultados","Seed · use the same value to repeat results"),min_value=1,max_value=2147483647,value=202609,key="research_seed"))
    step=st.radio(tr("Tu siguiente paso","Your next step"),["method","data","train"],horizontal=True,
                  format_func=lambda x:{"method":tr("1 · Comprender","1 · Understand"),"data":tr("2 · Explorar datos","2 · Explore data"),"train":tr("3 · Entrenar","3 · Train")}[x],key="research_step")
    if step=="method":
        st.info(tr("UCI Forest Fires contiene incendios observados en Portugal. El objetivo es estimar área quemada; no mide la resiliencia de hogares informales.",
                   "UCI Forest Fires contains observed fires in Portugal. The goal is to estimate burned area; it does not measure informal household resilience."))
        phases=[("Definir el problema","Define the problem","Estimar daño por incendio.","Estimate fire damage."),
                ("Conocer los datos","Understand the data","Revisar procedencia, faltantes y distribución.","Review provenance, missing values and distribution."),
                ("Preparar","Prepare","Separar ubicaciones y aprender transformaciones solo con entrenamiento.","Separate locations and learn transformations from training only."),
                ("Entrenar","Train","Comparar cuatro modelos con ajuste de parámetros.","Compare four models with parameter tuning."),
                ("Evaluar","Evaluate","Cinco folds externos, cinco internos y prueba reservada.","Five outer folds, five inner folds and a held-out test."),
                ("Utilizar con criterio","Use with care","Predecir, exportar y documentar limitaciones.","Predict, export and document limitations.")]
        for i,(es,en,desc_es,desc_en) in enumerate(phases,1):
            with st.expander(f"{i:02d} · {tr(es,en)}",expanded=i==1):
                st.write(tr(desc_es,desc_en))
    elif step=="data":
        try:
            with st.spinner(tr("Consultando datos…","Loading data…")):
                data=fetch_dataset(seed)
            a,b,c=st.columns(3)
            a.metric(tr("Registros originales","Original records"),data["metadata"]["raw_rows"])
            b.metric(tr("Para desarrollo","Development"),data["development_rows"])
            c.metric(tr("Reservados para prueba","Held out for testing"),data["test_rows"])
            st.caption(tr("Se muestran solo datos de desarrollo. Cuatro duplicados exactos fueron retirados.","Only development data are shown. Four exact duplicates were removed."))
            st.dataframe(pd.DataFrame(data["preview"]),width="stretch",hide_index=True)
            st.plotly_chart(chart_theme(px.histogram(x=np.log1p(data["target_values"]),nbins=30,labels={"x":tr("Área quemada · escala log","Burned area · log scale")})),theme=None,width="stretch")
            st.plotly_chart(chart_theme(px.imshow(pd.DataFrame(data["correlations"]),zmin=-1,zmax=1,color_continuous_scale="Greys",title=tr("Cómo se relacionan las variables","How variables relate"))),theme=None,width="stretch")
            with st.expander(tr("Resumen estadístico","Statistical summary")):
                st.dataframe(pd.DataFrame(data["summary"]),width="stretch")
            st.link_button(tr("Ver fuente y licencia UCI","View UCI source and license"),"https://archive.ics.uci.edu/dataset/162/forest+fires")
            with st.expander(tr("Metadatos originales","Original metadata")):
                st.json(data["metadata"])
        except (ValueError,requests.RequestException):
            st.error(tr("Datos no disponibles. Comprueba tu conexión y FastAPI.","Data unavailable. Check your connection and FastAPI."))
    else:
        with st.expander(tr("Recuperar una ejecución por ID","Recover a run by ID")):
            saved_id=st.text_input(tr("Identificador de ejecución","Run identifier"),max_chars=32)
            if st.button(tr("Cargar ejecución","Load run")):
                if len(saved_id)==32 and all(c in "0123456789abcdef" for c in saved_id):
                    st.session_state.ml_run_id=saved_id
                    st.session_state.pop("ml_result",None)
                else:
                    st.error(tr("El ID debe tener 32 caracteres hexadecimales.","The ID must contain 32 hexadecimal characters."))
        if "ml_run_id" not in st.session_state:
            try:
                recent=api_request("GET","/api/ml/runs")
                if recent: st.session_state.ml_run_id=recent[-1]["id"]
            except (ValueError,requests.RequestException): pass
        st.write(tr("Comparamos una referencia simple, Ridge, Random Forest y Gradient Boosting. El entrenamiento puede tardar unos minutos.","We compare a simple baseline, Ridge, Random Forest and Gradient Boosting. Training may take a few minutes."))
        if st.button(tr("Entrenar y comparar","Train and compare"),type="primary"):
            try:
                job=api_request("POST","/api/ml/runs",{"seed":seed})
                st.session_state.ml_run_id=job["id"]
                st.session_state.pop("ml_result",None)
            except (ValueError,requests.RequestException):
                st.error(tr("No se pudo iniciar. Comprueba la API o espera a que termine la ejecución activa.","Unable to start. Check the API or wait for the active run."))
        watch_run()
        if st.session_state.get("ml_result"):
            st.caption(f"Seed: {st.session_state.ml_result['seed']} · ID: {st.session_state.ml_run_id}")
            render_results(st.session_state.ml_run_id,st.session_state.ml_result)
