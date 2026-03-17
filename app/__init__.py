from flask import Flask
from dotenv import load_dotenv
from transformers import pipeline
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

model_detection = pipeline("image-classification", model="google/vit-base-patch16-224")
app.config['MODEL_DETECTION'] = model_detection

from app import route

