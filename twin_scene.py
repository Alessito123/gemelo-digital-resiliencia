"""Geometría esquemática: cada edificio sigue un hogar real del motor."""
import hashlib
import numpy as np
import plotly.graph_objects as go
from python_engine.presets import get_settlement

COLORS = {"safe":"#dadad2", "exposed":"#77776f", "trapped":"#292929", "injured":"#080808"}
LABELS = {"es":{"safe":"A salvo","exposed":"Expuesto","trapped":"Atrapado","injured":"Lesionado"},
          "en":{"safe":"Safe","exposed":"Exposed","trapped":"Trapped","injured":"Injured"}}

def geometry(settlement_id, count):
    rng = np.random.default_rng(int.from_bytes(hashlib.sha256(settlement_id.encode()).digest()[:4],"big"))
    return [(10+(i%8)*11+rng.uniform(-1.5,1.5),10+(i//8)*12+rng.uniform(-1.5,1.5),float(rng.uniform(4,9)))
            for i in range(count)]

def scene_figure(simulation, step, language="es", dark=False):
    point = simulation.history[step]
    slope = np.tan(np.deg2rad(get_settlement(simulation.settlement_id).slope_deg)) * .45
    locations = geometry(simulation.settlement_id, simulation.metrics.total_households)
    xx, yy = np.meshgrid(np.linspace(0,100,24),np.linspace(0,100,24))
    zz = yy*slope + np.sin(xx/20)*1.8
    figure = go.Figure(go.Surface(x=xx,y=yy,z=zz,colorscale=[[0,"#d6d6cf"],[1,"#a3a39a"]],
                                 showscale=False,opacity=.85,hoverinfo="skip"))
    faces_i=[0,0,0,0,1,1,2,2,3,3,4,4]
    faces_j=[1,2,1,5,2,6,3,7,0,4,5,6]
    faces_k=[2,3,5,4,6,5,7,6,4,7,6,7]
    for index,(x,y,height) in enumerate(locations):
        z=y*slope+np.sin(x/20)*1.8
        state=point.household_states[index] if point.household_states else "exposed"
        label=LABELS[language][state]
        figure.add_trace(go.Mesh3d(x=[x,x+6,x+6,x,x,x+6,x+6,x],
                                  y=[y,y,y+6,y+6,y,y,y+6,y+6],
                                  z=[z,z,z,z,z+height,z+height,z+height,z+height],
                                  i=faces_i,j=faces_j,k=faces_k,color=COLORS[state],
                                  flatshading=True,opacity=1,
                                  name=f"H{index+1:03d}",
                                  hovertemplate=f"H{index+1:03d} · {label}<extra></extra>",
                                  showscale=False,lighting={"ambient":.65,"diffuse":.8}))
    for state,label in LABELS[language].items():
        figure.add_trace(go.Scatter3d(x=[None],y=[None],z=[None],mode="markers",
                                     marker={"color":COLORS[state],"size":7,"line":{"color":"#888","width":1}},
                                     name=label,showlegend=True))
    figure.update_layout(height=570,margin={"l":0,"r":0,"t":5,"b":0},
                         paper_bgcolor="#151515" if dark else "#efeee8",
                         font={"color":"#eeeeea" if dark else "#202020"},
                         scene={"xaxis":{"visible":False},"yaxis":{"visible":False},"zaxis":{"visible":False},
                                "aspectmode":"manual","aspectratio":{"x":1.3,"y":1.2,"z":.65},
                                "camera":{"eye":{"x":1.5,"y":-1.7,"z":1.1}}},
                         legend={"orientation":"h","y":0,"x":.02},
                         uirevision=simulation.settlement_id)
    return figure
