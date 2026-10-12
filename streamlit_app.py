"""Entrada de la plataforma bilingüe de resiliencia."""
from html import escape
import streamlit as st
from ui_design import tr,apply_design,heading
from streamlit_twin import render_twin
from streamlit_research import render_research
from streamlit_public import render_public
from streamlit_chat import render_chat, render_floating_chat

PAGES={"home":("Inicio","Home"),"twin":("Gemelo 3D","Digital twin 3D"),
       "research":("Investigación","Research"),"data":("Datos públicos","Public data"),"assistant":("Asistente","Assistant")}

def navigate(page):
    st.session_state.page=page

def render_home():
    heading(tr("OBSERVATORIO DE RESILIENCIA / SUR GLOBAL","RESILIENCE OBSERVATORY / GLOBAL SOUTH"),
            tr("Comprender el riesgo.\nPreparar la respuesta.","Understand risk.\nPrepare the response."),
            tr("Un espacio para explorar un barrio, experimentar con datos y entender qué dicen los resultados. Empieza por una pregunta, no por una fórmula.",
               "A place to explore a neighborhood, experiment with data and understand the results. Start with a question, not a formula."))
    st.divider()
    cards=[
        ("01",tr("Explora un barrio","Explore a neighborhood"),tr("Observa hogares en 3D y descubre cómo responden ante una amenaza.","See households in 3D and explore how they respond to a hazard."),"twin"),
        ("02",tr("Pon a prueba los datos","Test the data"),tr("Entrena modelos con registros reales y compara su desempeño paso a paso.","Train models on real records and compare their performance step by step."),"research"),
        ("03",tr("Pregunta y comprende","Ask and understand"),tr("Obtén explicaciones y compara escenarios con el asistente del proyecto.","Get explanations and compare scenarios with the project assistant."),"assistant")]
    for col,(number,title,detail,page) in zip(st.columns(3),cards):
        with col:
            st.html(f'<div class="step-card"><div class="step-number">{number}</div><h3>{escape(title)}</h3><p>{escape(detail)}</p></div>')
            st.button(tr("Abrir →","Open →"),key=f"open_{page}",on_click=navigate,args=(page,),width="stretch")
    st.divider()
    left,right=st.columns([1.4,1])
    with left:
        st.header(tr("¿Qué puedes aprender aquí?","What can you learn here?"))
        st.write(tr("Cómo influyen el aviso temprano y el apoyo entre vecinos. Qué modelo aprende mejor de un conjunto de datos. Y qué conclusiones todavía necesitan evidencia.",
                    "How early warning and neighbor support affect outcomes. Which model learns best from a dataset. And which conclusions still need evidence."))
    with right:
        st.html('<div class="note">'+escape(tr("Dos tipos de evidencia: el gemelo simula hogares sintéticos; el laboratorio entrena con incendios observados. Una visualización más detallada no convierte una simulación en datos reales.",
                                                               "Two types of evidence: the twin simulates synthetic households; the laboratory trains on observed fires. A detailed visualization does not turn a simulation into real data."))+'</div>')

def main():
    st.set_page_config(page_title="Resilience / Gemelo digital",page_icon="◈",layout="wide")
    with st.sidebar:
        st.selectbox("Idioma / Language",["es","en"],format_func=lambda value:{"es":"Español","en":"English"}[value],key="language")
        st.radio(tr("Apariencia","Appearance"),["light","dark"],format_func=lambda value:tr("Blanco","White") if value=="light" else tr("Negro","Black"),key="appearance",horizontal=True)
    apply_design()
    with st.sidebar:
        st.html('<div class="brand">resilience.</div><div class="brand-note">OBSERVATORY / LAB</div>')
        page=st.radio(tr("Explorar","Explore"),list(PAGES),format_func=lambda value:tr(*PAGES[value]),key="page")
        st.divider()
        st.caption(tr("Explora → compara → comprende","Explore → compare → understand"))
        st.caption(tr("Herramienta académica. Resultados sujetos a los límites del modelo.","Academic tool. Results depend on model limitations."))
    {"home":render_home,"twin":render_twin,"research":render_research,"data":render_public,"assistant":render_chat}[page]()
    render_floating_chat()

if __name__=="__main__":
    main()
