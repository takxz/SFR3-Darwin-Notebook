process.env.DISCORD_WEBHOOK_URL = 'https://discord.example/api/webhooks/123/abc';
process.env.EXPO_HOST = '10.0.0.1';
process.env.EXPO_PORT = '8081';
process.env.SELF_SERVICE_NAME = 'darwin-status-monitor';
process.env.STATUS_POLL_INTERVAL_MS = '60000';

jest.mock('pm2', () => ({
    connect: jest.fn((cb) => cb(null)),
    disconnect: jest.fn(),
    list: jest.fn((cb) => cb(null, [])),
}));

jest.mock('qrcode', () => ({
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-qr-png')),
}));

const monitor = require('../monitor');

describe('formatUptime', () => {
    it('renvoie "—" pour 0, null ou valeur négative', () => {
        expect(monitor.formatUptime(0)).toBe('—');
        expect(monitor.formatUptime(null)).toBe('—');
        expect(monitor.formatUptime(undefined)).toBe('—');
        expect(monitor.formatUptime(-1000)).toBe('—');
    });

    it('affiche des secondes si < 1 minute', () => {
        expect(monitor.formatUptime(5_000)).toBe('5s');
        expect(monitor.formatUptime(59_999)).toBe('59s');
    });

    it('affiche uniquement des minutes si < 1 heure', () => {
        expect(monitor.formatUptime(60_000)).toBe('1m');
        expect(monitor.formatUptime(3_599_000)).toBe('59m');
    });

    it('affiche heures et minutes si < 1 jour', () => {
        expect(monitor.formatUptime(3_661_000)).toBe('1h 1m');
        expect(monitor.formatUptime(7_200_000)).toBe('2h 0m');
    });

    it('affiche jours et heures au-delà', () => {
        expect(monitor.formatUptime(90_061_000)).toBe('1d 1h');
        expect(monitor.formatUptime(2 * 86_400_000)).toBe('2d 0h');
    });
});

describe('progressBar', () => {
    it('rend une barre pleine quand ratio = 1', () => {
        expect(monitor.progressBar(1, 10)).toBe('██████████');
    });

    it('rend une barre vide quand ratio = 0', () => {
        expect(monitor.progressBar(0, 10)).toBe('░░░░░░░░░░');
    });

    it('rend une barre partielle pour ratio = 0.5', () => {
        expect(monitor.progressBar(0.5, 10)).toBe('█████░░░░░');
    });

    it('respecte une largeur par défaut de 12', () => {
        const bar = monitor.progressBar(1);
        expect(bar).toHaveLength(12);
    });

    it('arrondit le ratio au caractère le plus proche', () => {
        expect(monitor.progressBar(0.24, 10)).toBe('██░░░░░░░░');
        expect(monitor.progressBar(0.25, 10)).toBe('███░░░░░░░');
    });
});

describe('buildEmbed', () => {
    const base = {
        branch: 'develop',
        version: 'v1.2.3',
        expoUrl: 'exp://10.0.0.1:8081',
    };

    it('utilise la couleur verte et ✅ quand tous les services sont en ligne', () => {
        const embed = monitor.buildEmbed({
            ...base,
            services: [
                { name: 'api', online: true, uptime: 60_000 },
                { name: 'web', online: true, uptime: 120_000 },
            ],
        });
        expect(embed.color).toBe(0x57f287);
        expect(embed.description).toContain('✅');
        expect(embed.description).toContain('2/2');
    });

    it('utilise la couleur rouge et ⛔ quand tous les services sont offline', () => {
        const embed = monitor.buildEmbed({
            ...base,
            services: [
                { name: 'api', online: false },
                { name: 'web', online: false },
            ],
        });
        expect(embed.color).toBe(0xed4245);
        expect(embed.description).toContain('⛔');
        expect(embed.description).toContain('0/2');
    });

    it('utilise la couleur jaune et ⚠️ en cas d\'état mixte', () => {
        const embed = monitor.buildEmbed({
            ...base,
            services: [
                { name: 'api', online: true, uptime: 1000 },
                { name: 'web', online: false },
            ],
        });
        expect(embed.color).toBe(0xfee75c);
        expect(embed.description).toContain('⚠️');
        expect(embed.description).toContain('1/2');
    });

    it('utilise la couleur idle grise si la liste de services est vide', () => {
        const embed = monitor.buildEmbed({ ...base, services: [] });
        expect(embed.color).toBe(0x99aab5);
        expect(embed.description).toMatch(/Aucun service/);
    });

    it('inclut la branche et la version dans les champs inline', () => {
        const embed = monitor.buildEmbed({ ...base, services: [] });
        const branchField = embed.fields.find((f) => f.name.includes('Branch'));
        const versionField = embed.fields.find((f) => f.name.includes('Version'));
        expect(branchField.value).toContain('develop');
        expect(branchField.inline).toBe(true);
        expect(versionField.value).toContain('v1.2.3');
        expect(versionField.inline).toBe(true);
    });

    it('rend 🟢 pour les services en ligne et 🔴 pour les services offline', () => {
        const embed = monitor.buildEmbed({
            ...base,
            services: [
                { name: 'api', online: true, uptime: 60_000 },
                { name: 'web', online: false },
            ],
        });
        const servicesField = embed.fields.find((f) => f.name.includes('Services'));
        expect(servicesField.value).toContain('🟢');
        expect(servicesField.value).toContain('api');
        expect(servicesField.value).toContain('🔴');
        expect(servicesField.value).toContain('web');
        expect(servicesField.value).toContain('offline');
    });

    it('inclut l\'URL Expo dans le champ dédié', () => {
        const embed = monitor.buildEmbed({ ...base, services: [] });
        const expoField = embed.fields.find((f) => f.name.includes('Expo'));
        expect(expoField.value).toContain('exp://10.0.0.1:8081');
    });

    it('définit image.url quand qrImageUrl est fourni', () => {
        const embed = monitor.buildEmbed({
            ...base,
            services: [],
            qrImageUrl: 'https://cdn.example/qr.png',
        });
        expect(embed.image).toEqual({ url: 'https://cdn.example/qr.png' });
    });

    it('omet le champ image quand qrImageUrl est absent', () => {
        const embed = monitor.buildEmbed({ ...base, services: [] });
        expect(embed.image).toBeUndefined();
    });

    it('renseigne un auteur, un titre, un footer et un timestamp', () => {
        const embed = monitor.buildEmbed({ ...base, services: [] });
        expect(embed.author).toBeDefined();
        expect(embed.author.name).toMatch(/Darwin Notebook/);
        expect(embed.title).toMatch(/Statut des services/);
        expect(embed.footer.text).toBeDefined();
        expect(typeof embed.timestamp).toBe('string');
    });
});

describe('uploadMessage', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        delete global.fetch;
        console.error.mockRestore();
        console.log.mockRestore();
    });

    it('POST un nouveau message et retourne messageId + qrUrl', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                id: 'msg-42',
                attachments: [{ url: 'https://cdn.example/qr.png' }],
            }),
        });

        const embed = { title: 'test' };
        const res = await monitor.uploadMessage(embed, Buffer.from('qr'), null);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, opts] = global.fetch.mock.calls[0];
        expect(url).toContain('?wait=true');
        expect(opts.method).toBe('POST');
        expect(res).toEqual({ messageId: 'msg-42', qrUrl: 'https://cdn.example/qr.png' });
        // L'embed est muté pour référencer la pièce jointe
        expect(embed.image).toEqual({ url: 'attachment://expo-qr.png' });
    });

    it('PATCH un message existant et retourne la nouvelle URL du QR', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                id: 'msg-42',
                attachments: [{ url: 'https://cdn.example/qr2.png' }],
            }),
        });

        const res = await monitor.uploadMessage({}, Buffer.from('qr'), 'msg-42');

        const [url, opts] = global.fetch.mock.calls[0];
        expect(url).toMatch(/\/messages\/msg-42$/);
        expect(opts.method).toBe('PATCH');
        expect(res.qrUrl).toBe('https://cdn.example/qr2.png');
    });

    it('retourne { missing: true } si le PATCH répond 404', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 404,
            text: async () => 'not found',
        });

        const res = await monitor.uploadMessage({}, Buffer.from('qr'), 'msg-gone');
        expect(res).toEqual({ missing: true });
    });

    it('retourne null et log une erreur en cas d\'échec non-404', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => 'boom',
        });

        const res = await monitor.uploadMessage({}, Buffer.from('qr'), null);
        expect(res).toBeNull();
        expect(console.error).toHaveBeenCalled();
    });

    it('retourne qrUrl = null si Discord ne renvoie aucune attachment', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ id: 'msg-3' }),
        });

        const res = await monitor.uploadMessage({}, Buffer.from('qr'), null);
        expect(res).toEqual({ messageId: 'msg-3', qrUrl: null });
    });

    it('envoie attachments: [] dans le payload lors d\'un remplacement', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ id: 'msg-42', attachments: [{ url: 'x' }] }),
        });

        await monitor.uploadMessage({}, Buffer.from('qr'), 'msg-42');

        const form = global.fetch.mock.calls[0][1].body;
        expect(form).toBeInstanceOf(FormData);
        const payloadJson = form.get('payload_json');
        expect(JSON.parse(payloadJson).attachments).toEqual([]);
    });
});

describe('editMessageJson', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        delete global.fetch;
        console.error.mockRestore();
    });

    it('retourne "ok" sur réponse 2xx, envoie du JSON pur (pas de FormData)', async () => {
        global.fetch.mockResolvedValue({ ok: true, status: 200 });

        const res = await monitor.editMessageJson('m-1', { title: 'hello' });

        expect(res).toBe('ok');
        const [url, opts] = global.fetch.mock.calls[0];
        expect(url).toMatch(/\/messages\/m-1$/);
        expect(opts.method).toBe('PATCH');
        expect(opts.headers['Content-Type']).toBe('application/json');
        expect(JSON.parse(opts.body)).toEqual({ embeds: [{ title: 'hello' }] });
    });

    it('retourne "missing" sur 404', async () => {
        global.fetch.mockResolvedValue({ ok: false, status: 404, text: async () => '' });
        const res = await monitor.editMessageJson('m-1', {});
        expect(res).toBe('missing');
    });

    it('retourne "error" et log sur autre erreur HTTP', async () => {
        global.fetch.mockResolvedValue({ ok: false, status: 500, text: async () => 'oops' });
        const res = await monitor.editMessageJson('m-1', {});
        expect(res).toBe('error');
        expect(console.error).toHaveBeenCalled();
    });
});

describe('loadState / saveState', () => {
    const fs = require('fs/promises');
    const path = require('path');
    const STATE_FILE = path.join(__dirname, '..', '.state.json');

    afterEach(async () => {
        try { await fs.unlink(STATE_FILE); } catch {}
    });

    it('loadState retourne un objet vide quand le fichier n\'existe pas', async () => {
        try { await fs.unlink(STATE_FILE); } catch {}
        const state = await monitor.loadState();
        expect(state).toEqual({});
    });

    it('saveState persiste et loadState relit la valeur', async () => {
        const payload = { messageId: 'abc', qrUrl: 'https://x', qrPayload: 'exp://y' };
        await monitor.saveState(payload);
        const loaded = await monitor.loadState();
        expect(loaded).toEqual(payload);
    });
});
