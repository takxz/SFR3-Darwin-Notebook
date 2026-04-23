import { useEffect, useState, useRef } from 'react';
import socketService from '@/services/SocketService';

export const useBattleNetwork = (onBattleStart, onGameUpdate) => {
    const [stats, setStats] = useState({
        hp: 100, maxHp: 100,
        opHp: 100, opMaxHp: 100,
        nickname: 'Hero', opNickname: 'Opponent',
        specialCooldown: 0,
        isStunned: false,
        action: 'IDLE',
        opAction: 'IDLE'
    });
    const [result, setResult] = useState(null);
    const [matchStatus, setMatchStatus] = useState('idle'); // idle | searching | found | started
    const lastLogRef = useRef('');

    useEffect(() => {
        socketService.connect();

        socketService.on('waitingForMatch', () => {
            console.log('[BattleNetwork] In queue, waiting for opponent...');
            setMatchStatus('searching');
        });

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
                    modelPath: me.modelPath,
                    animalType: me.animalType,
                    latinName: me.latinName,
                    opModelPath: op?.modelPath,
                    opAnimalType: op?.animalType,
                    opLatinName: op?.latinName,
                    specialCooldown: me.specialCooldown !== undefined ? me.specialCooldown : 5
                }));
            }
        };

        socketService.on('matchFound', (data) => {
            console.log('[BattleNetwork] Match Found!');
            setMatchStatus('found');
            handlePlayersData(data.players);
        });

        socketService.on('battleStart', (data) => {
            console.log('[BattleNetwork] Battle Starting!');
            setMatchStatus('started');
            handlePlayersData(data.players);
            if (onBattleStart) onBattleStart(data);
        });

        socketService.on('gameUpdate', (update) => {
            // Log des nouveaux messages de combat uniquement
            if (update.logs && update.logs.length > 0) {
                const latestLog = update.logs[update.logs.length - 1];
                if (latestLog !== lastLogRef.current) {
                    console.log(`[BATTLE] ${latestLog}`);
                    lastLogRef.current = latestLog;
                }
            }

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
                    modelPath: me.modelPath,
                    animalType: me.animalType,
                    latinName: me.latinName,
                    opModelPath: op?.modelPath,
                    opAnimalType: op?.animalType,
                    opLatinName: op?.latinName,
                    specialCharge: me.specialCharge || 0,
                    specialReady: (me.specialCharge || 0) >= 50,
                    isStunned: me.action === 'STUNNED',
                    action: me.action,
                    opAction: op?.action
                });

                setTurn(update.turn);

                if (update.result) {
                    setResult(update.result);
                }

                if (onGameUpdate) onGameUpdate(update);
            }
        });

        socketService.on('playerDisconnected', () => {
            console.log('[BattleNetwork] Opponent disconnected');
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

    const findMatch = (data) => {
        setMatchStatus('searching');
        socketService.emit('findMatch', data);
    };

    const sendReady = () => {
        socketService.emit('playerReady');
    };

    const sendAction = (action) => {
        socketService.emit('playerAction', { action });
    };

    const abandon = () => {
        setStats(prev => ({ ...prev, hp: 0 }));
        socketService.disconnect();
    };

    return {
        stats,
        result,
        matchStatus,
        findMatch,
        sendReady,
        sendAction,
        abandon
    };
};
