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

CAMERAS = {"perspective":{"x":1.45,"y":-1.65,"z":1.25},
           "top":{"x":0,"y":-.02,"z":2.6}, "street":{"x":1.8,"y":-2,"z":.55}}


def scene_figure(simulation, step, language="es", dark=False, camera="perspective", context=True, selected=None):
    point = simulation.history[step]
    slope = np.tan(np.deg2rad(get_settlement(simulation.settlement_id).slope_deg)) * .45
    locations = geometry(simulation.settlement_id, simulation.metrics.total_households)
    xx, yy = np.meshgrid(np.linspace(0,100,50),np.linspace(0,100,50))
    zz = yy*slope + np.sin(xx/20)*1.8
    figure = go.Figure(go.Surface(x=xx,y=yy,z=zz,
        colorscale=[[0,"#474943" if dark else "#c5c3b6"],[1,"#77796d" if dark else "#e2dfd1"]],
        contours={"z":{"show":True,"usecolormap":False,"color":"#88887b","width":1}},
        showscale=False,hoverinfo="skip",lighting={"ambient":.8,"diffuse":.6}))
    def ground(x,y):
        return np.asarray(y)*slope + np.sin(np.asarray(x)/20)*1.8
    # Cantos de la maqueta, hasta una base horizontal.
    for x,y in [(np.linspace(0,100,50),np.zeros(50)),(np.linspace(0,100,50),np.full(50,100)),
                (np.zeros(50),np.linspace(0,100,50)),(np.full(50,100),np.linspace(0,100,50))]:
        figure.add_trace(go.Surface(x=np.array([x,x]),y=np.array([y,y]),z=np.array([ground(x,y),np.full(50,-4)]),
            colorscale=[[0,"#33342f" if dark else "#b4b2a4"],[1,"#33342f" if dark else "#b4b2a4"]],
            showscale=False,hoverinfo="skip"))
    if context:
        # Calles visuales: no son rutas de evacuación calculadas.
        for y in [6+row*12 for row in range(8)]:
            x=np.linspace(3,98,70)
            figure.add_trace(go.Scatter3d(x=x,y=np.full(70,y),z=ground(x,y)+.15,mode="lines",
                line={"color":"#99998e" if dark else "#f4f1e7","width":9},showlegend=False,hoverinfo="skip"))
        for x in (5,49,94):
            y=np.linspace(3,97,70)
            figure.add_trace(go.Scatter3d(x=np.full(70,x),y=y,z=ground(x,y)+.2,mode="lines",
                line={"color":"#99998e" if dark else "#f4f1e7","width":9},showlegend=False,hoverinfo="skip"))
    faces_i=[0,0,0,0,1,1,2,2,3,3,4,7,4,4,8,8]
    faces_j=[1,2,1,5,2,6,3,7,0,4,5,9,8,9,5,6]
    faces_k=[2,3,5,4,6,5,7,6,4,7,8,6,9,7,6,9]
    outlines=[[],[],[]]
    windows=[[],[],[]]
    for index,(x,y,height) in enumerate(locations):
        z=y*slope+np.sin(x/20)*1.8
        state=point.household_states[index] if point.household_states else "exposed"
        label=LABELS[language][state]
        figure.add_trace(go.Mesh3d(x=[x,x+6,x+6,x,x,x+6,x+6,x,x+3,x+3],
                                  y=[y,y,y+6,y+6,y,y,y+6,y+6,y,y+6],
                                  z=[z,z,z,z,z+height,z+height,z+height,z+height,z+height+1.2,z+height+1.2],
                                  i=faces_i,j=faces_j,k=faces_k,color=COLORS[state],
                                  flatshading=True,opacity=1,
                                  name=f"H{index+1:03d}",
                                  hovertemplate=f"H{index+1:03d} · {label}<extra></extra>",
                                  showscale=False,lighting={"ambient":.45,"diffuse":.9,"specular":.15,"roughness":.85},
                                  lightposition={"x":-100,"y":-150,"z":300}))
        for a,b,c in [(x,y,z+height+.05),(x+3,y,z+height+1.2),(x+6,y,z+height+.05),
                      (x+6,y+6,z+height+.05),(x+3,y+6,z+height+1.2),(x,y+6,z+height+.05),
                      (x,y,z+height+.05),(None,None,None)]:
            for values,value in zip(outlines,(a,b,c)): values.append(value)
        for offset in (1.5,4.5):
            for values,value in zip(windows,(x+offset,y-.08,z+height*.55)): values.append(value)
    figure.add_trace(go.Scatter3d(x=outlines[0],y=outlines[1],z=outlines[2],mode="lines",
        line={"color":"#d4d0c3" if dark else "#4c4a42","width":2},showlegend=False,hoverinfo="skip"))
    figure.add_trace(go.Scatter3d(x=windows[0],y=windows[1],z=windows[2],mode="markers",
        marker={"color":"#eee7d6","size":2,"symbol":"square"},showlegend=False,hoverinfo="skip"))
    if selected is not None and 0 <= selected < len(locations):
        x,y,h=locations[selected]
        state=point.household_states[selected] if point.household_states else "exposed"
        figure.add_trace(go.Scatter3d(x=[x+3,x+3],y=[y+3,y+3],z=[ground(x,y)+h+2,ground(x,y)+h+9],
            mode="lines+text",text=["",f"H{selected+1:03d} · {LABELS[language][state]}"],
            textposition="top center",line={"color":"#fff" if dark else "#111","width":4},
            textfont={"size":13},showlegend=False,hoverinfo="skip"))
    for state,label in LABELS[language].items():
        figure.add_trace(go.Scatter3d(x=[None],y=[None],z=[None],mode="markers",
                                     marker={"color":COLORS[state],"size":7,"line":{"color":"#888","width":1}},
                                     name=label,showlegend=True))
    figure.update_layout(height=620,margin={"l":0,"r":0,"t":12,"b":28},
                         paper_bgcolor="#171916" if dark else "#efeee6",
                         font={"color":"#eeeeea" if dark else "#202020"},
                         scene={"xaxis":{"visible":False},"yaxis":{"visible":False},"zaxis":{"visible":False},
                                "aspectmode":"manual","aspectratio":{"x":1.3,"y":1.2,"z":.65},
                                "bgcolor":"#171916" if dark else "#efeee6",
                                "camera":{"eye":CAMERAS[camera],"projection":{"type":"orthographic"}}},
                         legend={"orientation":"h","y":-.03,"x":.02},
                         uirevision=f"{simulation.settlement_id}-{camera}")
    return figure
