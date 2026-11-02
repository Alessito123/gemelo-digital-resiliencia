import unittest
from python_engine.models import SimulationConfig
from python_engine.simulation import run_simulation
from python_engine.chat_assistant import ChatRequest, answer_question
from twin_scene import geometry, scene_figure, LABELS

class ExperienceTests(unittest.TestCase):
    def setUp(self):
        self.config=SimulationConfig(settlement_id="lima-sjl",scenario_id="landslide",seed=42)

    def test_individual_states_match_aggregate_at_every_step(self):
        result=run_simulation(self.config)
        for point in result.history:
            self.assertEqual(len(point.household_states),result.metrics.total_households)
            self.assertEqual(point.household_states.count("safe"),point.safe_households)
            self.assertEqual(sum(s in ("trapped","injured") for s in point.household_states),point.trapped_households)

    def test_geometry_is_stable_and_contains_a_mesh_for_every_household(self):
        result=run_simulation(self.config)
        self.assertEqual(geometry(result.settlement_id,52),geometry(result.settlement_id,52))
        for language in ("es","en"):
            figure=scene_figure(result,10,language,False)
            meshes=[trace for trace in figure.data if trace.type=="mesh3d"]
            self.assertEqual(len(meshes),52)
            self.assertIn("H001",meshes[0].hovertemplate)

    def test_assistant_compares_real_engine_runs_and_returns_sources(self):
        result=answer_question(ChatRequest(message="What if we have more warning?",language="en",config=self.config))
        self.assertEqual(result.mode,"local-tools")
        self.assertEqual(len(result.sources),2)
        self.assertNotEqual(*result.sources)
        self.assertIn("90",result.answer)

    def test_inspection_and_camera_do_not_change_household_states(self):
        result=run_simulation(self.config)
        plain=scene_figure(result,10,camera="perspective",context=False)
        selected=scene_figure(result,10,camera="top",context=True,selected=3)
        expected=LABELS["es"][result.history[10].household_states[3]]
        self.assertTrue(any(f"H004 · {expected}" in list(getattr(trace,"text",None) or []) for trace in selected.data))
        self.assertEqual([t.hovertemplate for t in plain.data if t.type=="mesh3d"],
                         [t.hovertemplate for t in selected.data if t.type=="mesh3d"])
        for trace in selected.data:
            if trace.type=="mesh3d":
                self.assertLess(max(list(trace.i)+list(trace.j)+list(trace.k)),len(trace.x))
        self.assertNotEqual(plain.layout.uirevision,selected.layout.uirevision)

    def test_assistant_does_not_invent_a_model_without_report(self):
        answer=answer_question(ChatRequest(message="Which model is best?",language="en"))
        self.assertIn("no training run",answer.answer)
        self.assertEqual(answer.sources,[])

    def test_spanish_assistant_identifies_schematic_3d(self):
        answer=answer_question(ChatRequest(message="¿El terreno 3D es real?",language="es"))
        self.assertIn("esquemáticos",answer.answer)

if __name__=="__main__":
    unittest.main()
