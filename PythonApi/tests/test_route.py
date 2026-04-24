import base64
import io
import json
from unittest.mock import patch, MagicMock

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

def test_classification_not_organism_returns_clear_message(client, app_instance, monkeypatch):
    import app.route as route
    monkeypatch.setattr(route.module_detection, "is_this_an_organism", lambda _label: False)
    monkeypatch.setattr(route, "load_model_detection", lambda: lambda img: [{"label": "rock", "score": 0.99}])

    valid_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\x0d\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    resp = client.post(
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
    assert body["success"] is False
    assert body["is_organism"] is False

def test_classification_success(client, app_instance, sample_image_b64):
    # Test avec imageData (base64) et succès (organism)
    resp = client.post(
        "/classification",
        json={"imageData": sample_image_b64, "filename": "test.png"}
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert body["animal_id"] == 123
    assert body["final_stats"] is not None

def test_classification_no_image(client):
    resp = client.post("/classification", json={})
    assert resp.status_code == 400
    assert b"Aucune image fournie" in resp.data

def test_classification_model_unavailable(client, app_instance, monkeypatch):
    import app.route as route
    monkeypatch.setattr(route, "load_model_detection", lambda: None)
    app_instance.config["MODEL_DETECTION"] = None
    
    valid_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\x0d\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    resp = client.post(
        "/classification",
        content_type="multipart/form-data",
        data={"image": (io.BytesIO(valid_png_bytes), "test.png")},
    )
    assert resp.status_code == 503

def test_request_inaturalist_success(client, monkeypatch):
    import app.route as route
    class MockResp:
        status_code = 200
        def json(self): return {"results": [{"id": 41964, "preferred_common_name": "Guepard", "name": "Acinonyx", "observations_count": 100, "default_photo": {"medium_url": "url"}}]}
    
    monkeypatch.setattr(route.requests, "get", lambda *a, **k: MockResp())
    resp = client.get("/test") # /test calls requestInaturalist("cheetah")
    assert resp.status_code == 200
    assert resp.get_json()["success"] is True

def test_request_inaturalist_not_found(client, monkeypatch):
    import app.route as route
    class MockResp:
        status_code = 200
        def json(self): return {"results": []}
    
    monkeypatch.setattr(route.requests, "get", lambda *a, **k: MockResp())
    resp = client.get("/test")
    assert resp.status_code == 404

def test_request_inaturalist_error(client, monkeypatch):
    import app.route as route
    class MockResp:
        status_code = 500
    
    monkeypatch.setattr(route.requests, "get", lambda *a, **k: MockResp())
    resp = client.get("/test")
    assert resp.status_code == 500

