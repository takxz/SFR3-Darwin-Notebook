const { store } = require('../store/redisStore');

module.exports = function(io, socket) {
    // 2. Ready Check
    socket.on('playerReady', async () => {
        const player = await store.getPlayer(socket.id);
        const roomId = player?.inBattle;
        if (!roomId || roomId === 'false') return;

        const battle = await store.getBattle(roomId);
        if (!battle) return;

        battle.readyCount = (battle.readyCount || 0) + 1;

        if (battle.readyCount === 2) {
            io.to(roomId).emit('battleStart', {
                turn: battle.turn
            });
            battle.logs.push("Le combat commence !");
        }
        
        // Penser à sauvegarder la stat dans Redis !
        await store.updateBattle(roomId, battle);
    });

    // 3. Battle Actions
    socket.on('playerAction', async (data) => {
        // data: { action: 'ATTACK' | 'DEFEND' | 'HEAL' }
        const player = await store.getPlayer(socket.id);
        const roomId = player?.inBattle;
        if (!roomId || roomId === 'false') return;

        const battle = await store.getBattle(roomId);
        if (!battle) return;

        const opponentId = Object.keys(battle.players).find(id => id !== socket.id);

        if (battle.turn !== socket.id) {
            socket.emit('error', 'Pas votre tour !');
            return;
        }

        // Process Action
        const myState = battle.players[socket.id];
        const opState = battle.players[opponentId];
        let message = "";

        // Reset previous actions visualization
        myState.action = 'IDLE';
        opState.action = 'IDLE';

        // TICK COOLDOWNS
        if (myState.specialCooldown > 0) {
            myState.specialCooldown--;
        }

        const calculateDamage = (attacker, defender, isSpecial) => {
            const hitProb = 0.85 + ((attacker.speed - defender.speed) / 200);
            if (Math.random() > hitProb) return "MISS"; // Dodge

            const atkStat = isSpecial ? attacker.specialAttack : attacker.attack;
            const variance = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
            const dmgBase = atkStat * (atkStat / (atkStat + defender.defense));
            const dmg = Math.round(dmgBase * variance * (isSpecial ? 1.5 : 1.0));
            return dmg;
        };

        if (data.action === 'ATTACK' || data.action === 'SPECIAL') {
            const isSp = data.action === 'SPECIAL';

            if (isSp && myState.specialCooldown > 0) {
                socket.emit('error', 'Special en cooldown !');
                return;
            }

            const dmg = calculateDamage(myState, opState, isSp);

            if (dmg === "MISS") {
                myState.action = 'IDLE'; 
                opState.action = 'DODGE';
                message = `Joueur ${socket.id.substr(0, 4)} rate son attaque !`;
            } else {
                opState.hp = Math.max(0, opState.hp - dmg);
                myState.action = isSp ? 'SPECIAL' : 'ATTACK';
                opState.action = 'HIT';
                message = `Joueur ${socket.id.substr(0, 4)} inflige ${dmg} PV${isSp ? ' (COUP CRITIQUE !)' : ''}`;
                
                if (isSp) {
                    myState.specialCooldown = 3;
                }
            }

        } else if (data.action === 'DEFEND') {
            myState.action = 'IDLE'; 
            message = `Joueur ${socket.id.substr(0, 4)} se défend.`;

        } else if (data.action === 'HEAL') { // Equivalent of 'Passer'
            myState.action = 'IDLE';
            message = `Joueur ${socket.id.substr(0, 4)} a passé son tour.`;
        }

        // Check Win/Loss
        let result = null;
        if (opState.hp <= 0) {
            result = { winner: socket.id, loser: opponentId };
            opState.action = 'DEATH';
        }

        // Switch Turn
        battle.turn = opponentId;
        battle.logs.push(message);
        if (battle.logs.length > 5) battle.logs.shift(); // Keep last 5

        // Broadcast Update à tout le monde
        io.to(roomId).emit('gameUpdate', {
            players: battle.players,
            turn: battle.turn,
            lastLog: message,
            result: result
        });

        if (result) {
            await store.deleteBattle(roomId); // End game
            await store.updatePlayerBattle(socket.id, 'false');
            await store.updatePlayerBattle(opponentId, 'false');
        } else {
            // Sauvegarder le nouvel état si le match continue
            await store.updateBattle(roomId, battle);
        }
    });
};
