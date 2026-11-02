"""Mapa de evidencias y accesos para la sustentación."""
import streamlit as st
from ui_design import heading, tr
from python_connection import API_URL


def open_evidence(page, step=None, view=None):
    st.session_state.page=page
    if step:
        st.session_state.research_step=step
    if view:
        st.session_state.research_view=view


def render_guide():
    heading(tr("GUÍA / SUSTENTACIÓN", "GUIDE / PROJECT DEFENSE"),
            tr("Cada requisito. Su evidencia.", "Every requirement. Its evidence."),
            tr("Elige lo que te pide tu docente. Abre la pantalla donde puedes demostrarlo.",
               "Choose a requirement and open the screen where you can demonstrate it."))
    st.info(tr("Para mostrar resultados, primero ejecuta Investigación → 3 · Entrenar → Entrenar y comparar. Los accesos a métricas y estadística requieren una ejecución completada.",
               "To show results, first run Research → 3 · Train → Train and compare. Metrics and statistics require a completed run."))
    requirements=[
        ("01", "CRISP-DM", "CRISP-DM", "Las seis fases: problema, datos, preparación, modelado, evaluación y uso.", "Six phases: problem, data, preparation, modeling, evaluation and use.", "research","method",None,"Investigación → 1 · Comprender", "Research → 1 · Understand"),
        ("02", "Dataset real y EDA", "Real dataset & EDA", "UCI Forest Fires: fuente, duplicados retirados, histograma, correlaciones y resumen estadístico.", "UCI Forest Fires: source, removed duplicates, histogram, correlations and statistical summary.","research","data",None,"Investigación → 2 · Explorar datos", "Research → 2 · Explore data"),
        ("03", "Entrenamiento en Python", "Python training", "Cuatro alternativas: base mediana, Ridge, Random Forest y Gradient Boosting. Inicia un experimento reproducible.", "Four candidates: median baseline, Ridge, Random Forest and Gradient Boosting. Start a reproducible experiment.", "research","train",None,"Investigación → 3 · Entrenar", "Research → 3 · Train"),
        ("04", "Mejor modelo y evaluación", "Best model & evaluation", "Ranking por menor MAE log de validación; MAE, RMSE y R² en prueba reservada. Seleccionado no significa universalmente superior.", "Ranking by lowest validation log MAE; held-out MAE, RMSE and R². Selection does not imply universal superiority.", "research","train","compare","Resultados → Comparar", "Results → Compare"),
        ("05", "Validación cruzada: 5 folds", "Cross-validation: 5 folds", "Cinco evaluaciones externas con separación por celdas espaciales y sus errores individuales.", "Five outer evaluations separated by spatial cells, with individual errors.", "research","train","folds","Resultados → 5 folds y parámetros", "Results → 5 folds & parameters"),
        ("06", "Hiperparámetros: 5 folds internos", "Hyperparameters: 5 inner folds", "Búsqueda interna con GridSearchCV, parámetros finales y tabla de todas las búsquedas.", "Inner GridSearchCV search, final parameters and all search results.", "research","train","folds","Resultados → 5 folds y parámetros", "Results → 5 folds & parameters"),
        ("07", "Pruebas estadísticas", "Statistical tests", "Friedman, Wilcoxon con corrección Holm y Shapiro–Wilk. Revisa sus límites de interpretación.", "Friedman, Wilcoxon with Holm correction and Shapiro–Wilk, with interpretation limits.", "research","train","statistics","Resultados → Estadística", "Results → Statistics"),
        ("08", "Predicción mediante FastAPI", "Prediction via FastAPI", "Envía variables desde Streamlit al modelo entrenado y recibe el área estimada en hectáreas.", "Send inputs from Streamlit to the trained model and receive estimated hectares.", "research","train","predict","Resultados → Predecir", "Results → Predict"),
        ("09", "Gemelo 3D y LangGraph", "3D twin & LangGraph", "Estados de hogares en el tiempo y trazabilidad de la orquestación en «Cómo se calculó».", "Household states over time and workflow trace under ‘How it was calculated’.", "twin",None,None,"Gemelo 3D", "Digital twin 3D"),
        ("10", "Fuentes públicas", "Public sources", "Consulta sismos USGS, lluvia NASA POWER y edificios OpenStreetMap con su procedencia.", "Query USGS earthquakes, NASA POWER rainfall and OpenStreetMap buildings with provenance.", "data",None,None,"Datos públicos", "Public data"),
    ]
    st.header(tr("Recorrido de evidencias", "Evidence walkthrough"))
    for number,es,en,desc_es,desc_en,page,step,view,path_es,path_en in requirements:
        with st.container(border=True):
            text,action=st.columns([3,1],vertical_alignment="center")
            with text:
                st.subheader(f"{number} · {tr(es,en)}")
                st.write(tr(desc_es,desc_en))
                st.caption(tr(path_es,path_en))
            action.button(tr("Ver evidencia →", "View evidence →"),key="guide_"+number,
                          on_click=open_evidence,args=(page,step,view),width="stretch")
    st.subheader(tr("Cómo se conectan las piezas", "How the pieces connect"))
    st.code("Streamlit → HTTP / FastAPI → Python (scikit-learn · simulación · LangGraph) → resultados",language=None)
    st.link_button(tr("Abrir documentación de FastAPI", "Open FastAPI documentation"),API_URL+"/docs")
    st.warning(tr("Alcance científico: el entrenamiento usa incendios reales de Portugal. El gemelo usa hogares sintéticos y una maqueta no georreferenciada. Las fuentes públicas no calibran automáticamente la resiliencia urbana.",
                  "Scientific scope: training uses observed Portuguese fires. The twin uses synthetic households and a non-georeferenced model. Public sources do not automatically calibrate urban resilience."))
