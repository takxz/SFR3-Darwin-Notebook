from __future__ import annotations

try:
    import nltk  # type: ignore
    from nltk.corpus import wordnet  # type: ignore
except Exception:  # pragma: no cover
    nltk = None  # type: ignore
    wordnet = None  # type: ignore


def _ensure_wordnet_downloaded() -> None:
    if nltk is None:
        return
    try:
        nltk.data.find("corpora/wordnet.zip")
    except LookupError:  # pragma: no cover (téléchargement dépend de l'env)
        nltk.download("wordnet")
        nltk.download("omw-1.4")


def is_this_an_organism(predicted_label: str | None) -> bool:
    """
    :param predicted_label: str
    :return: bool
    Détermine si le label prédit correspond à un organisme vivant en utilisant WordNet.
    """
    if not predicted_label:
        return False

    # Fallback "safe" si NLTK/WordNet n'est dispo (ex: tests unitaires).
    if nltk is None or wordnet is None:
        return bool(str(predicted_label).strip())

    _ensure_wordnet_downloaded()

    formatted_label = predicted_label.split(",")[0].replace(" ", "_").lower()
    synsets = wordnet.synsets(formatted_label)

    if not synsets:
        return False

    for synset in synsets:
        for path in synset.hypernym_paths():
            for ancestor in path:
                if ancestor.name() == 'organism.n.01':
                    return True
    return False