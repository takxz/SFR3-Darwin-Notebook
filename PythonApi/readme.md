Route / :
- Retourne un Hello World

Route /test : 
- Retourne les informations de la cheetah par l'api Inaturalist

Route /ping : 
- Retourne un pong, servira potentiellement à la supervision de l'API

Route /classification : 
- Retourne la classification de l'animal (si ça en est un) par l'api Inaturalist.
- body : 
  - form-data
  - key : image
  - value : image de l'animal à classifier



Pour lancer le serveur : 
- se placer dans le dossier PythonApi
- pip install -r requirements.txt
- python darwin.py
- le serveur est lancé sur le port 5002