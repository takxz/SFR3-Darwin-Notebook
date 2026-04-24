
export const AVAILABLE_MODELS = {
    'alpaca': require('@/assets/fight/models/Alpaca.fbx'),
    'bull': require('@/assets/fight/models/Bull.fbx'),
    'cow': require('@/assets/fight/models/Cow.fbx'),
    'deer': require('@/assets/fight/models/Deer.fbx'),
    'dolphin': require('@/assets/fight/models/Dolphin.fbx'),
    'donkey': require('@/assets/fight/models/Donkey.fbx'),
    'fox': require('@/assets/fight/models/Fox.fbx'),
    'frog': require('@/assets/fight/models/Frog.fbx'),
    'goldfish': require('@/assets/fight/models/Goldfish.fbx'),
    'goose': require('@/assets/fight/models/Goose.fbx'),
    'horse': require('@/assets/fight/models/Horse.fbx'),
    'husky': require('@/assets/fight/models/Husky.fbx'),
    'koi': require('@/assets/fight/models/Koi.fbx'),
    'llama': require('@/assets/fight/models/Llama.fbx'),
    'manta ray': require('@/assets/fight/models/Manta ray.fbx'),
    'pig': require('@/assets/fight/models/Pig.fbx'),
    'puffer': require('@/assets/fight/models/Puffer.fbx'),
    'pug': require('@/assets/fight/models/Pug.fbx'),
    'rat': require('@/assets/fight/models/Rat.fbx'),
    'shark': require('@/assets/fight/models/Shark.fbx'),
    'sheep': require('@/assets/fight/models/Sheep.fbx'),
    'shibainu': require('@/assets/fight/models/ShibaInu.fbx'),
    'spider': require('@/assets/fight/models/Spider.fbx'),
    'wasp': require('@/assets/fight/models/Wasp.fbx'),
    'whale': require('@/assets/fight/models/Whale.fbx'),
    'wolf': require('@/assets/fight/models/Wolf.fbx'),
    'worm': require('@/assets/fight/models/Worm.fbx'),
    'zebra': require('@/assets/fight/models/Zebra.fbx'),
};

export const getModelForCreature = (modelPath, type, latinName) => {
    // 1. Exact Match (if modelPath exists in our list)
    const exactKey = modelPath?.toLowerCase()?.trim();
    if (exactKey && AVAILABLE_MODELS[exactKey]) {
        return AVAILABLE_MODELS[exactKey];
    }

    // 2. Fallbacks based on animal type or latin families
    const typeStr = (type || '').toLowerCase();
    const latinStr = (latinName || '').toLowerCase();

    // Poissons (Fish)
    if (typeStr.includes('poisson') || typeStr.includes('fish') || latinStr.includes('actinopterygii')) {
        return AVAILABLE_MODELS['koi']; // Default fish
    }
    // Requins / Raies
    if (latinStr.includes('selachimorpha') || latinStr.includes('chondrichthyes')) {
        return AVAILABLE_MODELS['shark'];
    }
    // Oiseaux (Birds)
    if (typeStr.includes('oiseau') || typeStr.includes('bird') || latinStr.includes('aves')) {
        return AVAILABLE_MODELS['goose'];
    }
    // Insectes / Arachnides (Bugs)
    if (typeStr.includes('insect') || typeStr.includes('arachnid') || latinStr.includes('arthropoda')) {
        return AVAILABLE_MODELS['spider'];
    }
    // Félins / Canidés (Carnivores)
    if (typeStr.includes('félin') || typeStr.includes('feline') || latinStr.includes('felidae') || typeStr.includes('chat') || typeStr.includes('lion')) {
        return AVAILABLE_MODELS['fox']; // Closest we have visually to a generic carnivore quad
    }
    if (typeStr.includes('chien') || typeStr.includes('canid') || latinStr.includes('canidae') || typeStr.includes('loup')) {
        return AVAILABLE_MODELS['wolf'];
    }
    // Bovins / Cervidés / Equidés (Herbivores)
    if (latinStr.includes('bovidae') || typeStr.includes('vache')) {
        return AVAILABLE_MODELS['cow'];
    }
    if (latinStr.includes('equidae') || typeStr.includes('cheval')) {
        return AVAILABLE_MODELS['horse'];
    }
    if (latinStr.includes('cervidae') || typeStr.includes('cerf')) {
        return AVAILABLE_MODELS['deer'];
    }
    // Animaux marins (Mammifères)
    if (latinStr.includes('cetacea') || typeStr.includes('baleine') || typeStr.includes('dauphin')) {
        return AVAILABLE_MODELS['dolphin'];
    }
    // Amphibiens
    if (typeStr.includes('amphibien') || latinStr.includes('amphibia') || typeStr.includes('grenouille')) {
        return AVAILABLE_MODELS['frog'];
    }
    // Rongeurs
    if (typeStr.includes('rongeur') || latinStr.includes('rodentia')) {
        return AVAILABLE_MODELS['rat'];
    }

    // Default fallback
    return AVAILABLE_MODELS['pig'];
};

export const GLTF_ASSETS = {
    SKYBOX: require('@/assets/models/skybox.glb'),
    ENVIRONMENT: require('@/assets/models/map.glb')
};

export const AUDIO_ASSETS = {
    HITS: [
        require('@/assets/fight/audio/sfx/hits/hit_1.wav'),
        require('@/assets/fight/audio/sfx/hits/hit_2.wav'),
        require('@/assets/fight/audio/sfx/hits/hit_3.wav'),
        require('@/assets/fight/audio/sfx/hits/hit_4.wav'),
    ]
};

