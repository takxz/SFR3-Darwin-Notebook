from __future__ import annotations

import math


def rarity_score_from_observation_count(
    observation_count: int | float | None,
    *,
    count_ref: int = 1_000_000,
) -> float:
    if observation_count is None:
        return 0.0
    try:
        c = float(observation_count)
    except (TypeError, ValueError):
        return 0.0

    c = max(0.0, c)
    denom = math.log1p(float(max(1, count_ref)))
    x = math.log1p(c) / denom  # 0..~1 (voire >1 si c > count_ref)
    score = 100.0 * (1.0 - x)
    return float(max(0.0, min(100.0, score)))


def sharpness_bonus(
    sharpness_score_0_100: float,
    *,
    bonus_max: float = 35.0,
    gamma: float = 1.2,
) -> float:
    """
    Bonus plafonné par la netteté (0..bonus_max).
    - Non-linéaire (gamma>1): récompense fortement les photos très nettes
      tout en donnant un petit bonus même aux photos moyennes.
    """
    try:
        s = float(sharpness_score_0_100)
    except (TypeError, ValueError):
        return 0.0

    s = max(0.0, min(100.0, s))
    if gamma <= 0:
        gamma = 1.0
    t = (s / 100.0) ** gamma  # 0..1
    return float(max(0.0, min(bonus_max, bonus_max * t)))


def global_score(
    *,
    rarity_score_0_100: float,
    sharpness_score_0_100: float,
    bonus_max: float = 25.0,
) -> float:
    base = float(max(0.0, min(100.0, rarity_score_0_100)))
    bonus = sharpness_bonus(sharpness_score_0_100, bonus_max=bonus_max)
    return float(max(0.0, min(100.0, base + bonus)))
