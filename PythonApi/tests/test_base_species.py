import pytest
from app.base_species import get_base_stats, final_stats_from_formula, BaseStats, level_from_global_score, load_base_stats
from pathlib import Path
from unittest.mock import patch

def test_basestats_as_dict():
    stats = BaseStats(hp=10, atk=20, defense=30, speed=40)
    assert stats.as_dict() == {"hp": 10, "atk": 20, "defense": 30, "speed": 40}

def test_load_base_stats_missing_file():
    with patch.object(Path, "exists", return_value=False):
        assert load_base_stats() == {}

def test_load_base_stats_invalid_entry():
    invalid_json = '{"41964": {"hp": 80, "atk": 20, "defense": 20, "speed": 20}, "invalid": "entry"}'
    with patch.object(Path, "exists", return_value=True), \
         patch.object(Path, "read_text", return_value=invalid_json):
        stats = load_base_stats()
        assert 41964 in stats

@pytest.mark.parametrize("score,expected", [
    (100, 100),
    (0, 1),
    ("invalid", 1),
    (-50, 1),
    (150, 100),
])
def test_level_from_global_score(score, expected):
    assert level_from_global_score(score) == expected

def test_get_base_stats_cases():
    # None fallback
    assert get_base_stats(None).hp == 20.0
    # Not found fallback
    assert get_base_stats(999999).hp == 20.0
    # Found
    assert get_base_stats(123).hp is not None

def test_final_stats_formula_with_object():
    base = BaseStats(hp=10, atk=10, defense=10, speed=10)
    ivs = {"hp": 10}
    stats = final_stats_from_formula(base=base, level=10, ivs=ivs, sharpness_score=100)
    assert stats["hp"] == 24

def test_final_stats_formula_basic():
    base = {"hp": 10}
    ivs = {"hp": 15}
    stats = final_stats_from_formula(base=base, level=7, ivs=ivs)
    assert stats["hp"] > base["hp"]
