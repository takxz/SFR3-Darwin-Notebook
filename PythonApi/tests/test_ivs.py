from app.ivs import distribute_ivs, iv_total_from_global_score

def test_iv_total_from_global_score_bounds():
    """Total IVs = 0..25 selon score 0..100"""
    assert iv_total_from_global_score(0.0) == 0
    assert iv_total_from_global_score(50.0) == 12  # 25 * 50/100
    assert iv_total_from_global_score(100.0) == 25
    assert iv_total_from_global_score(200.0) == 25  # clamp
    assert iv_total_from_global_score(-10.0) == 0   # clamp
    assert iv_total_from_global_score(None) == 0    # invalid

def test_iv_total_from_global_score_custom_max():
    assert iv_total_from_global_score(100.0, max_total=31) == 31
    assert iv_total_from_global_score(50.0, max_total=31) == 16

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
