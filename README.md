# 🧬 SFR3 - Projet Darwin (Environnement Local)

Bienvenue sur le dépôt du projet Darwin. Ce document explique comment configurer et lancer l'ensemble de l'écosystème (FrontEnd, BackEnd, IA, et Bases de données) sur votre machine locale.

---

## 🛠️ 1. Prérequis
Avant de commencer, assurez-vous d'avoir installé :
* **Node.js** (v22 recommandée)
* **Python 3** (pour le microservice IA)
* **Docker**  **OUVERT ET EN COURS D'EXÉCUTION** en arrière-plan.

## ⚙️ 2. Installation initiale (À faire une seule fois)

1. Clonez le dépôt et placez-vous à la racine.
2. Installez les dépendances du chef d'orchestre :
   ```bash
   npm install
   ```
3. Installez les dépendances de chaque service :
   ```bash
   cd FrontEnd && npm install
   cd ../BackEnd && npm install
   cd ../PythonApi && pip install -r requirements.txt
   cd ..
   ```
4. **Configuration de l'environnement :**
   Dans les dossiers `FrontEnd`, `BackEnd`, et `PythonApi`, vous trouverez des fichiers `.env.example`. 
   👉 Dupliquez-les et renommez-les en `.env`. Remplissez les informations si nécessaire (notamment votre adresse IP locale dans le `.env` du FrontEnd).

---

## 🚀 3. Démarrage Rapide (Usage quotidien)

Pour lancer toute l'infrastructure (Bases de données + Front + Back + Python) en une seule commande, tapez à la racine :

```bash
npm start
```

**Ce que fait cette commande :**
1. Elle détecte votre adresse IP locale et vous l'affiche.
2. Elle monte `PostgreSQL` et `Redis` via Docker (en injectant de fausses données de test).
3. Elle vous génère le lien `exp://` pour l'application mobile.
4. Elle lance les 3 serveurs en parallèle.

---

## 🧪 4. Données de Test (Le Labo)

Dès le premier lancement, la base de données est automatiquement remplie. 

**Accès Base de données (DBeaver / pgAdmin) :**
* Hôte : `localhost`
* Port : `5432`
* Utilisateur : `db_user`
* Mot de passe : `db_pass`
* Base : `db_name`

**Comptes Joueurs pour tester l'application mobile :**
* `test1@efficom.fr` / `password123` (Possède 5 créatures)
* `test2@efficom.fr` / `password123` (Possède 4 créatures)

---

## 🤖 5. Microservice IA (Routes Python)

L'API d'intelligence artificielle (iNaturalist) tourne par défaut sur le port **5001** (ou **5002** selon votre config).

* `GET /` : Retourne un Hello World.
* `GET /ping` : Retourne un "pong" (Supervision / Healthcheck).
* `GET /test` : Retourne les informations de la créature "cheetah" via l'API iNaturalist.
* `POST /classification` : Analyse une image et retourne la classification de l'animal.
  * **Body** : `form-data`
  * **Key** : `image`
  * **Value** : [Fichier image de l'animal à classifier]