from types import SimpleNamespace


def test_ping(client):
    r = client.get("/ping")
    assert r.status_code == 200
    assert r.data.decode("utf-8") == "pong"


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "Hello World" in r.data.decode("utf-8")


def test_classification_success_json(client, sample_image_b64):
    r = client.post("/classification", json={"imageData": sample_image_b64, "filename": "x.png"})
    assert r.status_code == 200
    payload = r.get_json()
    assert payload["success"] is True
    assert payload["predicted_label"] == "cheetah"
    assert payload["sharpness_score"] == 80.0
    assert "rarity_score" in payload
    assert "global_score" in payload
    assert payload["final_stats"] == {"hp": 11}


def test_classification_reject_non_organism(client, sample_image_b64, monkeypatch):
    import app.route as route

    monkeypatch.setattr(route.module_detection, "is_this_an_organism", lambda _label: False)
    r = client.post("/classification", json={"imageData": sample_image_b64, "filename": "x.png"})
    assert r.status_code == 400
    payload = r.get_json()
    assert payload["success"] is False
    assert "sharpness_score" in payload
    assert payload["predicted_label"] == "cheetah"


def test_classification_inat_error(client, sample_image_b64, monkeypatch):
    import app.route as route

    class _Resp:
        status_code = 500

        def json(self):
            return {}

    monkeypatch.setattr(route.requests, "get", lambda *_a, **_k: _Resp())
    r = client.post("/classification", json={"imageData": sample_image_b64, "filename": "x.png"})
    assert r.status_code == 502


def test_classification_no_image(client):
    r = client.post("/classification", json={"foo": "bar"})
    assert r.status_code == 400


def test_classification_model_missing(client, sample_image_b64, monkeypatch):
    import app as app_pkg
    import app.route as route

    # Force model unavailable
    app_pkg.app.config["MODEL_DETECTION"] = None
    monkeypatch.setattr(route, "load_model_detection", lambda: None)

    r = client.post("/classification", json={"imageData": sample_image_b64, "filename": "x.png"})
    assert r.status_code == 503
