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

    monkeypatch.setattr(route.module_detection, "is_this_an_organism", lambda _label: False)

    resp = client.post(
        "/classification",
        content_type="multipart/form-data",
        data={"image": (io.BytesIO(b"fake image bytes"), "not-organism.png")},
    )

    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is False
    assert body["is_organism"] is False
    assert body["message"] == "L'image ne correspond pas à un organisme vivant"
