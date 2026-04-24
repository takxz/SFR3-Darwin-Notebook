import io
import time
from unittest.mock import patch


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
    valid_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\x0d\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

    submit = client.post(
        "/classification",
        content_type="multipart/form-data",
        data={"image": (io.BytesIO(valid_png_bytes), "ok.png")},
    )
    assert submit.status_code == 202
    job_id = submit.get_json()["job_id"]

    status_resp, body = _wait_for_done(client, job_id)
    assert status_resp.status_code == 200
    assert body["status"] == "done"
    assert body["result"]["success"] is True
    assert body["result"]["is_organism"] is True
