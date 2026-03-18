// CONFIGURATION
const CONFIG = {
    // URL du serveur Expo (ex: exp://votre-ip:8081)
    // Laissez vide pour détecter l'host actuel automatiquement
    expoUrl: "", 
    defaultPort: 8081
};

function generateQR() {
    const canvas = document.getElementById('qrcode');
    let url = CONFIG.expoUrl;

    // Auto-détection si vide
    if (!url) {
        // Si accédé via IP ou Domain, on utilise exp://...
        const hostname = window.location.hostname;
        url = `exp://${hostname}:${CONFIG.defaultPort}`;
    }

    QRCode.toCanvas(canvas, url, {
        width: 280,
        margin: 0,
        color: {
            dark: '#020617',
            light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
    }, function (error) {
        if (error) {
            console.error('Erreur génération QR:', error);
            alert("Impossible de générer le QR Code.");
        } else {
            console.log('QR code généré pour:', url);
        }
    });
}

// Mise à jour de la date
const updateDate = () => {
    const now = new Date();
    document.getElementById('last-update').textContent = now.toLocaleString('fr-FR', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
};

updateDate();
generateQR();
