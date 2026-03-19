import math

from app.scoring import global_score, rarity_score_from_observation_count, sharpness_bonus


def test_rarity_score_none_is_zero():
    assert rarity_score_from_observation_count(None) == 0.0


def test_rarity_score_invalid_is_zero():
    assert rarity_score_from_observation_count("abc") == 0.0


def test_rarity_score_bounds():
    assert 0.0 <= rarity_score_from_observation_count(0) <= 100.0
    assert 0.0 <= rarity_score_from_observation_count(1_000_000) <= 100.0
    assert rarity_score_from_observation_count(0) == 100.0
    assert rarity_score_from_observation_count(10**12) == 0.0


def test_sharpness_bonus_monotonic_basic():
    b0 = sharpness_bonus(0, bonus_max=25.0)
    b50 = sharpness_bonus(50, bonus_max=25.0)
    b100 = sharpness_bonus(100, bonus_max=25.0)
    assert 0.0 <= b0 <= b50 <= b100 <= 25.0


def test_sharpness_bonus_gamma_guard():
    # gamma <= 0 => fallback gamma=1.0
    assert sharpness_bonus(50, bonus_max=10.0, gamma=0) == sharpness_bonus(50, bonus_max=10.0, gamma=1.0)


def test_global_score_clamped():
    assert global_score(rarity_score_0_100=200, sharpness_score_0_100=100, bonus_max=50) == 100.0
    assert global_score(rarity_score_0_100=-10, sharpness_score_0_100=-10, bonus_max=50) == 0.0


def test_rarity_uses_log1p_ref():
    s1 = rarity_score_from_observation_count(9, count_ref=100)
    s2 = rarity_score_from_observation_count(9, count_ref=10_000)
    assert not math.isclose(s1, s2)
