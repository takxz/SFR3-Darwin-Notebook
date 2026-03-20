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
