const io = require('socket.io-client');

const URL = 'http://localhost:3000'; // Change IP if running from another machine
const CLIENTS_ONLINE = 1000; // Users just sitting in lobby
const CLIENTS_BATTLE = 1000; // Users looking for fight

console.log(`🚀 Starting Load Test on ${URL}`);
console.log(`Targets: ${CLIENTS_ONLINE} Online | ${CLIENTS_BATTLE} Fighters`);

const clients = [];

// 1. Spawining Online Users (Lobby)
for (let i = 0; i < CLIENTS_ONLINE; i++) {
    const socket = io(URL, {
        transports: ['websocket'], // Force websocket to avoid polling spam
        forceNew: true
    });
    clients.push(socket);
}

// 2. Spawning Fighters
for (let i = 0; i < CLIENTS_BATTLE; i++) {
    setTimeout(() => {
        const socket = io(URL, {
            transports: ['websocket'],
            forceNew: true
        });
        clients.push(socket);

        socket.on('connect', () => {
            // Request matchmaking immediately
            socket.emit('findMatch');
        });

        socket.on('matchFound', (data) => {
            // Simulate loading time then ready up
            setTimeout(() => {
                socket.emit('playerReady');
            }, Math.random() * 2000 + 500);
        });

        socket.on('battleStart', () => {
            // Start random actions
            startBotLogic(socket);
        });

    }, i * 10); // Stagger connections slightly (10ms delay between each) to prevent instant crash
}


function startBotLogic(socket) {
    setInterval(() => {
        if (!socket.connected) return;

        const actions = ['ATTACK', 'DEFEND', 'HEAL'];
        const action = actions[Math.floor(Math.random() * actions.length)];

        socket.emit('playerAction', { action });
    }, 2000 + Math.random() * 1000); // Action every 2-3s
}

// Stats Logger
setInterval(() => {
    const connected = clients.filter(c => c.connected).length;
    console.log(`[Stats] Connected: ${connected} / ${CLIENTS_ONLINE + CLIENTS_BATTLE}`);
}, 5000);
