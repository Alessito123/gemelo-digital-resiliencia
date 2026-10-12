"""Gemelo 3D con estados individuales y controles bilingües."""
import json
import pandas as pd
import plotly.graph_objects as go
import requests
import streamlit as st
from python_engine.models import WorkflowResult
from python_engine.presets import SETTLEMENTS,SCENARIOS
from python_ui_client import api_request
from twin_scene import scene_figure,LABELS
from ui_design import tr,dark,heading,chart_theme

SCENARIO_EN={"base":"Normal conditions","flood":"Urban flood","earthquake":"Earthquake","landslide":"Landslide","compound":"Compound disaster"}

def render_twin():
    heading(tr("GEMELO / VISTA ESPACIAL","DIGITAL TWIN / SPATIAL VIEW"),
            tr("Un barrio. Muchas decisiones.","One neighborhood. Many decisions."),
            tr("Configura una amenaza y explora cómo cambia el estado de los hogares con el tiempo.",
               "Choose a hazard and explore how household states change over time."))
    with st.expander(tr("1 · Configurar el escenario","1 · Configure the scenario"),expanded="workflow_result" not in st.session_state):
        with st.form("twin_config"):
            left,right=st.columns(2)
            territory=left.selectbox(tr("Ciudad","City"),list(SETTLEMENTS),format_func=lambda x:SETTLEMENTS[x].city,key="twin_city")
            threat=right.selectbox(tr("Amenaza","Hazard"),list(SCENARIOS),index=3,
                                   format_func=lambda x:tr(SCENARIOS[x].name,SCENARIO_EN[x]),key="twin_hazard")
            intensity=left.slider(tr("Intensidad · 1 baja / 10 alta","Intensity · 1 low / 10 high"),1.,10.,8.,.5,key="twin_intensity")
            warning=right.slider(tr("Aviso antes del impacto (minutos)","Warning before impact (minutes)"),0,180,60,5,key="twin_warning")
            aid=left.checkbox(tr("Activar apoyo entre vecinos","Enable support between neighbors"),True,key="twin_aid")
            feedback=right.checkbox(tr("Coordinar comunidad e instituciones","Coordinate community and institutions"),True,key="twin_feedback")
            seed=int(left.number_input(tr("Semilla para repetir el experimento","Seed to repeat the experiment"),min_value=1,max_value=2147483647,value=202609,key="twin_seed"))
            steps=right.slider(tr("Pasos de simulación","Simulation steps"),5,60,20,key="twin_steps")
            observed=st.checkbox(tr("Comparar con una observación documentada","Compare with a documented observation"),key="twin_observed")
            source=st.text_input(tr("Fuente de la observación (si se compara)","Observation source (if comparing)"),max_chars=200,key="twin_evidence_source")
            observed_date=st.date_input(tr("Fecha del evento observado","Observed event date"),key="twin_evidence_date")
            license_name=st.text_input(tr("Licencia o autorización de uso","License or permission to use"),max_chars=100,key="twin_evidence_license")
            observed_evac=left.number_input(tr("Evacuación observada (%)","Observed evacuation (%)"),0.,100.,0.,key="twin_evidence_evac")
            observed_damage=right.number_input(tr("Daño observado (%)","Observed damage (%)"),0.,100.,0.,key="twin_evidence_damage")
            submitted=st.form_submit_button(tr("Simular este escenario","Simulate this scenario"),type="primary",width="stretch")
    if submitted or "workflow_result" not in st.session_state:
        payload={"config":{"settlement_id":territory,"scenario_id":threat,"seed":seed,"hazard_intensity":intensity,
                           "warning_lead_time_min":warning,"enable_mutual_aid":aid,"enable_multi_scale_feedback":feedback,"steps":steps}}
        if observed:
            if not source.strip() or not license_name.strip():
                st.error(tr("Documenta la fuente y licencia para comparar evidencia.","Document the source and license to compare evidence."))
                return
            payload["dataset"]={"title":"User observation","source":source.strip(),"license":license_name.strip(),
                                "observed_at":observed_date.isoformat(),"evidence_level":"observed",
                                "observations":[{"time_min":SCENARIOS[threat].duration_min,"evacuation_rate_pct":observed_evac,"structural_damage_pct":observed_damage}]}
        try:
            with st.spinner(tr("Calculando las decisiones de los hogares…","Calculating household decisions…")):
                st.session_state.workflow_result=WorkflowResult.model_validate(api_request("POST","/api/simulation/runs",payload))
        except (ValueError,requests.RequestException):
            st.error(tr("No se pudo ejecutar. Comprueba FastAPI en el puerto 8000.","Unable to run. Check FastAPI on port 8000."))
            return
    result=st.session_state.workflow_result
    sim=result.simulation
    st.caption(f"{sim.city} · {tr(SCENARIOS[sim.scenario_id].name,SCENARIO_EN[sim.scenario_id])} · {result.execution_id}")
    spatial,summary,trace,evidence=st.tabs([tr("2 · Explorar en 3D","2 · Explore in 3D"),tr("3 · Entender resultados","3 · Understand results"),
                                          tr("Cómo se calculó","How it was calculated"),tr("Exportar y protocolo","Export and protocol")])
    with spatial:
        step=st.slider(tr("Recorre el tiempo de la simulación","Move through simulation time"),0,len(sim.history)-1,0,key="scene_"+result.execution_id)
        point=sim.history[step]
        a,b,c=st.columns(3)
        a.metric(tr("Tiempo simulado","Simulated time"),f"{point.time_min:g} min")
        b.metric(tr("Hogares a salvo","Safe households"),f"{point.safe_households}/{sim.metrics.total_households}")
        c.metric(tr("Hogares atrapados","Trapped households"),point.trapped_households)
        st.plotly_chart(scene_figure(sim,step,st.session_state.get("language","es"),dark()),width="stretch",theme=None,key="twin_scene",
                        config={"displaylogo":False,"scrollZoom":True})
        st.caption(tr("Arrastra para girar · rueda para acercar · pasa el cursor sobre un hogar para ver su estado.",
                      "Drag to rotate · scroll to zoom · hover over a household to inspect its state."))
        st.info(tr("Terreno y edificios esquemáticos, no georreferenciados. Cada estado proviene del motor; esta vista no es una reconstrucción real del barrio.",
                   "Schematic terrain and buildings, not georeferenced. States come from the engine; this is not a real reconstruction of the neighborhood."))
        with st.expander(tr("Ver los mismos estados en una tabla","View the same states as a table")):
            st.dataframe(pd.DataFrame({tr("Hogar","Household"):[f"H{i+1:03d}" for i in range(len(point.household_states))],
                                      tr("Estado","State"):[LABELS[st.session_state.get("language","es")][x] for x in point.household_states]}),hide_index=True,width="stretch")
    with summary:
        m=sim.metrics
        st.header(tr("Qué ocurrió en este escenario","What happened in this scenario"))
        st.write(tr(f"De {m.total_households} hogares, {m.safe_households} llegaron a salvo. El modelo estima {m.structural_damage_pct:.1f}% de daño estructural.",
                    f"Out of {m.total_households} households, {m.safe_households} reached safety. The model estimates {m.structural_damage_pct:.1f}% structural damage."))
        a,b,c=st.columns(3)
        a.metric(tr("Evacuación","Evacuation"),f"{m.evacuation_rate_pct:.1f}%")
        b.metric(tr("Resiliencia sintética","Synthetic resilience"),f"{m.resilience_index:.1f}/100")
        c.metric(tr("Recuperación estimada","Estimated recovery"),f"{m.recovery_time_hours:.0f} h")
        figure=go.Figure()
        figure.add_trace(go.Scatter(x=[p.time_min for p in sim.history],y=[p.evacuation_rate_pct for p in sim.history],name=tr("Evacuación (%)","Evacuation (%)"),line={"color":"#888","width":3}))
        figure.add_trace(go.Scatter(x=[p.time_min for p in sim.history],y=[p.resilience_index for p in sim.history],name=tr("Resiliencia","Resilience"),line={"dash":"dot","width":3}))
        figure.update_xaxes(title=tr("Minutos","Minutes"))
        st.plotly_chart(chart_theme(figure),theme=None,width="stretch")
        st.caption(tr("Una puntuación más alta indica mejor respuesta dentro de este modelo, no una medición validada del barrio.",
                      "A higher score indicates a better response within this model, not a validated measurement of the neighborhood."))
        st.write(tr("Prueba aumentar el tiempo de alerta o activar el apoyo vecinal y compara una nueva ejecución.",
                    "Try increasing warning time or enabling neighborhood support, then compare a new run."))
        st.header(tr("Dónde se concentra la fragilidad","Where fragility concentrates"))
        names={"mobility":tr("Movilidad de los hogares","Household mobility"),"warning":tr("Acceso a la alerta","Warning access"),
               "morphology":tr("Cuellos de botella","Bottlenecks"),"institutional":tr("Capacidad institucional","Institutional capacity")}
        for point in sim.fragility_points:
            st.write(f"{names[point.category]} · {point.risk_score}/100 · {point.affected_households} "+tr("hogares expuestos","exposed households"))
    with trace:
        st.header(tr("Una cadena de decisiones visible","A visible chain of decisions"))
        descriptions={"resolve-context":tr("Seleccionar territorio y amenaza","Select area and hazard"),"simulate":tr("Simular hogares y respuesta comunitaria","Simulate households and community response"),
                      "mark-illustrative":tr("Identificar evidencia sintética","Identify synthetic evidence"),"validate-evidence":tr("Comparar observaciones","Compare observations"),
                      "analyze":tr("Analizar resultados","Analyze results"),"build-protocol":tr("Preparar protocolo ilustrativo","Prepare illustrative protocol"),
                      "finalize":tr("Consolidar resultados","Consolidate results")}
        for entry in result.trace:
            st.write(f"{entry.sequence:02d} · {descriptions.get(entry.node,entry.node)}")
        st.caption(tr("Orquestación real con LangGraph. Esta corrida no valida científicamente el modelo.","Real LangGraph orchestration. This run does not scientifically validate the model."))
        st.write(tr("Métricas comparadas con observaciones: ","Metrics compared against observations: ")+str(result.validation.compared_metrics))
        if result.validation.compared_metrics:
            st.metric(tr("Ajuste normalizado (comparación técnica)","Normalized fit (technical comparison)"),f"{result.validation.normalized_fit_score:.1f}/100")
            st.caption(result.validation.source_label)
    with evidence:
        st.download_button(tr("Descargar resultados completos","Download complete results"),result.model_dump_json(indent=2),f"{result.execution_id}.json","application/json")
        st.caption(tr("El archivo conserva los términos técnicos originales en español.","The file preserves original Spanish technical terminology."))
        st.header(tr("Lista de preparación comunitaria","Community preparation checklist"))
        for index,(es,en) in enumerate([("Confirmar canales oficiales de alerta","Confirm official warning channels"),("Planificar apoyo a personas con movilidad reducida","Plan assistance for people with reduced mobility"),("Verificar rutas y capacidad de refugios con las autoridades","Verify routes and shelter capacity with authorities")]):
            st.checkbox(tr(es,en),key=f"protocol_{result.execution_id}_{index}")
        with st.expander(tr("Protocolo original generado","Original generated protocol")):
            if result.protocol:
                st.json(result.protocol.model_dump(mode="json"))
        st.warning(tr("Uso académico. Los umbrales del protocolo son ilustrativos y requieren aprobación local.","Academic use. Protocol thresholds are illustrative and require local approval."))
