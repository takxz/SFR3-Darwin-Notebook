const battleHandler = require('../../main/handlers/battleHandler');
const { store } = require('../../main/store/redisStore');
const db = require('../../main/config/db');

// Mocks
jest.mock('../../main/store/redisStore', () => ({
    store: {
        getPlayer: jest.fn(),
        getBattle: jest.fn(),
        updateBattle: jest.fn(),
        deleteBattle: jest.fn(),
        updatePlayerBattle: jest.fn(),
        client: {
            hset: jest.fn()
        }
    }
}));

jest.mock('../../main/config/db', () => ({
    query: jest.fn()
}));

describe('Reward System Functional Test', () => {
    let io, socket;
    let playerActionHandler;

    const winnerId = 'player-winner-id';
    const loserId = 'player-loser-id';
    const winnerCreatureUUID = '88888888-4444-4444-4444-121212121212';
    const loserCreatureUUID = '99999999-4444-4444-4444-131313131313';
    const winnerPlayerUUID = '55555555-1111-1111-1111-202020202020';
    const roomId = 'room-test-rewards';

    beforeEach(() => {
        io = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            in: jest.fn().mockReturnThis(),
            socketsJoin: jest.fn()
        };
        socket = {
            id: winnerId,
            on: jest.fn(),
            emit: jest.fn()
        };

        battleHandler(io, socket);
        // On récupère le handler de l'événement 'playerAction'
        const actionCall = socket.on.mock.calls.find(call => call[0] === 'playerAction');
        if (!actionCall) {
            throw new Error("L'événement 'playerAction' n'a pas été enregistré par le handler.");
        }
        playerActionHandler = actionCall[1];

        jest.clearAllMocks();
    });

    test('should attribute rewards correctly when a player wins', async () => {
        // 1. Setup Battle State : le vainqueur va achever l'adversaire (5 HP)
        const battleState = {
            roomId: roomId,
            players: {
                [winnerId]: { hp: 100, maxHp: 100, inventory: { potion: 3 }, action: 'IDLE', creatureId: winnerCreatureUUID, playerId: winnerPlayerUUID },
                [loserId]: { hp: 5, maxHp: 100, inventory: { potion: 3 }, action: 'IDLE', creatureId: loserCreatureUUID, playerId: 'loser-player-uuid' }
            },
            turn: winnerId,
            logs: ["Combat en cours..."]
        };

        store.getPlayer.mockResolvedValue({ inBattle: roomId });
        store.getBattle.mockResolvedValue(battleState);
        
        // Mock des réponses DB
        // 1ère requête : Insertion FIGHT (Historique)
        db.query.mockResolvedValueOnce({ rows: [] });
        
        // 2ème requête : MàJ CREATURE et récupération du player_id
        db.query.mockResolvedValueOnce({
            rows: [{ player_id: winnerPlayerUUID }]
        });
        
        // 2ème requête : MàJ PLAYER (bioTokens et XP)
        db.query.mockResolvedValueOnce({ rows: [] });

        // 2. Action du joueur (Attaque fatale)
        await playerActionHandler({ action: 'ATTACK' });

        // 3. Vérifications
        
        // A. Vérification de l'update de la créature (Expérience)
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE "CREATURE"'),
            expect.arrayContaining([50, winnerCreatureUUID])
        );

        // B. Vérification de l'update du joueur (XP et BioTokens avec CAST)
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE "PLAYER"'),
            expect.arrayContaining([50, 10, winnerPlayerUUID])
        );
        
        const playerQuery = db.query.mock.calls.find(call => call[call.length - 1] === winnerPlayerUUID || call[0].includes('UPDATE "PLAYER"'))[0];
        expect(playerQuery).toContain('CAST(');
        expect(playerQuery).toContain('bio_token');
        expect(playerQuery).toContain('::int');

        // C. Vérification de l'émission Socket.io REWARD_GRANTED
        // Note: io.to().emit()
        expect(io.to).toHaveBeenCalledWith(winnerId);
        expect(io.emit).toHaveBeenCalledWith('REWARD_GRANTED', {
            xp: 50,
            bioTokens: 10
        });

        // D. Vérification du nettoyage Redis
        expect(store.deleteBattle).toHaveBeenCalledWith(roomId);
        expect(store.updatePlayerBattle).toHaveBeenCalledWith(winnerId, 'false');
        expect(store.updatePlayerBattle).toHaveBeenCalledWith(loserId, 'false');
    });

    test('should log error when database update fails', async () => {
        const battleState = {
            roomId: roomId,
            players: {
                [winnerId]: { hp: 100, maxHp: 100, inventory: { potion: 3 }, action: 'IDLE', creatureId: winnerCreatureUUID, playerId: winnerPlayerUUID },
                [loserId]: { hp: 5, maxHp: 100, inventory: { potion: 3 }, action: 'IDLE', creatureId: loserCreatureUUID, playerId: 'loser-player-uuid' }
            },
            turn: winnerId,
            logs: []
        };

        store.getPlayer.mockResolvedValue({ inBattle: roomId });
        store.getBattle.mockResolvedValue(battleState);
        
        // On simule une erreur de connexion DB
        db.query.mockRejectedValue(new Error("Connexion perdue"));
        
        // On mock console.error pour vérifier l'appel
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await playerActionHandler({ action: 'ATTACK' });

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining("❌ Erreur SQL"),
            expect.stringContaining("Connexion perdue")
        );

        consoleSpy.mockRestore();
    });
});
