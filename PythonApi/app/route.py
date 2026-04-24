from . import load_model_detection, module_detection
from .classification_queue import get_queue
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


def _run_classification(image, filename, client_level):
    """
    Logique métier de reconnaissance — exécutée par un worker du pool.

    Renvoie un dict (jamais une réponse Flask) afin de pouvoir être stocké
    tel quel dans le job et renvoyé plus tard via /classification/status.
    """
    sharp = compute_sharpness(image)

    model_detection = load_model_detection() or current_app.config.get("MODEL_DETECTION")
    if model_detection is None:
        return {
            "success": False,
            "error": "Modèle de détection non disponible",
            "http_status": 503,
        }

    predictions = model_detection(image)
    top = predictions[0]
    predicted_label = top['label'].split(', ')[0]
    predicted_conf = float(top.get("score", 0.0))

    is_organism = module_detection.is_this_an_organism(predicted_label)

    if not is_organism:
        return {
            "success": False,
            "is_organism": False,
            "message": "L'image ne correspond pas à un organisme vivant",
            "filename": filename,
            "predicted_label": predicted_label,
            "predicted_confidence": predicted_conf,
            "sharpness_score": sharp.score_0_100,
            "sharpness_var_laplacian": sharp.variance_of_laplacian,
            "sharpness_rank": sharp.rank,
        }

    # Récupérer rareté via iNaturalist (observation_count), puis score global.
    url = "https://api.inaturalist.org/v1/taxa/autocomplete"
    params = {"q": predicted_label, "per_page": 1, "locale": "fr"}

    animal = None
    observation_count = 0
    rarity_score = 0.0

    try:
        r = requests.get(url, params=params, timeout=30)
        if r.status_code == 200:
            data = r.json()
            if data.get("results"):
                animal = data["results"][0]
                observation_count = animal.get("observations_count", 0)
                rarity_score = rarity_score_from_observation_count(observation_count)
    except requests.exceptions.RequestException as e:
        print(f"Warning: Failed to fetch data from iNaturalist API: {e}")

    gscore = compute_global_score(
        rarity_score_0_100=rarity_score,
        sharpness_score_0_100=sharp.score_0_100,
        bonus_max=25.0,
    )

    ivs_dict = None
    if animal is not None:
        seed = f"{animal.get('id','')}-{predicted_label}-{sharp.score_0_100:.3f}-{filename or ''}"
        ivs = distribute_ivs(gscore, seed=seed, max_total=25)
        ivs_dict = ivs.as_dict()

    base = get_base_stats(animal.get("id") if animal else None)
    level = 7

    final_stats = None
    if base is not None:
        final_stats = final_stats_from_formula(
            base=base,
            level=level,
            ivs=ivs_dict,
            sharpness_score=sharp.score_0_100,
        )

    return {
        "success": True,
        "is_organism": is_organism,
        "filename": filename,
        "animal_id": animal.get("id") if animal else None,
        "common_name": animal.get("preferred_common_name") if animal else None,
        "scientific_name": animal.get("name") if animal else predicted_label,
        "observation_count": observation_count,
        "image_url": animal.get("default_photo", {}).get("medium_url") if animal else None,
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


def _parse_request_image():
    """Lit l'image (multipart ou base64) dans le thread de requête."""
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
        return None, None
    # Image.open est paresseux: on force le décodage avant de quitter le thread
    # de requête, sinon le worker lirait un buffer fermé.
    image.load()
    return image, filename


def classification():
    """
    Soumet l'image à la file de reconnaissance et renvoie un job_id.
    Le client interroge ensuite /classification/status/<job_id> pour suivre
    l'avancement (queued → processing → done/error).
    """
    try:
        image, filename = _parse_request_image()
        if image is None:
            return jsonify({'error': 'Aucune image fournie'}), 400

        client_level = None
        if request.is_json and request.json:
            client_level = request.json.get("level")

        # On capture l'app courante: les workers s'exécutent hors contexte de
        # requête, donc current_app/url_rule etc. ne sont pas accessibles
        # directement. _run_classification utilise current_app.config — on lui
        # rouvre un app context dans le worker.
        app_obj = current_app._get_current_object()

        def _work():
            with app_obj.app_context():
                return _run_classification(image, filename, client_level)

        queue = get_queue()
        job = queue.submit(_work)
        _job, snapshot = queue.get(job.id)

        return jsonify({
            "success": True,
            "job_id": job.id,
            "status": job.status,
            "queue": snapshot,
        }), 202

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Erreur interne (Python): {str(e)}',
            'details': traceback.format_exc() if current_app.debug else None
        }), 500


def classification_status(job_id):
    """Retourne l'état courant d'un job de reconnaissance."""
    queue = get_queue()
    job, snapshot = queue.get(job_id)
    if job is None:
        return jsonify({
            "success": False,
            "error": "Job introuvable ou expiré",
        }), 404

    payload = {
        "success": True,
        "job_id": job.id,
        "status": job.status,
        "queue": snapshot,
    }
    if job.status == "done":
        result = job.result or {}
        # Si le worker a remonté un http_status (ex: 503 modèle indispo), on
        # le propage au client tout en restant cohérent côté payload.
        http_status = 200
        if isinstance(result, dict) and "http_status" in result:
            http_status = int(result.pop("http_status"))
        payload["result"] = result
        return jsonify(payload), http_status
    if job.status == "error":
        payload["error"] = job.error
        return jsonify(payload), 500
    return jsonify(payload), 200


def init_routes(app):
    app.add_url_rule("/", endpoint="hello_world", view_func=hello_world)
    app.add_url_rule("/test", endpoint="index", view_func=index)
    app.add_url_rule("/ping", endpoint="ping", view_func=ping)
    app.add_url_rule(
        "/classification",
        endpoint="classification",
        view_func=classification,
        methods=["POST"],
    )
    app.add_url_rule(
        "/classification/status/<job_id>",
        endpoint="classification_status",
        view_func=classification_status,
        methods=["GET"],
    )


### Routes /capture et /sharpness supprimées (éviter redondance).
