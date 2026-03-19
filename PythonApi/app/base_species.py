# Logique métier Pokémon stats
def get_base_stats(animal_id: int) -> dict | None:
    """Récupère stats de base depuis cache/API."""
    # Ta logique existante
    return {"hp": 10, "atk": 8}  # exemple

def final_stats_from_formula(base: dict, level: int, ivs: dict) -> dict:
    """Calcule stats finales = base + IVs * level."""
    # Ta formule existante
    return {"hp": base["hp"] + ivs["hp"] * level / 10}
