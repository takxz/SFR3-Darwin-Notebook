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
            data={"image": (io.BytesIO(b""), "bad.png")}
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

