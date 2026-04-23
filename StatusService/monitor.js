const path = require('path');
const fs = require('fs/promises');
const { execSync } = require('child_process');
const pm2 = require('pm2');
const QRCode = require('qrcode');

require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const POLL_INTERVAL_MS = parseInt(process.env.STATUS_POLL_INTERVAL_MS || '30000', 10);
const EXPO_HOST = process.env.EXPO_HOST || '127.0.0.1';
const EXPO_PORT = process.env.EXPO_PORT || '8081';
const SELF_NAME = process.env.SELF_SERVICE_NAME || 'darwin-status-monitor';
const STATE_FILE = path.join(__dirname, '.state.json');
const REPO_DIR = path.resolve(__dirname, '..');

if (!WEBHOOK_URL) {
    console.error('[StatusMonitor] DISCORD_WEBHOOK_URL manquant (voir .env.example)');
    process.exit(1);
}

async function loadState() {
    try {
        return JSON.parse(await fs.readFile(STATE_FILE, 'utf8'));
    } catch {
        return {};
    }
}

async function saveState(state) {
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

function getGitInfo() {
    const run = (cmd) => execSync(cmd, { cwd: REPO_DIR, stdio: ['ignore', 'pipe', 'ignore'] })
        .toString().trim();
    let branch = 'unknown';
    let version = 'unknown';
    try { branch = run('git rev-parse --abbrev-ref HEAD'); } catch {}
    try { version = run('git describe --tags --always'); } catch {
        try { version = run('git rev-parse --short HEAD'); } catch {}
    }
    return { branch, version };
}

function listPm2() {
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) return reject(err);
            pm2.list((err2, list) => {
                pm2.disconnect();
                if (err2) return reject(err2);
                resolve(list);
            });
        });
    });
}

function buildPayload({ branch, version, services, expoUrl }) {
    const allOk = services.length > 0 && services.every((s) => s.online);
    const color = services.length === 0 ? 0x95a5a6 : allOk ? 0x2ecc71 : 0xe74c3c;

    const statusLines = services.length
        ? services.map((s) => `${s.online ? '🟢' : '🔴'} **${s.name}**`).join('\n')
        : '_Aucun service détecté_';

    return {
        embeds: [
            {
                title: '🛰️ Darwin Notebook — Statut des services',
                color,
                fields: [
                    { name: 'Branch Deploy', value: '`' + branch + '`', inline: true },
                    { name: 'Version', value: '`' + version + '`', inline: true },
                    { name: 'Services', value: statusLines, inline: false },
                    { name: 'Expo', value: '`' + expoUrl + '`', inline: false },
                ],
                image: { url: 'attachment://expo-qr.png' },
                timestamp: new Date().toISOString(),
                footer: { text: 'Mise à jour automatique' },
            },
        ],
    };
}

function buildForm(payload, qrBuffer) {
    const form = new FormData();
    form.append('payload_json', JSON.stringify(payload));
    const blob = new Blob([qrBuffer], { type: 'image/png' });
    form.append('files[0]', blob, 'expo-qr.png');
    return form;
}

async function sendOrEdit(payload, qrBuffer) {
    const state = await loadState();

    if (state.messageId) {
        const res = await fetch(`${WEBHOOK_URL}/messages/${state.messageId}`, {
            method: 'PATCH',
            body: buildForm(payload, qrBuffer),
        });
        if (res.ok) return;
        if (res.status !== 404) {
            console.error('[StatusMonitor] Edit KO', res.status, await res.text());
            return;
        }
        console.warn('[StatusMonitor] Message introuvable, recréation…');
    }

    const res = await fetch(`${WEBHOOK_URL}?wait=true`, {
        method: 'POST',
        body: buildForm(payload, qrBuffer),
    });
    if (!res.ok) {
        console.error('[StatusMonitor] Post KO', res.status, await res.text());
        return;
    }
    const message = await res.json();
    await saveState({ messageId: message.id });
    console.log('[StatusMonitor] Message créé, id =', message.id);
}

async function tick() {
    try {
        const { branch, version } = getGitInfo();
        const list = await listPm2();
        const services = list
            .filter((p) => p.name !== SELF_NAME)
            .map((p) => ({
                name: p.name,
                online: p.pm2_env && p.pm2_env.status === 'online',
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const expoUrl = `exp://${EXPO_HOST}:${EXPO_PORT}`;
        const qrBuffer = await QRCode.toBuffer(expoUrl, { width: 320, margin: 1 });

        const payload = buildPayload({ branch, version, services, expoUrl });
        await sendOrEdit(payload, qrBuffer);
    } catch (err) {
        console.error('[StatusMonitor] Erreur tick:', err);
    }
}

(async () => {
    console.log(`[StatusMonitor] Démarré — intervalle ${POLL_INTERVAL_MS} ms`);
    await tick();
    setInterval(tick, POLL_INTERVAL_MS);
})();
