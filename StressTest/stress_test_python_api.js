import http from 'k6/http';
import { b64encode } from 'k6/encoding';
import { sleep, check } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Chargement de ton image spécifique
const imageBytes = open('./assets/coccinelle-migratrice-pucerons-anti-rosiers.jpg', 'b');
const imageBase64 = b64encode(imageBytes);
const baseUrl = 'http://ikdeksmp.fr:5002';

// Polling de la file: l'API renvoie 202 + job_id puis on suit /classification/status.
const POLL_INTERVAL_MS = 800;
const POLL_TIMEOUT_MS = 120_000;

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

function pollUntilDone(jobId) {
    const start = Date.now();
    while (Date.now() - start < POLL_TIMEOUT_MS) {
        const res = http.get(`${baseUrl}/classification/status/${jobId}`);
        if (res.status === 200) {
            let body;
            try { body = res.json(); } catch (e) { body = null; }
            if (body && (body.status === 'done' || body.status === 'error')) {
                return { res, body };
            }
        } else if (res.status >= 400) {
            return { res, body: null };
        }
        sleep(POLL_INTERVAL_MS / 1000);
    }
    return { res: null, body: null };
}

export default function () {
    // --- ÉTAPE 1 : L'utilisateur arrive sur l'app ---
    http.get(`${baseUrl}/`);

    // L'utilisateur prend le temps de viser la créature
    sleep(randomIntBetween(5, 15));

    // --- ÉTAPE 2 : Soumission de l'image (la file renvoie 202 + job_id) ---
    const payload = JSON.stringify({
        imageData: `data:image/jpeg;base64,${imageBase64}`,
        filename: 'coccinelle-migratrice-pucerons-anti-rosiers.jpg',
    });
    const params = {
        headers: { 'Content-Type': 'application/json' },
        timeout: '30s',
    };

    const submit = http.post(`${baseUrl}/classification`, payload, params);
    const submitOk = check(submit, {
        'submit accepté (202)': (r) => r.status === 202,
        'submit renvoie un job_id': (r) => {
            try { return Boolean(r.json('job_id')); } catch (_) { return false; }
        },
    });
    if (!submitOk) {
        console.error(`Soumission KO (status=${submit.status})`);
        sleep(5);
        return;
    }

    const jobId = submit.json('job_id');
    const initialQueue = submit.json('queue');
    if (initialQueue) {
        console.log(`Job ${jobId} soumis — position=${initialQueue.position} queued=${initialQueue.queued_total} processing=${initialQueue.processing_total}/${initialQueue.max_workers}`);
    }

    // --- ÉTAPE 3 : Polling jusqu'à done/error ---
    const { res, body } = pollUntilDone(jobId);
    if (!res || !body) {
        console.error(`Job ${jobId}: timeout ou échec de polling`);
        sleep(5);
        return;
    }

    check(body, {
        'job terminé': (b) => b.status === 'done',
    });

    if (body.status === 'done') {
        console.log(`Succès job ${jobId} — durée totale=${submit.timings.duration + res.timings.duration}ms`);
        sleep(randomIntBetween(10, 20));
    } else {
        console.error(`Job ${jobId} en erreur: ${body.error || 'inconnue'}`);
        sleep(5);
    }
}
