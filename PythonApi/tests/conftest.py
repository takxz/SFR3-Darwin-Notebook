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


# Constant for valid PNG bytes used in tests
VALID_PNG = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\x0d\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"


def _wait_for_done(client, job_id):
    """Helper to wait for a classification job to complete."""
    import time
    for _ in range(50):  # timeout after ~5s
        status_resp = client.get(f"/classification/status/{job_id}")
        if status_resp.status_code != 200:
            return status_resp, None
        body = status_resp.get_json()
        if body["status"] in {"done", "error"}:
            return status_resp, body
        time.sleep(0.1)
    raise AssertionError(f"Job {job_id} did not complete in time")
