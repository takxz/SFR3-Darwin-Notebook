import { useEffect, useState } from 'react';
import socketService from '@/services/SocketService';

export const useBattleNetwork = (onBattleStart, onGameUpdate) => {
    const [stats, setStats] = useState({ 
        hp: 100, maxHp: 100, 
        opHp: 100, opMaxHp: 100,
        nickname: 'Hero', opNickname: 'Opponent',
        specialCooldown: 5 // DEFAULT TO 5 NOW
    });
    const [turn, setTurn] = useState(null);
    const [result, setResult] = useState(null);
    // NEW: state for Matchmaking UI tracking
    const [matchStatus, setMatchStatus] = useState('idle'); // idle | searching | found | started

    useEffect(() => {
        // Connexion initiale
        socketService.connect();

        // 1. Écoute du Matchmaking
        socketService.on('waitingForMatch', () => {
            console.log('[BattleNetwork] In queue, waiting for opponent...');
            setMatchStatus('searching');
        });

        let readyInterval;

        const handlePlayersData = (dataPlayers) => {
            if (!dataPlayers) return;
            const myId = socketService.socket?.id;
            const opId = Object.keys(dataPlayers).find(id => id !== myId);
            
            if (myId && dataPlayers[myId]) {
                const me = dataPlayers[myId];
                const op = dataPlayers[opId];
                setStats(prev => ({
                    ...prev,
                    nickname: me.nickname || 'Hero',
                    opNickname: op?.nickname || 'Opponent',
                    specialCooldown: me.specialCooldown !== undefined ? me.specialCooldown : 5
                }));
            }
        };

        socketService.on('matchFound', (data) => {
            console.log('[BattleNetwork] Match Found! Room:', data.roomId);
            setMatchStatus('found');
            
            // On extrait déjà les noms pour l'affichage initial (Intro)
            handlePlayersData(data.players);
        });

        // 2. Écoute du début de combat (Matchmaking terminé)
        socketService.on('battleStart', (data) => {
            if (readyInterval) clearInterval(readyInterval);
            console.log('[BattleNetwork] Battle Starting! Turn:', data.turn);
            setMatchStatus('started');
            
            // Re-extract in case we missed it or ID changed
            handlePlayersData(data.players);
            
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
                    opMaxHp: op?.maxHp || 100,
                    nickname: me.nickname || 'Hero',
                    opNickname: op?.nickname || 'Opponent',
                    specialCooldown: me.specialCooldown !== undefined ? me.specialCooldown : 5
                });

                setTurn(update.turn);

                if (update.result) {
                    setResult(update.result);
                }

                if (onGameUpdate) onGameUpdate(update);
            }
        });

        // 3. Gestion des déconnexions (Si l'adversaire fuit/crash)
        socketService.on('playerDisconnected', () => {
            console.log('[BattleNetwork] Opponent disconnected');
            // Si l'adversaire part, on considère qu'on a gagné par forfait
            setStats(prev => ({ ...prev, opHp: 0 }));
        });

        return () => {
            socketService.off('battleStart');
            socketService.off('gameUpdate');
            socketService.off('playerDisconnected');
            socketService.off('waitingForMatch');
            socketService.off('matchFound');
        };
    }, []);

    // ACTIONS À ENVOYER AU SERVEUR
    const findMatch = (data) => {
        console.log('[BattleNetwork] Looking for a match...', data);
        setMatchStatus('searching');
        socketService.emit('findMatch', data);
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

    const abandon = () => {
        console.log('[BattleNetwork] Abandoning match...');
        setStats(prev => ({ ...prev, hp: 0 })); // Défaite locale immédiate
        socketService.disconnect(); // Le serveur préviendra l'autre joueur via playerDisconnected
    };

    return {
        stats,
        turn,
        result,
        matchStatus, // <--- EXPOSED
        isMyTurn: turn === socketService.socket?.id,
        findMatch,
        sendReady,
        sendAction,
        abandon
    };
};
