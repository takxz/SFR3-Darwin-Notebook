from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class BaseStats:
    hp: float
    atk: float
    defense: float
    speed: float

    def as_dict(self) -> dict:
        return {"hp": self.hp, "atk": self.atk, "defense": self.defense, "speed": self.speed}


def _data_path() -> Path:
    # app/base_species.py -> ../data/base_species_stats.json
    return Path(__file__).resolve().parent.parent / "data" / "base_species_stats.json"


def load_base_stats() -> dict[int, BaseStats]:
    """
    Charge la table de stats de base par `animal_id` iNaturalist.
    Format JSON attendu:
      {
        "41964": {"hp": 80, "atk": 90, "defense": 70, "speed": 60},
        "121578": {"hp": 60, "atk": 40, "defense": 55, "speed": 35}
      }
    """
    p = _data_path()
    if not p.exists():
        return {}
    raw = json.loads(p.read_text(encoding="utf-8"))
    out: dict[int, BaseStats] = {}
    for k, v in raw.items():
        try:
            animal_id = int(k)
            out[animal_id] = BaseStats(
                hp=float(v["hp"]),
                atk=float(v["atk"]),
                defense=float(v["defense"]),
                speed=float(v["speed"]),
            )
        except Exception:
            # Skip invalid entries silently (POC-friendly).
            continue
    return out


def get_base_stats(animal_id: int | None) -> BaseStats:
    table = load_base_stats()
    if animal_id is None:
        # fallback générique
        return BaseStats(hp=20.0, atk=20.0, defense=20.0, speed=20.0)
    return table.get(int(animal_id), BaseStats(hp=20.0, atk=20.0, defense=20.0, speed=20.0))


def level_from_global_score(global_score_0_100: float, *, min_level: int = 1, max_level: int = 100) -> int:
    """
    Déduit un niveau (1..100) depuis `global_score`.
    Tu peux remplacer cette règle par ton système de progression.
    """
    try:
        s = float(global_score_0_100)
    except (TypeError, ValueError):
        s = 0.0
    s = max(0.0, min(100.0, s))
    lvl = int(round(min_level + (max_level - min_level) * (s / 100.0)))
    return max(min_level, min(max_level, lvl))


def final_stats_from_formula(
    *,
    base: BaseStats,
    level: int,
    ivs: dict,
    sharpness_score: float = 0.0,
) -> dict:
    """
    Formule demandée:
      Stat = base_specie + (level * (iv / 10)), plus bonus neteté.

    sharpness_score 0..100 -> bonus 0..20%.
    """
    level = max(1, int(level))
    sharpness_score = max(0.0, min(100.0, float(sharpness_score or 0.0)))
    sharpness_factor = 1.0 + (sharpness_score / 100.0) * 0.20

    hp = float(base.hp + (level * (float(ivs.get("hp", 0)) / 10.0)))
    atk = float(base.atk + (level * (float(ivs.get("atk", 0)) / 10.0)))
    defense = float(base.defense + (level * (float(ivs.get("defense", 0)) / 10.0)))
    speed = float(base.speed + (level * (float(ivs.get("speed", 0)) / 10.0)))

    hp = float(hp * sharpness_factor)
    atk = float(atk * sharpness_factor)
    defense = float(defense * sharpness_factor)
    speed = float(speed * sharpness_factor)

    return {
        "hp": hp,
        "atk": atk,
        "defense": defense,
        "speed": speed,
        "level": int(level),
        "sharpness_score": sharpness_score,
        "sharpness_factor": round(sharpness_factor, 3),
    }
