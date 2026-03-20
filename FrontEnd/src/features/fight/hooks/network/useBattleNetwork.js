
import { useEffect, useState } from 'react';
import socketService from '@/services/SocketService';


export const useBattleNetwork = (onBattleStart, onGameUpdate) => {
    const [stats, setStats] = useState({ hp: 100, maxHp: 100, opHp: 100, opMaxHp: 100 });
    const [turn, setTurn] = useState(null);
    const [result, setResult] = useState(null);

    useEffect(() => {
        // Connexion initiale
        socketService.connect();

        // 1. Écoute du Matchmaking
        socketService.on('waitingForMatch', () => {
            console.log('[BattleNetwork] In queue, waiting for opponent...');
        });

        let readyInterval;

        socketService.on('matchFound', (data) => {
            console.log('[BattleNetwork] Match Found! Room:', data.roomId);
            
            // Envoi immédiat
            socketService.emit('playerReady');
            
            // FRONTEND WORKAROUND : on renvoie 'playerReady' régulièrement. 
            // Pourquoi ? Car si les 2 téléphones envoient le signal à la milliseconde près,
            // le backend (Redis) risque d'écrire en même temps et de bloquer le compteur à 1.
            // On renvoie jusqu'à ce que le serveur nous confirme que le combat a commencé.
            readyInterval = setInterval(() => {
                socketService.emit('playerReady');
            }, 800);
        });

        // 2. Écoute du début de combat (Matchmaking terminé)
        socketService.on('battleStart', (data) => {
            if (readyInterval) clearInterval(readyInterval);
            console.log('[BattleNetwork] Battle Starting! Turn:', data.turn);
            setTurn(data.turn);
            if (onBattleStart) onBattleStart(data);
        });

        // 2. Écoute des mises à jour (Dégâts, Actions)
        socketService.on('gameUpdate', (update) => {
            console.log('[BattleNetwork] Game Update Received');

            // On peut extraire les HPs de l'objet players renvoyé par ton backend
            const myId = socketService.socket?.id;
            const opId = Object.keys(update.players).find(id => id !== myId);

            if (myId && update.players[myId]) {
                const me = update.players[myId];
                const op = update.players[opId];

                setStats({
                    hp: me.hp,
                    maxHp: me.maxHp || 100,
                    opHp: op?.hp || 0,
                    opMaxHp: op?.maxHp || 100
                });

                setTurn(update.turn);

                if (update.result) {
                    setResult(update.result);
                }

                if (onGameUpdate) onGameUpdate(update);
            }
        });

        // 3. Gestion des déconnexions
        socketService.on('playerDisconnected', () => {
            console.log('[BattleNetwork] Opponent disconnected');
            // Gérer l'UI de victoire par forfait par exemple
        });

        return () => {
            socketService.off('battleStart');
            socketService.off('gameUpdate');
            socketService.off('playerDisconnected');
        };
    }, []);

    // ACTIONS À ENVOYER AU SERVEUR
    const findMatch = () => {
        console.log('[BattleNetwork] Looking for a match...');
        socketService.emit('findMatch');
    };

    const sendReady = () => {
        console.log('[BattleNetwork] Sending playerReady...');
        socketService.emit('playerReady');
    };

    const sendAction = (action) => {
        // action: 'ATTACK' | 'DEFEND' | 'HEAL'
        console.log(`[BattleNetwork] Sending Action: ${action}`);
        socketService.emit('playerAction', { action });
    };

    return {
        stats,
        turn,
        result,
        isMyTurn: turn === socketService.socket?.id,
        findMatch, // Ajout du retour
        sendReady,
        sendAction
    };
};
