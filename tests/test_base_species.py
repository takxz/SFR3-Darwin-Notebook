from app.base_species import get_base_stats, final_stats_from_formula

def test_get_base_stats_guépard():
    stats = get_base_stats(123)  # iNaturalist ID
    assert stats is not None
    assert isinstance(stats, dict)
    assert "hp" in stats  # ou les clés que tu as

def test_final_stats_formula_basic():
    base = {"hp": 10}
    ivs = {"hp": 15}
    stats = final_stats_from_formula(base, level=7, ivs=ivs)
    assert "hp" in stats
    assert stats["hp"] > base["hp"]

def test_final_stats_formula_edge_cases():
    base = {"hp": 0}
    ivs = {"hp": 0}
    stats = final_stats_from_formula(base, level=1, ivs=ivs)
    assert stats["hp"] >= 0

def test_get_base_stats_none():
    stats = get_base_stats(999999)  # ID invalide
    assert isinstance(stats, dict)