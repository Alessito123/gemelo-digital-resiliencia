"""Conversación local con contexto verificable."""
import streamlit as st
import requests
from python_ui_client import api_request
from ui_design import tr,heading

def render_chat(compact=False):
    prefix = "floating_" if compact else "page_"
    if compact:
        st.subheader(tr("Tu asistente de resiliencia", "Your resilience assistant"))
    else:
        heading(tr("ASISTENTE / CONTEXTO VERIFICABLE","ASSISTANT / VERIFIED CONTEXT"),
            tr("Entiende lo que estás viendo.","Understand what you are seeing."),
            tr("Pregunta por tu simulación, los modelos o los datos. También puedes comparar un escenario con más tiempo de alerta.",
               "Ask about your simulation, models or data. You can also compare a scenario with extra warning time."))
    st.caption(tr("Modo local con herramientas · sin LLM generativo · no envía conversaciones a terceros.",
                  "Local tool-based mode · no generative LLM · conversations are not sent to third parties."))
    current=st.session_state.get("workflow_result")
    if current:
        st.caption(tr("Escenario activo: ","Active scenario: ")+current.simulation.city+" · "+current.execution_id)
    else:
        st.info(tr("Abre Gemelo 3D y ejecuta un escenario para añadir contexto.","Open Digital twin 3D and run a scenario to add context."))
    language=st.session_state.get("language","es")
    history_key="chat_"+language
    history=st.session_state.setdefault(history_key,[])
    suggestions=[tr("Resume mis resultados","Summarize my results"),tr("¿Qué pasa con más alerta?","What if we have more warning?"),
                 tr("¿Cuál es el mejor modelo?","Which model is best?"),tr("Explica los 5 folds","Explain the 5 folds")]
    selected=None
    for column,label in zip(st.columns(2),suggestions[:2]):
        if column.button(label,key=prefix+label,width="stretch"):
            selected=label
    with st.expander(tr("Más preguntas sugeridas","More suggested questions")):
        for label in suggestions[2:]:
            if st.button(label,key=prefix+label):
                selected=label
    if st.button(tr("Limpiar conversación","Clear conversation"), key=prefix+"clear"):
        history.clear()
        st.rerun()
    for turn in history:
        with st.chat_message(turn["role"]):
            st.write(turn["content"])
            if turn.get("sources"):
                st.caption(tr("Referencias: ","References: ")+", ".join(turn["sources"]))
    if compact:
        with st.form("floating_chat_form", clear_on_submit=True):
            typed = st.text_input(tr("Escribe tu pregunta…","Type your question…"), max_chars=2000, key="floating_prompt")
            submitted = st.form_submit_button(tr("Enviar", "Send"), width="stretch")
        prompt = (typed.strip() if submitted else None) or selected
    else:
        prompt=st.chat_input(tr("Escribe tu pregunta…","Type your question…"),max_chars=2000, key="page_prompt") or selected
    if prompt:
        payload={"message":prompt,"language":language,
                 "config":current.simulation.config.model_dump(mode="json") if current else None,
                 "run_id":st.session_state.get("ml_run_id"),
                 "history":[{"role":t["role"],"content":t["content"]} for t in history[-10:]]}
        try:
            with st.spinner(tr("Consultando el contexto…","Checking context…")):
                answer=api_request("POST","/api/assistant/messages",payload)
            history.extend([{"role":"user","content":prompt},{"role":"assistant","content":answer["answer"],"sources":answer["sources"]}])
            del history[:-24]
            st.rerun()
        except (ValueError,requests.RequestException):
            st.error(tr("El asistente no está disponible. Comprueba que FastAPI esté activo.","The assistant is unavailable. Check that FastAPI is running."))


def render_floating_chat():
    """Acceso persistente con popover nativo y conversación compartida."""
    st.html("""<style>
    .st-key-floating_assistant {position:fixed!important;bottom:1.5rem;right:1.5rem;
      width:3.75rem!important;z-index:1000;}
    .st-key-floating_assistant [data-testid="stPopover"] button {
      width:3.75rem;height:3.75rem;border-radius:50%;background:var(--ink)!important;
      color:var(--paper)!important;border:1px solid var(--line);box-shadow:0 6px 24px #0003;}
    .st-key-floating_assistant [data-testid="stPopover"] button [data-testid="stMarkdownContainer"] {
      position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;}
    .st-key-floating_assistant [data-testid="stPopover"] button [aria-hidden="true"] {display:none;}
    .st-key-floating_assistant [data-testid="stPopover"] button [data-testid="stIconMaterial"] {font-size:1.5rem;}
    [data-testid="stPopoverBody"] {width:min(26rem,calc(100vw - 2rem));
      max-height:calc(100dvh - 7rem);overflow-y:auto;background:var(--panel);color:var(--ink);}
    [data-testid="stPopoverBody"] h3 {font-size:1.5rem!important;}
    .stMainBlockContainer {padding-bottom:6rem;}
    @media(max-width:480px) {.st-key-floating_assistant {bottom:1rem;right:1rem;}}
    </style>""")
    with st.container(key="floating_assistant"):
        with st.popover(tr("Chat", "Chat"), icon=":material/chat_bubble_outline:",
                        help=tr("Abrir o cerrar el asistente", "Open or close the assistant")):
            render_chat(compact=True)
