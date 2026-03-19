import os
from pathlib import Path

import pytest


@pytest.mark.skipif(
    not os.getenv("TEST_IMAGE_PATH"),
    reason="Set TEST_IMAGE_PATH to run this test with a real image file.",
)
def test_classification_with_real_image_file(client):
    r"""
    Exécute /classification avec une image de ton disque (upload multipart/form-data).
    Pour lancer:
      - PowerShell:  $env:TEST_IMAGE_PATH=r"C:\\path\\to\\image.jpg"; python -m pytest -k real_image -vv
      - CMD:         set TEST_IMAGE_PATH=C:\\path\\to\\image.jpg && python -m pytest -k real_image -vv

    Note: par défaut, nos tests mockent le modèle IA + iNaturalist + sharpness
    (objectif: tests rapides et déterministes).
    """
    p = Path(os.environ["TEST_IMAGE_PATH"]).expanduser().resolve()
    assert p.exists(), f"Image introuvable: {p}"

    with p.open("rb") as f:
        data = {"image": (f, p.name)}
        r = client.post("/classification", data=data, content_type="multipart/form-data")

    assert r.status_code in (200, 400, 502, 503)
    payload = r.get_json()
    assert payload is not None
