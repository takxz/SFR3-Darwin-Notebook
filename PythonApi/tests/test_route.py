import io
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
    from PIL import Image

    monkeypatch.setattr(route.module_detection, "is_this_an_organism", lambda _label: False)
    
    # Mock load_model_detection return so we don't load a 2GB AI model in unit tests
    monkeypatch.setattr(route, "load_model_detection", lambda: lambda img: [{"label": "rock", "score": 0.99}])

    # Vraie image PNG 1x1 transparente
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
    assert body["message"] == "L'image ne correspond pas à un organisme vivant"
