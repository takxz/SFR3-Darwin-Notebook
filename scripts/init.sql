-- =========================================================================
-- 🏗️ 1. CRÉATION DES TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS PLAYER (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    pseudo VARCHAR UNIQUE NOT NULL,
    player_level INT DEFAULT 1,
    xp INT DEFAULT 0,
    bio_token VARCHAR
);

CREATE TABLE IF NOT EXISTS ITEMS (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    effect VARCHAR,
    value INT
);

CREATE TABLE IF NOT EXISTS SPECIES (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    type VARCHAR,
    rarity VARCHAR,
    base_stat_atq INT,
    base_stat_def INT,
    base_stat_pv INT,
    base_stat_speed INT,
    model_3d_url VARCHAR
);

CREATE TABLE IF NOT EXISTS INVENTORY (
    player_id UUID REFERENCES PLAYER(id),
    items_id INT REFERENCES ITEMS(id),
    quantity INT DEFAULT 1,
    PRIMARY KEY (player_id, items_id)
);

CREATE TABLE IF NOT EXISTS CREATURE (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species_id INT REFERENCES SPECIES(id),
    player_id UUID REFERENCES PLAYER(id),
    gamification_name VARCHAR,
    scan_url VARCHAR,
    scan_quality INT,
    gps_location VARCHAR,
    scan_date TIMESTAMP DEFAULT now(),
    creature_level INT DEFAULT 1,
    stat_atq INT,
    stat_def INT,
    stat_pv INT,
    current_pv INT,
    stat_speed INT,
    experience INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS FIGHT (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    played_at TIMESTAMP DEFAULT now(),
    player1_id UUID REFERENCES PLAYER(id),
    player2_id UUID REFERENCES PLAYER(id),
    creature1_id UUID REFERENCES CREATURE(id),
    creature2_id UUID REFERENCES CREATURE(id),
    winner_id UUID REFERENCES PLAYER(id),
    replay_log TEXT
);

-- =========================================================================
-- 💉 2. INJECTION DES DONNÉES DE TEST (Le Mock)
-- =========================================================================

-- Création de 2 Joueurs de test
INSERT INTO PLAYER (id, email, password, pseudo, player_level, xp) VALUES 
('11111111-1111-1111-1111-111111111111', 'test1@efficom.fr', 'password123', 'Sacha_Dev', 5, 1200),
('22222222-2222-2222-2222-222222222222', 'test2@efficom.fr', 'password123', 'Gary_Test', 6, 1500)
ON CONFLICT (email) DO NOTHING;

-- Création des Espèces (Le Pokedex étendu)
INSERT INTO SPECIES (id, name, description, type, rarity, base_stat_atq, base_stat_def, base_stat_pv, base_stat_speed) VALUES 
(1, 'Canidé Urbain', 'Un chien errant muté par les ondes.', 'Normal', 'Commun', 15, 10, 45, 20),
(2, 'Pigeon Blindé', 'Un oiseau recouvert de débris métalliques.', 'Vol/Acier', 'Rare', 25, 30, 40, 35),
(3, 'Félin Toxique', 'Chat des ruelles crachant de l''acide.', 'Poison', 'Épique', 40, 15, 35, 50),
(4, 'Rat d''Égout Mutagène', 'Rongeur géant aux dents d''acier.', 'Ténèbres', 'Commun', 20, 12, 30, 45),
(5, 'Corbeau Drone', 'Oiseau cyborg utilisé pour l''espionnage.', 'Vol/Électrique', 'Rare', 35, 20, 30, 60),
(6, 'Moustique Vampire', 'Insecte gorgé de sang radioactif.', 'Insecte/Poison', 'Commun', 10, 5, 15, 70)
ON CONFLICT (id) DO NOTHING;

-- Création des Objets & Inventaire
INSERT INTO ITEMS (id, name, effect, value) VALUES 
(1, 'Croquette de soin', 'Heal', 20),
(2, 'Seringue d''adrénaline', 'Boost_Atq', 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO INVENTORY (player_id, items_id, quantity) VALUES 
('11111111-1111-1111-1111-111111111111', 1, 15),
('11111111-1111-1111-1111-111111111111', 2, 3),
('22222222-2222-2222-2222-222222222222', 1, 5)
ON CONFLICT (player_id, items_id) DO NOTHING;

-- Apparition des Créatures (La Collection)
INSERT INTO CREATURE (id, species_id, player_id, gamification_name, scan_quality, creature_level, stat_atq, stat_def, stat_pv, current_pv, stat_speed) VALUES 
-- Equipe de Sacha (Player 1) - 5 Créatures
('a1111111-1111-1111-1111-111111111111', 1, '11111111-1111-1111-1111-111111111111', 'Rex le Mutant', 85, 5, 18, 12, 50, 50, 22),
('a2222222-2222-2222-2222-222222222222', 2, '11111111-1111-1111-1111-111111111111', 'Pigeot de Fer', 70, 3, 26, 31, 42, 42, 36),
('a3333333-3333-3333-3333-333333333333', 4, '11111111-1111-1111-1111-111111111111', 'Splinter', 99, 10, 30, 20, 60, 60, 40),
('a4444444-4444-4444-4444-444444444444', 5, '11111111-1111-1111-1111-111111111111', 'Oeil de la ville', 60, 2, 10, 10, 20, 20, 50),
('a5555555-5555-5555-5555-555555555555', 3, '11111111-1111-1111-1111-111111111111', 'Matou Toxique', 88, 7, 42, 16, 38, 38, 52),

-- Equipe de Gary (Player 2) - 4 Créatures
('b1111111-1111-1111-1111-111111111111', 3, '22222222-2222-2222-2222-222222222222', 'Griffe Acide', 92, 6, 45, 18, 40, 40, 55),
('b2222222-2222-2222-2222-222222222222', 6, '22222222-2222-2222-2222-222222222222', 'Vampire Volant', 50, 1, 15, 5, 15, 15, 60),
('b3333333-3333-3333-3333-333333333333', 1, '22222222-2222-2222-2222-222222222222', 'Molosse', 75, 4, 16, 11, 48, 48, 21),
('b4444444-4444-4444-4444-444444444444', 2, '22222222-2222-2222-2222-222222222222', 'Tank à Plumes', 80, 5, 28, 33, 45, 45, 38)
ON CONFLICT (id) DO NOTHING;

-- Historique d'un combat (Sacha vs Gary)
INSERT INTO FIGHT (player1_id, player2_id, creature1_id, creature2_id, winner_id, replay_log) VALUES 
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '{"turns": [{"turn": 1, "action": "Griffe Acide attaque Rex le Mutant pour 15 degats"}]}')
ON CONFLICT DO NOTHING;