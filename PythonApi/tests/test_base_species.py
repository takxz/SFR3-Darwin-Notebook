from app.base_species import get_base_stats, final_stats_from_formula, BaseStats, level_from_global_score, load_base_stats
from pathlib import Path
from unittest.mock import patch

def test_basestats_as_dict():
    stats = BaseStats(hp=10, atk=20, defense=30, speed=40)
    d = stats.as_dict()
    assert d == {"hp": 10, "atk": 20, "defense": 30, "speed": 40}

def test_load_base_stats_missing_file():
    with patch.object(Path, "exists", return_value=False):
        assert load_base_stats() == {}

def test_load_base_stats_invalid_entry():
    # Simulation d'un JSON avec une entrée malformée (manque des champs) et une correcte
    invalid_json = '{"41964": {"hp": 80, "atk": 20, "defense": 20, "speed": 20}, "invalid": "entry"}'
    with patch.object(Path, "exists", return_value=True):
        with patch.object(Path, "read_text", return_value=invalid_json):
            stats = load_base_stats()
            assert 41964 in stats
            # "invalid" est sauté par l'except Exception

def test_get_base_stats_none():
    stats = get_base_stats(None)
    assert stats.hp == 20.0

def test_level_from_global_score():
    assert level_from_global_score(100) == 100
    assert level_from_global_score(0) == 1
    assert level_from_global_score("invalid") == 1
    assert level_from_global_score(-50) == 1
    assert level_from_global_score(150) == 100

def test_final_stats_formula_with_object():
    base = BaseStats(hp=10, atk=10, defense=10, speed=10)
    ivs = {"hp": 10}
    stats = final_stats_from_formula(base=base, level=10, ivs=ivs, sharpness_score=100)
    # base 10 + (level 10 * iv 10/10) = 10 + 10 = 20. 
    # sharpness bonus 20% -> 20 * 1.2 = 24
    assert stats["hp"] == 24


def test_get_base_stats_guépard():
    stats = get_base_stats(123)  # iNaturalist ID
    assert stats is not None
    assert hasattr(stats, 'hp')

def test_final_stats_formula_basic():
    base = {"hp": 10}
    ivs = {"hp": 15}
    stats = final_stats_from_formula(base=base, level=7, ivs=ivs)
    assert "hp" in stats
    assert stats["hp"] > base["hp"]

def test_final_stats_formula_edge_cases():
    base = {"hp": 0}
    ivs = {"hp": 0}
    stats = final_stats_from_formula(base=base, level=1, ivs=ivs)
    assert stats["hp"] >= 0

def test_get_base_stats_not_found():
    stats = get_base_stats(999999)  # ID invalide
    assert stats.hp == 20.0