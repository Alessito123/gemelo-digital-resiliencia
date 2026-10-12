"""Identidad visual y textos de interfaz, aislados del motor."""
from html import escape
import streamlit as st

def tr(es, en):
    return en if st.session_state.get("language", "es") == "en" else es

def dark():
    return st.session_state.get("appearance", "light") == "dark"

def apply_design():
    bg, panel, ink, muted, line = ("#101010", "#191919", "#f7f7f2", "#b4b4ae", "#383838") if dark() else ("#f6f5f1", "#ffffff", "#161616", "#5e5e57", "#d8d8cf")
    st.html(f"""<style>
    :root {{ --paper:{bg}; --panel:{panel}; --ink:{ink}; --muted:{muted}; --line:{line};
      --background-color:{bg}; --secondary-background-color:{panel}; --text-color:{ink}; --primary-color:{ink}; }}
    [data-testid="stAppViewContainer"],[data-testid="stApp"] {{background:{bg};color:{ink};}}
    [data-testid="stHeader"] {{background:{bg};}}
    [data-testid="stSidebar"] {{background:{panel};border-right:1px solid {line};}}
    .stMainBlockContainer {{max-width:1480px;padding-top:2rem;}}
    h1,h2,h3 {{font-family:Georgia,'Times New Roman',serif!important;letter-spacing:-.045em;color:{ink}!important;}}
    h1 {{font-size:clamp(2.5rem,5vw,4.5rem)!important;font-weight:400!important;line-height:1.04!important;}}
    p,label,[data-testid="stMarkdownContainer"],[data-testid="stCaptionContainer"],
    [data-testid="stMetricValue"],[data-testid="stMetricLabel"],[data-testid="stWidgetLabel"] {{color:{ink};}}
    [data-testid="stCaptionContainer"] p {{color:{muted}!important;}}
    .eyebrow {{font:11px Consolas,monospace;letter-spacing:.2em;text-transform:uppercase;color:{muted};margin-bottom:18px;}}
    .brand {{font:700 30px Georgia;letter-spacing:-1px;color:{ink};margin:0 0 4px;}}
    .brand-note {{font:10px Consolas;letter-spacing:.18em;color:{muted};margin-bottom:28px;}}
    .intro {{font-size:18px;line-height:1.7;color:{muted};max-width:750px;}}
    .step-card {{border-top:2px solid {ink};padding:22px 4px;min-height:180px;}}
    .step-number {{font:11px Consolas;color:{muted};letter-spacing:.15em;}}
    .step-card h3 {{font-size:25px;margin:14px 0 10px;}}
    .step-card p {{color:{muted};line-height:1.6;font-size:14px;}}
    .note {{border-left:3px solid {ink};padding:12px 18px;background:{panel};color:{muted};font-size:14px;line-height:1.6;}}
    [data-testid="stMetric"] {{background:{panel};border:1px solid {line};padding:16px;border-radius:4px;}}
    [data-testid="stMetricValue"] {{font-family:Georgia!important;}}
    button[kind="primary"] {{background:{ink}!important;color:{bg}!important;border:1px solid {ink}!important;}}
    button[kind="primary"] p {{color:{bg}!important;}}
    button[kind="secondary"],[data-testid="stDownloadButton"] button {{background:{panel};color:{ink};border-color:{line};}}
    button[kind="secondary"] p {{color:{ink};}}
    [data-baseweb="select"] > div,[data-baseweb="input"],[data-baseweb="textarea"],input,textarea {{
      background:{panel}!important;color:{ink}!important;border-color:{line}!important;}}
    [role="listbox"],[role="option"] {{background:{panel}!important;color:{ink}!important;}}
    [data-testid="stTabs"] [role="tab"] {{color:{muted};}}
    [data-testid="stTabs"] [aria-selected="true"] {{color:{ink};border-bottom-color:{ink};}}
    [data-testid="stExpander"],[data-testid="stChatMessage"] {{background:{panel};border-color:{line};color:{ink};}}
    [data-testid="stAlert"] {{background:{panel};border:1px solid {line};color:{ink};}}
    [data-testid="stAlert"] p {{color:{ink}!important;}}
    [data-testid="stTable"] td,[data-testid="stTable"] th {{color:{ink};border-color:{line};}}
    [data-testid="stBottom"],[data-testid="stBottomBlockContainer"] {{background:{bg}!important;}}
    button:focus-visible,a:focus-visible {{outline:2px solid {ink}!important;outline-offset:4px;}}
    @media(max-width:700px) {{.stMainBlockContainer {{padding:1rem;}}h1{{font-size:2.6rem!important;}}.step-card{{min-height:0;}}}}
    @media(prefers-reduced-motion:reduce) {{*{{animation:none!important;transition:none!important;}}}}
    </style>""")

def heading(kicker, title, subtitle):
    st.html(f'<div class="eyebrow">{escape(kicker)}</div>')
    st.html('<h1>'+escape(title).replace("\n","<br>")+'</h1>')
    st.html(f'<p class="intro">{escape(subtitle)}</p>')

def chart_theme(figure):
    figure.update_layout(template="plotly_dark" if dark() else "plotly_white",
                         paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
                         font={"family":"Trebuchet MS", "color":"#eeeeea" if dark() else "#202020"},
                         colorway=["#777777","#b8b8b0","#3e3e3e","#a8a8a8"],
                         margin={"l":15,"r":15,"t":40,"b":25})
    return figure
