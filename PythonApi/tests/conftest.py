import base64
import io
import os
from types import SimpleNamespace

import pytest
from PIL import Image


@pytest.fixture(scope="session", autouse=True)
def _disable_model_loading():
    # Empêche le lazy-load du modèle Transformers pendant les tests.
    os.environ["DISABLE_MODEL_LOADING"] = "1"


@pytest.fixture()
def app_instance(monkeypatch):
    # Import après avoir posé DISABLE_MODEL_LOADING.
    import app as app_pkg

    # Repart d'une queue propre pour éviter les fuites d'état entre tests
    # (jobs résiduels, threads orphelins).
    from app.classification_queue import reset_queue_for_tests
    reset_queue_for_tests()

    # Modèle factice: renvoie toujours une prédiction.
    def fake_model(_image):
        return [{"label": "cheetah, something", "score": 0.99}]

    app_pkg.app.config["MODEL_DETECTION"] = fake_model
    app_pkg.app.config["TESTING"] = True

    # Dépendances externes/métier que l'on contrôle en tests.
    import app.route as route

    monkeypatch.setattr(route.module_detection, "is_this_an_organism", lambda _label: True)

    # Netteté factice
    monkeypatch.setattr(
        route,
        "compute_sharpness",
        lambda _img: SimpleNamespace(score_0_100=80.0, variance_of_laplacian=123.0, rank="good"),
    )

    # iNaturalist factice
    class _Resp:
        status_code = 200

        def json(self):
            return {
                "results": [
                    {
                        "id": 123,
                        "preferred_common_name": "Guépard",
                        "name": "Acinonyx jubatus",
                        "observations_count": 5000,
                        "default_photo": {"medium_url": "https://example.test/cheetah.jpg"},
                    }
                ]
            }

    monkeypatch.setattr(route.requests, "get", lambda *_a, **_k: _Resp())

    # IVs/stats: on évite de dépendre de la logique interne ici (unit tests de route).
    monkeypatch.setattr(route, "distribute_ivs", lambda *_a, **_k: SimpleNamespace(as_dict=lambda: {"hp": 1}))
    monkeypatch.setattr(route, "get_base_stats", lambda *_a, **_k: {"hp": 10})
    monkeypatch.setattr(route, "final_stats_from_formula", lambda *_a, **_k: {"hp": 11})
    return app_pkg.app


@pytest.fixture()
def client(app_instance):
    return app_instance.test_client()


@pytest.fixture()
def sample_image_b64():
    img = Image.new("RGB", (8, 8), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"
