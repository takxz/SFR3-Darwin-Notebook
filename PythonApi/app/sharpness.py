from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np
from PIL import Image


@dataclass(frozen=True)
class SharpnessResult:
    score_0_100: float
    variance_of_laplacian: float
    rank: Literal["Instable", "Stable", "S-Rank"]


def _to_grayscale_array(image: Image.Image) -> np.ndarray:
    gray = image.convert("L")
    arr = np.asarray(gray, dtype=np.float32)
    return arr


def _laplacian(arr: np.ndarray) -> np.ndarray:
    if arr.ndim != 2:
        raise ValueError("Expected a 2D grayscale array.")

    p = np.pad(arr, ((1, 1), (1, 1)), mode="edge")
    center = p[1:-1, 1:-1]
    up = p[:-2, 1:-1]
    down = p[2:, 1:-1]
    left = p[1:-1, :-2]
    right = p[1:-1, 2:]
    return (up + down + left + right) - 4.0 * center


def compute_sharpness(
    image: Image.Image,
    *,
    clamp_0_100: bool = True,
    max_width: int = 800,
    variance_min: float = 50.0,
    variance_max: float = 3000.0,
    stable_threshold: float = 30.0,
    s_rank_threshold: float = 90.0,
) -> SharpnessResult:
    if max_width and image.width and image.width > max_width:
        scale = max_width / float(image.width)
        new_w = max_width
        new_h = max(1, int(round(image.height * scale)))
        image = image.resize((new_w, new_h), resample=Image.Resampling.BILINEAR)

    arr = _to_grayscale_array(image)
    lap = _laplacian(arr)
    var_lap = float(np.var(lap))

    if variance_max <= variance_min:
        raise ValueError("variance_max must be > variance_min.")

    score_f = float((var_lap - variance_min) / (variance_max - variance_min) * 100.0)

    if clamp_0_100:
        score_f = float(np.clip(score_f, 0.0, 100.0))

    if score_f > s_rank_threshold:
        rank: Literal["Instable", "Stable", "S-Rank"] = "S-Rank"
    elif score_f > stable_threshold:
        rank = "Stable"
    else:
        rank = "Instable"

    return SharpnessResult(score_0_100=score_f, variance_of_laplacian=var_lap, rank=rank)
