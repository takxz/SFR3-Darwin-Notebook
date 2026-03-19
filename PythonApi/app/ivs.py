from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass


@dataclass(frozen=True)
class IVs:
    hp: int
    atk: int
    defense: int
    speed: int

    @property
    def total(self) -> int:
        return self.hp + self.atk + self.defense + self.speed

    def as_dict(self) -> dict:
        return {"hp": self.hp, "atk": self.atk, "defense": self.defense, "speed": self.speed, "total": self.total}


def _seed_to_int(seed: str) -> int:
    # Stable cross-platform seed (avoid Python's salted hash()).
    h = hashlib.sha256(seed.encode("utf-8")).digest()
    return int.from_bytes(h[:8], "big", signed=False)


def iv_total_from_global_score(global_score_0_100: float, *, max_total: int = 25) -> int:
    """
    Convertit un score global 0..100 en un total d'IVs (0..max_total).
    """
    try:
        s = float(global_score_0_100)
    except (TypeError, ValueError):
        return 0
    s = max(0.0, min(100.0, s))
    return int(round(max_total * (s / 100.0)))


def distribute_ivs(
    global_score_0_100: float,
    *,
    seed: str | None = None,
    max_total: int = 25,
) -> IVs:
    """
    Distribue `iv_total` points (sur max_total) aléatoirement sur 4 stats.
    - Si `seed` est fourni: distribution reproductible.
    """
    total = iv_total_from_global_score(global_score_0_100, max_total=max_total)

    rng = random.Random(_seed_to_int(seed) if seed else None)

    hp = atk = defense = speed = 0
    buckets = ["hp", "atk", "defense", "speed"]
    for _ in range(total):
        b = rng.choice(buckets)
        if b == "hp":
            hp += 1
        elif b == "atk":
            atk += 1
        elif b == "defense":
            defense += 1
        else:
            speed += 1

    return IVs(hp=hp, atk=atk, defense=defense, speed=speed)

