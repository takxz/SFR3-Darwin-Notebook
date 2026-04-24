import base64
import io
import time
from types import SimpleNamespace
from unittest.mock import patch

import pytest
import requests as requests_lib


VALID_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\x0d\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


def _wait_for_done(client, job_id, timeout=5.0):
    """Poll /classification/status/<job_id> jusqu'à done/error ou timeout."""
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        last = client.get(f"/classification/status/{job_id}")
        body = last.get_json() or {}
        if body.get("status") in {"done", "error"}:
            return last, body
        time.sleep(0.05)
    return last, (last.get_json() or {})


def test_hello_world(client):
    resp = client.get("/")
    assert resp.status_code == 200


def test_ping(client):
    resp = client.get("/ping")
    assert resp.status_code == 200


def test_classification_ioerror(client):
    with patch("app.route.Image.open", side_effect=IOError()):
        resp = client.post(
            "/classification",
            content_type="multipart/form-data",
            data={"image": (io.BytesIO(b""), "bad.png")},
        )
    assert resp.status_code == 500


def test_classification_submit_returns_job_id(client, app_instance):
    valid_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\x0d\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

    resp = client.post(
        "/classification",
        content_type="multipart/form-data",
        data={"image": (io.BytesIO(valid_png_bytes), "img.png")},
    )

    assert resp.status_code == 202
    body = resp.get_json()
    assert body["success"] is True
    assert isinstance(body["job_id"], str) and body["job_id"]
    # Le job peut déjà avoir démarré ou terminé entre submit() et le snapshot
    # quand le modèle est mocké et instantané — on accepte tous les états.
    assert body["status"] in {"queued", "processing", "done"}
    assert body["queue"]["max_workers"] == 8


def test_classification_status_unknown_job(client):
    resp = client.get("/classification/status/does-not-exist")
    assert resp.status_code == 404
    body = resp.get_json()
    assert body["success"] is False


def test_classification_not_organism_returns_clear_message(client, app_instance, monkeypatch):
    import app.route as route

    monkeypatch.setattr(route.module_detection, "is_this_an_organism", lambda _label: False)
    monkeypatch.setattr(route, "load_model_detection", lambda: lambda img: [{"label": "rock", "score": 0.99}])

    valid_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\x0d\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

    submit = client.post(
        "/classification",
        content_type="multipart/form-data",
        data={"image": (io.BytesIO(valid_png_bytes), "not-organism.png")},
    )
    assert submit.status_code == 202
    job_id = submit.get_json()["job_id"]

    status_resp, body = _wait_for_done(client, job_id)
    assert status_resp.status_code == 200
    assert body["status"] == "done"
    result = body["result"]
    assert result["success"] is False
    assert result["is_organism"] is False
    assert result["message"] == "L'image ne correspond pas à un organisme vivant"


def test_classification_organism_full_flow(client, app_instance):
    """Vérifie qu'un job de bout en bout passe queued/processing → done."""
    submit = client.post(
        "/classification",
        content_type="multipart/form-data",
        data={"image": (io.BytesIO(VALID_PNG), "ok.png")},
    )
    assert submit.status_code == 202
    job_id = submit.get_json()["job_id"]

    status_resp, body = _wait_for_done(client, job_id)
    assert status_resp.status_code == 200
    assert body["status"] == "done"
    assert body["result"]["success"] is True
    assert body["result"]["is_organism"] is True


# --------------------------------------------------------------------------
# Couvertures supplémentaires
# --------------------------------------------------------------------------


def test_classification_no_image_returns_400(client, app_instance):
    """POST sans image (ni multipart, ni JSON imageData) → 400."""
    resp = client.post("/classification", json={})
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Aucune image fournie"


def test_classification_accepts_base64_json_payload(client, app_instance):
    """Couvre la branche request.is_json + imageData base64 + filename."""
    b64 = base64.b64encode(VALID_PNG).decode("ascii")
    resp = client.post(
        "/classification",
        json={
            "imageData": f"data:image/png;base64,{b64}",
            "filename": "depuis-base64.png",
            "level": 12,
        },
    )
    assert resp.status_code == 202
    job_id = resp.get_json()["job_id"]

    _, body = _wait_for_done(client, job_id)
    assert body["status"] == "done"
    assert body["result"]["filename"] == "depuis-base64.png"


def test_status_propagates_http_status_from_worker(client, app_instance, monkeypatch):
    """Si le worker remonte un http_status (modèle indispo), /status le propage."""
    import app.route as route

    monkeypatch.setattr(route, "load_model_detection", lambda: None)
    # Force la branche "modèle indisponible".
    app_instance.config["MODEL_DETECTION"] = None

    submit = client.post(
        "/classification",
        content_type="multipart/form-data",
        data={"image": (io.BytesIO(VALID_PNG), "x.png")},
    )
    assert submit.status_code == 202
    job_id = submit.get_json()["job_id"]

    status_resp, body = _wait_for_done(client, job_id)
    assert status_resp.status_code == 503
    assert body["status"] == "done"
    assert body["result"]["success"] is False
    # http_status est consommé (pop) avant d'être renvoyé au client.
    assert "http_status" not in body["result"]


def test_status_returns_500_when_worker_raises(client, app_instance, monkeypatch):
    """Si le worker lève, le job passe en 'error' et /status renvoie 500."""
    import app.route as route

    def boom(*_a, **_k):
        raise RuntimeError("model crashed")

    monkeypatch.setattr(route, "load_model_detection", lambda: boom)

    submit = client.post(
        "/classification",
        content_type="multipart/form-data",
        data={"image": (io.BytesIO(VALID_PNG), "x.png")},
    )
    job_id = submit.get_json()["job_id"]

    status_resp, body = _wait_for_done(client, job_id)
    assert status_resp.status_code == 500
    assert body["status"] == "error"
    assert "model crashed" in body["error"]


def test_status_returns_200_for_pending_job(client, app_instance, monkeypatch):
    """Quand un job est encore queued/processing, /status renvoie 200 sans result."""
    import app.route as route
    import threading

    gate = threading.Event()

    def slow_model(_image):
        gate.wait(timeout=2.0)
        return [{"label": "cheetah, x", "score": 0.9}]

    monkeypatch.setattr(route, "load_model_detection", lambda: slow_model)

    submit = client.post(
        "/classification",
        content_type="multipart/form-data",
        data={"image": (io.BytesIO(VALID_PNG), "x.png")},
    )
    job_id = submit.get_json()["job_id"]

    # Lit l'état avant la fin du worker.
    status = client.get(f"/classification/status/{job_id}")
    assert status.status_code == 200
    body = status.get_json()
    assert body["status"] in {"queued", "processing"}
    assert "result" not in body

    gate.set()
    _wait_for_done(client, job_id)


def test_run_classification_handles_inaturalist_request_exception(app_instance, monkeypatch):
    """Si l'appel iNaturalist lève une RequestException, on log et on continue."""
    from app.route import _run_classification
    import app.route as route

    # Conftest a déjà mocké le modèle et compute_sharpness.
    def raising_get(*_a, **_k):
        raise requests_lib.exceptions.ConnectionError("boom")

    monkeypatch.setattr(route.requests, "get", raising_get)

    from PIL import Image
    img = Image.open(io.BytesIO(VALID_PNG))
    img.load()

    with app_instance.app_context():
        result = _run_classification(img, "f.png", None)

    # Pas d'animal trouvé, mais le résultat reste exploitable.
    assert result["success"] is True
    assert result["animal_id"] is None
    assert result["scientific_name"] == "cheetah"  # tombe sur predicted_label
    assert result["observation_count"] == 0


def test_run_classification_handles_inaturalist_no_results(app_instance, monkeypatch):
    """Si iNaturalist répond 200 mais sans 'results', on traite comme inconnu."""
    from app.route import _run_classification
    import app.route as route

    class _Resp:
        status_code = 200

        def json(self):
            return {"results": []}

    monkeypatch.setattr(route.requests, "get", lambda *_a, **_k: _Resp())

    from PIL import Image
    img = Image.open(io.BytesIO(VALID_PNG))
    img.load()

    with app_instance.app_context():
        result = _run_classification(img, "f.png", None)

    assert result["success"] is True
    assert result["animal_id"] is None
    assert result["common_name"] is None


def test_run_classification_handles_inaturalist_non_200(app_instance, monkeypatch):
    """iNaturalist répond avec un status != 200 → animal=None mais flow OK."""
    from app.route import _run_classification
    import app.route as route

    class _Resp:
        status_code = 503
        def json(self):
            return {}

    monkeypatch.setattr(route.requests, "get", lambda *_a, **_k: _Resp())

    from PIL import Image
    img = Image.open(io.BytesIO(VALID_PNG))
    img.load()

    with app_instance.app_context():
        result = _run_classification(img, None, None)

    assert result["success"] is True
    assert result["animal_id"] is None
    assert result["filename"] is None


def test_index_route_calls_inaturalist(client, app_instance, monkeypatch):
    """GET /test exerce requestInaturalist via le wrapper index()."""
    import app.route as route

    class _Resp:
        status_code = 200
        def json(self):
            return {
                "results": [
                    {
                        "id": 1,
                        "preferred_common_name": "Guépard",
                        "name": "Acinonyx jubatus",
                        "observations_count": 1234,
                        "default_photo": {"medium_url": "https://x/y.jpg"},
                    }
                ]
            }

    monkeypatch.setattr(route.requests, "get", lambda *_a, **_k: _Resp())

    resp = client.get("/test")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert body["scientific_name"] == "Acinonyx jubatus"


def test_request_inaturalist_no_results_returns_404(app_instance, monkeypatch):
    from app.route import requestInaturalist
    import app.route as route

    class _Resp:
        status_code = 200
        def json(self):
            return {"results": []}

    monkeypatch.setattr(route.requests, "get", lambda *_a, **_k: _Resp())

    with app_instance.app_context():
        resp, status = requestInaturalist("zzz")
    assert status == 404
    assert resp.get_json()["success"] is False


def test_request_inaturalist_api_error_propagates_status(app_instance, monkeypatch):
    from app.route import requestInaturalist
    import app.route as route

    class _Resp:
        status_code = 500
        def json(self):
            return {}

    monkeypatch.setattr(route.requests, "get", lambda *_a, **_k: _Resp())

    with app_instance.app_context():
        resp, status = requestInaturalist("zzz")
    assert status == 500
    assert "Erreur API" in resp.get_json()["message"]


def test_request_inaturalist_with_sharpness_extra_computes_global_score(app_instance, monkeypatch):
    """Branche 'extra' avec sharpness_score → calcule global_score combiné."""
    from app.route import requestInaturalist
    import app.route as route

    class _Resp:
        status_code = 200
        def json(self):
            return {
                "results": [
                    {
                        "id": 7,
                        "preferred_common_name": "X",
                        "name": "Xus",
                        "observations_count": 100,
                        "default_photo": {"medium_url": "u"},
                    }
                ]
            }

    monkeypatch.setattr(route.requests, "get", lambda *_a, **_k: _Resp())

    with app_instance.app_context():
        resp = requestInaturalist("xx", extra={"sharpness_score": 80.0, "echo": 1})
    body = resp.get_json()
    assert body["echo"] == 1  # extra propagé
    assert body["global_score"] != body["rarity_score"]


def test_ping_returns_pong(client):
    resp = client.get("/ping")
    assert resp.data == b"pong"
