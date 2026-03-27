const os = require('os');
const { spawn, execSync } = require('child_process');

// 1. Détection de l'IP Locale (pour info)
const nets = os.networkInterfaces();
let localIp = 'localhost';
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal && !name.includes('vEthernet') && !name.includes('WSL')) {
            localIp = net.address;
        }
    }
}

console.log(`\n📡 [DIAGNOSTIC RÉSEAU] Votre IP locale actuelle est : ${localIp}`);
console.log(`⚠️  Vérifiez que votre fichier FrontEnd/.env pointe bien vers cette adresse !`);

// 2. Lancement de l'Infrastructure (Docker)
console.log(`\n🏗️  [INFRASTRUCTURE] Démarrage de PostgreSQL et Redis...`);
try {
    execSync('docker-compose up -d', { stdio: 'inherit' });
} catch (e) {
    console.log(`⚠️ ERREUR: Impossible de lancer Docker. est-il ouvert ?\n`);
    process.exit(1);
}

// 3. Lien Expo
console.log(`\n======================================================`);
console.log(`📱 [EXPO GO] URL d'accès direct pour le téléphone :`);
console.log(`👉 exp://${localIp}:8081`);
console.log(`======================================================\n`);

// 4. Lancement des serveurs
const command = process.argv.includes('--local') ? 'dev:local' : 'dev';
console.log(`🚀 [LANCEMENT] Allumage des moteurs via la commande : npm run ${command}...`);
spawn('npm', ['run', command], { stdio: 'inherit', shell: true });