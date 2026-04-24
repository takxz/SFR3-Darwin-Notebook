import http from 'k6/http';
import { b64encode } from 'k6/encoding';
import { sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Chargement de ton image spécifique
const imageBytes = open('./assets/coccinelle-migratrice-pucerons-anti-rosiers.jpg', 'b');
const imageBase64 = b64encode(imageBytes);
const url = 'http://ikdeksmp.fr:5002/classification';

export const options = {
    stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 70 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        http_req_failed: ['rate<0.10'], 
    },
};

export default function () {
    // --- ÉTAPE 1 : L'utilisateur arrive sur l'app ---
    // On simule une petite requête légère sur la racine pour voir si le serveur répond toujours
    http.get('http://ikdeksmp.fr:5002/'); 
    
    // L'utilisateur prend le temps de viser la créature (entre 5 et 15 secondes)
    sleep(randomIntBetween(5, 15));

    // --- ÉTAPE 2 : Envoi de l'image pour classification ---
    const payload = JSON.stringify({
        imageData: `data:image/jpeg;base64,${imageBase64}`,
        filename: 'coccinelle-migratrice-pucerons-anti-rosiers.jpg',
    });

    const params = {
        headers: { 'Content-Type': 'application/json' },
        timeout: '120s', // On laisse 2 min au serveur pour répondre si l'IA sature
    };

    const res = http.post(url, payload, params);

    // --- ÉTAPE 3 : Lecture des résultats ---
    if (res.status === 200) {
        console.log(`Succès ! Temps de réponse : ${res.timings.duration}ms`);
        // L'utilisateur lit les informations sur la coccinelle (entre 10 et 20 secondes)
        sleep(randomIntBetween(10, 20));
    } else {
        console.error(`Erreur ${res.status} reçue du serveur`);
        // En cas d'erreur, l'utilisateur attend 5 secondes avant de quitter
        sleep(5);
    }
}