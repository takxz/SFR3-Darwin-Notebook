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
        
        // Mock des réponses DB (9 requêtes au total pour gagnant + perdant)
        // 1. Insertion FIGHT (Historique)
        db.query.mockResolvedValueOnce({ rows: [] });
        
        // --- GAGNANT ---
        // 2. SELECT CREATURE (gagnant)
        db.query.mockResolvedValueOnce({
            rows: [{ 
                experience: 0, creature_level: 1, 
                stat_pv: 100, stat_atq: 20, stat_def: 10, stat_speed: 10
            }]
        });
        // 3. UPDATE CREATURE (gagnant)
        db.query.mockResolvedValueOnce({ rows: [] });
        // 4. SELECT PLAYER (gagnant)
        db.query.mockResolvedValueOnce({ rows: [{ xp: 0, player_level: 1 }] });
        // 5. UPDATE PLAYER (gagnant)
        db.query.mockResolvedValueOnce({ rows: [] });

        // --- PERDANT ---
        // 6. SELECT CREATURE (perdant)
        db.query.mockResolvedValueOnce({
            rows: [{ 
                experience: 0, creature_level: 1, 
                stat_pv: 100, stat_atq: 20, stat_def: 10, stat_speed: 10
            }]
        });
        // 7. UPDATE CREATURE (perdant)
        db.query.mockResolvedValueOnce({ rows: [] });
        // 8. SELECT PLAYER (perdant)
        db.query.mockResolvedValueOnce({ rows: [{ xp: 0, player_level: 1 }] });
        // 9. UPDATE PLAYER (perdant)
        db.query.mockResolvedValueOnce({ rows: [] });

        // 2. Action du joueur (Attaque fatale)
        await playerActionHandler({ action: 'ATTACK' });

        // 3. Vérifications
        
        // A. Vérification de l'update de la créature (Expérience)
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE "CREATURE"'),
            expect.arrayContaining([50, 1, winnerCreatureUUID])
        );

        // B. Vérification de l'update du joueur (XP et BioTokens avec CAST)
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE "PLAYER"'),
            expect.arrayContaining([50, 1, 10, winnerPlayerUUID])
        );
        
        const playerQuery = db.query.mock.calls.find(call => call[call.length - 1] === winnerPlayerUUID || call[0].includes('UPDATE "PLAYER"'))[0];
        expect(playerQuery).toContain('CAST(');
        expect(playerQuery).toContain('bio_token');
        expect(playerQuery).toContain('::int');

        // C. Vérification de l'émission Socket.io REWARD_GRANTED
        // Note: io.to().emit()
        expect(io.to).toHaveBeenCalledWith(winnerId);
        expect(io.emit).toHaveBeenCalledWith('REWARD_GRANTED', expect.objectContaining({
            xp: 50,
            bioTokens: 10,
            creatureId: winnerCreatureUUID,
            isWinner: true,
            creatureLeveledUp: false,
            playerLeveledUp: false
        }));

        // D. Vérification du nettoyage Redis
        expect(store.deleteBattle).toHaveBeenCalledWith(roomId);
        expect(store.updatePlayerBattle).toHaveBeenCalledWith(winnerId, 'false');
        expect(store.updatePlayerBattle).toHaveBeenCalledWith(loserId, 'false');
    });

    test('should handle Level Up correctly for player and creature', async () => {
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

        // Mock DB: Creature has 90 XP (needs 100 for Level 2)
        // Player has 95 XP (needs 100 for Level 2)
        db.query.mockResolvedValueOnce({ rows: [] }); // FIGHT
        
        // WINNER
        db.query.mockResolvedValueOnce({ rows: [{ experience: 90, creature_level: 1, stat_pv: 100, stat_atq: 20, stat_def: 10, stat_speed: 10 }] }); // SEL CREATURE
        db.query.mockResolvedValueOnce({ rowCount: 1 }); // UPD CREATURE
        db.query.mockResolvedValueOnce({ rows: [{ xp: 95, player_level: 1 }] }); // SEL PLAYER
        db.query.mockResolvedValueOnce({ rowCount: 1 }); // UPD PLAYER

        // LOSER
        db.query.mockResolvedValueOnce({ rows: [{ experience: 0, creature_level: 1, stat_pv: 100, stat_atq: 20, stat_def: 10, stat_speed: 10 }] }); // SEL CREATURE
        db.query.mockResolvedValueOnce({ rowCount: 1 }); // UPD CREATURE
        db.query.mockResolvedValueOnce({ rows: [{ xp: 0, player_level: 1 }] }); // SEL PLAYER
        db.query.mockResolvedValueOnce({ rowCount: 1 }); // UPD PLAYER

        await playerActionHandler({ action: 'ATTACK' });

        // Winner gains 50 XP -> both should level up
        expect(io.emit).toHaveBeenCalledWith('REWARD_GRANTED', expect.objectContaining({
            creatureLeveledUp: true,
            playerLeveledUp: true,
            newCLevel: 2,
            newPLevel: 2
        }));

        // Check creature update call (90+50 - 100 = 40 XP, Level 2)
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE "CREATURE"'),
            expect.arrayContaining([40, 2])
        );
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
            expect.stringContaining("Erreur récompenses pour"),
            expect.stringContaining("Connexion perdue")
        );

        consoleSpy.mockRestore();
    });
});
