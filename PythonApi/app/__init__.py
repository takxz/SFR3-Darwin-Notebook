from __future__ import annotations

import os
from typing import Any, Callable

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

load_dotenv()


def _should_load_model() -> bool:
    """
    Empêche le chargement du modèle IA pendant les tests/unit tests.
    - Mettre DISABLE_MODEL_LOADING=1 pour désactiver.
    - Mettre FLASK_ENV=testing (ou APP_ENV=test) pour désactiver.
    """
    if os.getenv("DISABLE_MODEL_LOADING", "").strip() in {"1", "true", "True", "yes", "YES"}:
        return False
    if os.getenv("APP_ENV", "").strip().lower() in {"test", "testing"}:
        return False
    if os.getenv("FLASK_ENV", "").strip().lower() in {"test", "testing"}:
        return False
    return True


def create_app(*, testing: bool = False) -> Flask:
    app = Flask(__name__)
    CORS(app)
    app.config["TESTING"] = bool(testing)
    app.config["MODEL_DETECTION"] = None  # sera injecté (ou lazy-loadé)
    return app


app = create_app(testing=not _should_load_model())


def load_model_detection() -> Callable[[Any], Any] | None:
    """
    Lazy-load du modèle (évite d'import torch/transformers en test).
    """
    if app.config.get("MODEL_DETECTION") is not None:
        return app.config["MODEL_DETECTION"]
    if app.config.get("TESTING") or not _should_load_model():
        return None
    from transformers import pipeline  # import tardif (lourd)

    model = pipeline("image-classification", model="google/vit-base-patch16-224")
    app.config["MODEL_DETECTION"] = model
    return model