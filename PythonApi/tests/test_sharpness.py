import io
from PIL import Image
from unittest.mock import patch
import pytest
from app.sharpness import compute_sharpness

def test_sharpness_bounds():
    img = Image.new("RGB", (10, 10))
    result = compute_sharpness(img)
    assert 0 <= result.score_0_100 <= 100
    assert result.rank in ["Instable", "Stable", "S-Rank"]

def test_sharpness_resize():
    tall_img = Image.new("RGB", (2000, 100))
    result = compute_sharpness(tall_img, max_width=800)
    assert result.score_0_100 is not None  # teste resize
