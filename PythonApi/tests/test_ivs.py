import pytest
from app.ivs import distribute_ivs, iv_total_from_global_score

@pytest.mark.parametrize("score,max_total,expected", [
    (0.0, 25, 0),
    (50.0, 25, 12),
    (100.0, 25, 25),
    (200.0, 25, 25),
    (-10.0, 25, 0),
    (None, 25, 0),
    (100.0, 31, 31),
    (50.0, 31, 16),
])
def test_iv_total_from_global_score_bounds(score, max_total, expected):
    assert iv_total_from_global_score(score, max_total=max_total) == expected


def test_distribute_ivs_structure_and_total():
    """Vérifie structure + total = iv_total_from_global_score"""
    ivs = distribute_ivs(85.0, seed="test")
    assert ivs.total == iv_total_from_global_score(85.0)  # ✅ 21
    assert ivs.as_dict()["total"] == ivs.total
    assert all(0 <= v <= 31 for v in ivs.as_dict().values() if v != ivs.total)

def test_distribute_ivs_seed_reproducible():
    """Même seed = même distribution exacte"""
    ivs1 = distribute_ivs(85.0, seed="repro")
    ivs2 = distribute_ivs(85.0, seed="repro")
    assert ivs1.as_dict() == ivs2.as_dict()
    assert ivs1.total == ivs2.total

def test_distribute_ivs_different_seeds_different_distrib():
    """Seeds différents = distributions différentes"""
    ivs1 = distribute_ivs(50.0, seed="seed1")
    ivs2 = distribute_ivs(50.0, seed="seed2")
    assert ivs1.as_dict() != ivs2.as_dict()
