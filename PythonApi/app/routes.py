from app import app, module_detection
from flask import jsonify, request
import requests
from PIL import Image
import base64
import io

model_detection = app.config['MODEL_DETECTION']


@app.route('/')
def hello_world():
    return 'Hello World!'

@app.route('/test')
def index():
    return requestInaturalist("cheetah")

@app.route('/ping')
def ping():
    return 'pong'

# ========= ROUTES DE RECHERCHES INATURALIST ===========

def requestInaturalist(animal):
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
            return jsonify({
                'success': True,
                'animal_id': animals.get('id'),
                'common_name': animals.get("preferred_common_name"),
                'scientific_name': animals.get("name"),
                'observation_count': animals.get("observations_count"),
                "image_url": animals['default_photo']["medium_url"],
            })
        else:
            return jsonify({'success': False, 'message': 'Aucun résultat trouvé'}), 404

    else:
        return jsonify({'success': False, 'message': f'Erreur API: {response.status_code}'}), response.status_code


@app.route('/classification', methods=['POST'])
def classification():
    """
    Reçoit l'image du front-end et l'analyse dans le back-end
    :return: les informations de INaturalist si organisme ou alors une erreur si ce n'est pas un organisme
    """

    try:
        request_json = request.get_json(silent=True) or {}

        if 'image' in request.files:
            image_file = request.files['image']
            image = Image.open(image_file)
        elif 'imageData' in request_json:
            if ',' not in request_json['imageData']:
                return jsonify({'error': 'Format imageData invalide'}), 400

            image_data = request_json['imageData'].split(',')[1]
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
        else:
            return jsonify({'error': 'Aucune image fournie'}), 400

        predictions = model_detection(image)
        top_prediction = predictions[0]
        predicted_label = top_prediction['label'].split(', ')[0]

        if module_detection.is_this_an_organism(predicted_label):
            inaturalist_response = requestInaturalist(predicted_label)
            return inaturalist_response
        else:
            return jsonify({'error': 'L\'image ne correspond pas à un organisme vivant'}), 400

    except IOError:
        return jsonify({'error': 'Erreur lors du traitement de l\'image'}), 500
    except Exception as error:
        return jsonify({'error': f'Erreur serveur: {str(error)}'}), 500
