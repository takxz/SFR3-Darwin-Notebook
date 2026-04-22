const { io } = require('socket.io-client');

const SOCKET_URL = 'http://127.0.0.1:3001'; // Force IPv4
console.log('--- STARTING DIAGNOSTIC TICKET 1 ---');

const player1 = io(SOCKET_URL, { transports: ['websocket'] });
const player2 = io(SOCKET_URL, { transports: ['websocket'] });

let p1Id = null;
let p2Id = null;

player1.on('connect', () => {
    p1Id = player1.id;
    console.log('[P1] Connected:', p1Id);
    player1.emit('findMatch', { creatureId: 1 });
});

player2.on('connect', () => {
    p2Id = player2.id;
    console.log('[P2] Connected:', p2Id);
    player2.emit('findMatch', { creatureId: 2 });
});

// Quand la room est prête
player1.on('matchFound', () => player1.emit('playerReady'));
player2.on('matchFound', () => player2.emit('playerReady'));

player1.on('battleStart', (data) => {
    console.log('[P1] Battle Started! Turn:', data.turn);
    if(data.turn === p1Id) player1.emit('playerAction', { action: 'ATTACK' });
});

player2.on('battleStart', (data) => {
    console.log('[P2] Battle Started! Turn:', data.turn);
    if(data.turn === p2Id) player2.emit('playerAction', { action: 'ATTACK' });
});

// Dès qu'on reçoit une MAJ de jeu (un coup a été porté)
const handleAction = (playerObj, updateData) => {
    if (updateData.result) {
        console.log(`[BATTLE ENDED] Winner is: ${updateData.result.winner}`);
        return;
    }
    // Si c'est notre tour après la mise à jour, on tape !
    if (updateData.turn === playerObj.id) {
        // Timeout léger pour ne pas flooder
        setTimeout(() => {
            playerObj.emit('playerAction', { action: 'ATTACK' });
        }, 50);
    }
};

player1.on('gameUpdate', (update) => handleAction(player1, update));
player2.on('gameUpdate', (update) => handleAction(player2, update));

// C'EST CE QUE L'ON VEUT VÉRIFIER
player1.on('REWARD_GRANTED', (reward) => {
    console.log('✅ [SUCCESS P1] REWARD RECEIVED:', reward);
    finish();
});
player2.on('REWARD_GRANTED', (reward) => {
    console.log('✅ [SUCCESS P2] REWARD RECEIVED:', reward);
    finish();
});

function finish() {
    console.log('--- TEST FINISHED SUCCESSFULLY ---');
    player1.disconnect();
    player2.disconnect();
    process.exit(0);
}

// Timeout de secours
setTimeout(() => {
    console.log('❌ [TIMEOUT] Test failed to complete quickly.');
    process.exit(1);
}, 12000);
