from . import load_model_detection, module_detection
from app.scoring import (
    global_score as compute_global_score,
    rarity_score_from_observation_count,
)
from app.ivs import distribute_ivs
from app.base_species import final_stats_from_formula, get_base_stats
from flask import jsonify, request, current_app
import requests
from PIL import Image
import base64
import io


def compute_sharpness(image):
    # Import tardif: évite de forcer numpy/OpenCV au simple import des routes (utile en tests).
    from app.sharpness import compute_sharpness as _compute_sharpness

    return _compute_sharpness(image)


def hello_world():
    return 'Hello World!'


def index():
    return requestInaturalist("cheetah")


def ping():
    return 'pong'

# ========= ROUTES DE RECHERCHES INATURALIST ===========

def requestInaturalist(animal, extra: dict | None = None):
    """
    :param animal: str (doit venir de notre modèle d'IA)
    :return: json avec les informations de l'animal en question
    """

    url = "https://api.inaturalist.org/v1/taxa/autocomplete"
    params = {
        "q": animal,
        "per_page": 1,
        "locale": "fr"
    }

    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()

        if data['results']:
            animals = data['results'][0]
            observation_count = animals.get("observations_count")
            rarity_score = rarity_score_from_observation_count(observation_count)
            sharpness_score = None
            if extra and "sharpness_score" in extra:
                sharpness_score = extra.get("sharpness_score")
            final_score = (
                compute_global_score(
                    rarity_score_0_100=rarity_score,
                    sharpness_score_0_100=float(sharpness_score or 0.0),
                    bonus_max=25.0,
                )
                if sharpness_score is not None
                else rarity_score
            )

            payload = {
                'success': True,
                'animal_id': animals.get('id'),
                'common_name': animals.get("preferred_common_name"),
                'scientific_name': animals.get("name"),
                'observation_count': observation_count,
                "image_url": animals['default_photo']["medium_url"],
                "rarity_score": rarity_score,
                "global_score": final_score,
            }
            if extra:
                payload.update(extra)
            return jsonify(payload)
        else:
            return jsonify({'success': False, 'message': 'Aucun résultat trouvé'}), 404

    else:
        return jsonify({'success': False, 'message': f'Erreur API: {response.status_code}'}), response.status_code


def classification():
    """
    Reçoit l'image du front-end et l'analyse dans le back-end
    :return: les informations de INaturalist si organisme ou alors une erreur si ce n'est pas un organisme
    """

    try:
        if 'image' in request.files:
            image_file = request.files['image']
            image = Image.open(image_file)
            filename = getattr(image_file, "filename", None)
        elif request.is_json and request.json and 'imageData' in request.json:
            image_data = request.json['imageData'].split(',')[1]
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            filename = request.json.get("filename")
        else:
            return jsonify({'error': 'Aucune image fournie'}), 400

        sharp = compute_sharpness(image)

        from . import load_model_detection
        model_detection = load_model_detection() or current_app.config.get("MODEL_DETECTION")
        if model_detection is None:
            return jsonify({"success": False, "error": "Modèle de détection non disponible"}), 503

        predictions = model_detection(image)
        top = predictions[0]
        predicted_label = top['label'].split(', ')[0]
        predicted_conf = float(top.get("score", 0.0))

        if not module_detection.is_this_an_organism(predicted_label):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "L'image ne correspond pas à un organisme vivant",
                        "filename": filename,
                        "predicted_label": predicted_label,
                        "predicted_confidence": predicted_conf,
                        "sharpness_score": sharp.score_0_100,
                        "sharpness_var_laplacian": sharp.variance_of_laplacian,
                        "sharpness_rank": sharp.rank,
                    }
                ),
                400,
            )

        # Récupérer rareté via iNaturalist (observation_count), puis score global.
        url = "https://api.inaturalist.org/v1/taxa/autocomplete"
        params = {"q": predicted_label, "per_page": 1, "locale": "fr"}
        r = requests.get(url, params=params)
        if r.status_code != 200:
            return jsonify({"success": False, "error": f"Erreur API iNaturalist: {r.status_code}"}), 502

        data = r.json()
        if not data.get("results"):
            return jsonify({"success": False, "error": "Aucun résultat iNaturalist"}), 404

        animal = data["results"][0]
        observation_count = animal.get("observations_count")
        rarity_score = rarity_score_from_observation_count(observation_count)
        gscore = compute_global_score(
            rarity_score_0_100=rarity_score,
            sharpness_score_0_100=sharp.score_0_100,
            bonus_max=25.0,
        )

        # IVs utilisés en interne uniquement (pour produire final_stats).
        seed = f"{animal.get('id','')}-{predicted_label}-{sharp.score_0_100:.3f}-{filename or ''}"
        ivs = distribute_ivs(gscore, seed=seed, max_total=25)
        ivs_dict = ivs.as_dict()

        base = get_base_stats(animal.get("id"))
        client_level = None
        if request.is_json and request.json:
            client_level = request.json.get("level")
        level = 7

        final_stats = None
        if base is not None:
            final_stats = final_stats_from_formula(
                base=base,
                level=level,
                ivs=ivs_dict,
                sharpness_score=sharp.score_0_100,
            )

        return jsonify(
            {
                "success": True,
                "filename": filename,
                "animal_id": animal.get("id"),
                "common_name": animal.get("preferred_common_name"),
                "scientific_name": animal.get("name"),
                "observation_count": observation_count,
                "image_url": animal.get("default_photo", {}).get("medium_url"),
                "predicted_label": predicted_label,
                "predicted_confidence": predicted_conf,
                "sharpness_score": sharp.score_0_100,
                "sharpness_var_laplacian": sharp.variance_of_laplacian,
                "sharpness_rank": sharp.rank,
                "rarity_score": rarity_score,
                "global_score": gscore,
                "level": level,
                "final_stats": final_stats,
            }
        )

    except IOError:
        return jsonify({'error': 'Erreur lors du traitement de l\'image'}), 500


def init_routes(app):
    app.add_url_rule("/", endpoint="hello_world", view_func=hello_world)
    app.add_url_rule("/test", endpoint="index", view_func=index)
    app.add_url_rule("/ping", endpoint="ping", view_func=ping)
    app.add_url_rule("/classification", endpoint="classification", view_func=classification, methods=["POST"])


### Routes /capture et /sharpness supprimées (éviter redondance).