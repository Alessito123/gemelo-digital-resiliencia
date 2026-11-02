import importlib
import unittest


class StreamlitApplicationTests(unittest.TestCase):
    def test_application_module_imports_without_external_services(self) -> None:
        module = importlib.import_module("streamlit_app")

        self.assertTrue(callable(module.main))
        self.assertFalse(hasattr(module, "API_KEY"))


if __name__ == "__main__":
    unittest.main()
