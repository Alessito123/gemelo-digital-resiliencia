"""Fuentes públicas con interfaz bilingüe."""
import json
import pandas as pd
import requests
import streamlit as st
from python_engine.presets import SETTLEMENTS
from python_ui_client import api_request
from ui_design import tr,heading

def render_public():
    heading(tr("OBSERVATORIO / FUENTES PÚBLICAS","OBSERVATORY / PUBLIC SOURCES"),tr("Datos con procedencia.","Data with provenance."),
            tr("Consulta sismos, lluvia y edificios cartografiados. Cada fuente responde una pregunta distinta.","Explore earthquakes, rainfall and mapped buildings. Each source answers a different question."))
    settlement=st.selectbox(tr("Ciudad","City"),list(SETTLEMENTS),format_func=lambda x:SETTLEMENTS[x].city,key="public_city")
    names={"usgs":tr("USGS · sismos","USGS · earthquakes"),"nasa":tr("NASA POWER · lluvia","NASA POWER · rainfall"),"osm":tr("OpenStreetMap · edificios","OpenStreetMap · buildings")}
    source=st.selectbox(tr("Fuente","Source"),list(names),format_func=lambda x:names[x],key="public_source")
    if st.button(tr("Consultar datos","Fetch data"),type="primary"):
        try:
            with st.spinner(tr("Consultando la fuente…","Querying the source…")):
                st.session_state.public_snapshot=api_request("GET",f"/api/public-data/{source}?settlement={settlement}")
                st.session_state.public_source_id=source
        except (ValueError,requests.RequestException):
            st.error(tr("La fuente no está disponible. Reintenta más tarde; no se sustituyen datos reales por sintéticos.","Source unavailable. Try again later; real data are not replaced with synthetic values."))
    snapshot=st.session_state.get("public_snapshot")
    if snapshot:
        st.caption(f"{snapshot['settlement']} · {snapshot['retrieved_at']}")
        limitations={"usgs":tr("Hasta 50 eventos en 150 km y diez años; no permite predecir sismos.","Up to 50 events within 150 km over ten years; this cannot predict earthquakes."),
                     "nasa":tr("Treinta días de un producto de grilla; no es un pluviómetro local.","Thirty days of a gridded product; not a local rain gauge."),
                     "osm":tr("Conteo cartográfico en una ventana aproximada; no identifica informalidad.","Mapped count in an approximate window; it does not identify informality.")}
        st.info(limitations.get(st.session_state.get("public_source_id"),""))
        frame=pd.DataFrame(snapshot["records"])
        st.dataframe(frame,width="stretch",hide_index=True)
        if "lat" in frame and "lon" in frame: st.map(frame[["lat","lon"]])
        if "precipitation_mm_day" in frame: st.line_chart(frame.set_index("date")["precipitation_mm_day"])
        st.caption(snapshot["license"])
        st.link_button(tr("Fuente original","Original source"),snapshot["source"])
        st.download_button(tr("Descargar datos JSON","Download JSON data"),json.dumps(snapshot,ensure_ascii=False,indent=2),"public-data.json","application/json")
