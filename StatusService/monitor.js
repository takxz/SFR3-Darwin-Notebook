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

const COLOR_OK = 0x57f287;
const COLOR_WARN = 0xfee75c;
const COLOR_DOWN = 0xed4245;
const COLOR_IDLE = 0x99aab5;

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
    const run = (cmd) =>
        execSync(cmd, { cwd: REPO_DIR, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
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

function formatUptime(ms) {
    if (!ms || ms < 0) return '—';
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
}

function progressBar(ratio, width = 12) {
    const filled = Math.round(ratio * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function buildEmbed({ branch, version, services, expoUrl, qrImageUrl }) {
    const total = services.length;
    const online = services.filter((s) => s.online).length;
    const allOk = total > 0 && online === total;
    const allDown = total > 0 && online === 0;

    let color = COLOR_IDLE;
    let headline = '_Aucun service détecté_';
    if (total > 0) {
        color = allOk ? COLOR_OK : allDown ? COLOR_DOWN : COLOR_WARN;
        const icon = allOk ? '✅' : allDown ? '⛔' : '⚠️';
        const bar = progressBar(online / total);
        headline = `${icon}  **${online}/${total}** services en ligne\n\`${bar}\``;
    }

    const nameWidth = Math.max(0, ...services.map((s) => s.name.length));
    const servicesBlock = services.length
        ? services
              .map((s) => {
                  const dot = s.online ? '🟢' : '🔴';
                  const label = s.name.padEnd(nameWidth, ' ');
                  const uptime = s.online ? formatUptime(s.uptime) : 'offline';
                  return `${dot}  \`${label}\`  •  \`${uptime}\``;
              })
              .join('\n')
        : '_—_';

    const embed = {
        author: { name: 'Darwin Notebook · Deployment Monitor' },
        title: '🛰️  Statut des services',
        description: headline,
        color,
        fields: [
            { name: '🌿  Branch Deploy', value: '```' + branch + '```', inline: true },
            { name: '🏷️  Version', value: '```' + version + '```', inline: true },
            { name: '​', value: '​', inline: true },
            { name: '📦  Services', value: servicesBlock, inline: false },
            {
                name: '📱  Expo Go',
                value: '```' + expoUrl + '```_Scanne le QR code pour te connecter._',
                inline: false,
            },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Auto-refresh · Darwin Notebook' },
    };

    if (qrImageUrl) {
        embed.image = { url: qrImageUrl };
    }
    return embed;
}

async function uploadMessage(embed, qrBuffer, existingId) {
    embed.image = { url: 'attachment://expo-qr.png' };
    const form = new FormData();
    const payload = existingId ? { embeds: [embed], attachments: [] } : { embeds: [embed] };
    form.append('payload_json', JSON.stringify(payload));
    form.append('files[0]', new Blob([qrBuffer], { type: 'image/png' }), 'expo-qr.png');

    const url = existingId ? `${WEBHOOK_URL}/messages/${existingId}` : `${WEBHOOK_URL}?wait=true`;
    const method = existingId ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, body: form });
    if (existingId && res.status === 404) return { missing: true };
    if (!res.ok) {
        console.error(`[StatusMonitor] ${method} KO`, res.status, await res.text());
        return null;
    }
    const message = await res.json();
    const qrUrl = message.attachments?.[0]?.url || null;
    console.log(`[StatusMonitor] ${method === 'POST' ? 'Message créé' : 'QR remplacé'}, id =`, message.id);
    return { messageId: message.id, qrUrl };
}

async function editMessageJson(messageId, embed) {
    const res = await fetch(`${WEBHOOK_URL}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
    });
    if (res.status === 404) return 'missing';
    if (!res.ok) {
        console.error('[StatusMonitor] Edit KO', res.status, await res.text());
        return 'error';
    }
    return 'ok';
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
                uptime: p.pm2_env && p.pm2_env.pm_uptime ? Date.now() - p.pm2_env.pm_uptime : 0,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const expoUrl = `exp://${EXPO_HOST}:${EXPO_PORT}`;
        const state = await loadState();
        const qrNeedsUpload = !state.messageId || !state.qrUrl || state.qrPayload !== expoUrl;

        let messageId = state.messageId || null;

        if (!qrNeedsUpload) {
            const embed = buildEmbed({ branch, version, services, expoUrl, qrImageUrl: state.qrUrl });
            const outcome = await editMessageJson(messageId, embed);
            if (outcome === 'ok' || outcome === 'error') return;
            console.warn('[StatusMonitor] Message introuvable, recréation…');
            messageId = null;
        }

        const qrBuffer = await QRCode.toBuffer(expoUrl, {
            width: 320,
            margin: 1,
            color: { dark: '#1a1a1a', light: '#ffffff' },
        });
        const embed = buildEmbed({ branch, version, services, expoUrl });
        let result = await uploadMessage(embed, qrBuffer, messageId);
        if (result && result.missing) {
            result = await uploadMessage(embed, qrBuffer, null);
        }
        if (result && result.messageId) {
            await saveState({ messageId: result.messageId, qrUrl: result.qrUrl, qrPayload: expoUrl });
        }
    } catch (err) {
        console.error('[StatusMonitor] Erreur tick:', err);
    }
}

(async () => {
    console.log(`[StatusMonitor] Démarré — intervalle ${POLL_INTERVAL_MS} ms`);
    await tick();
    setInterval(tick, POLL_INTERVAL_MS);
})();
