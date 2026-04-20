// Temporaire, à remplacer par la route API réelle une fois celle-ci en place
const mockAnimals = [
  {
    id: 'red-fox',
    name: 'Renard roux',
    scientificName: 'Vulpes vulpes',
    type: 'terrestrial',
    category: 'fauna',
    weight: '4-10 kg',
    lifespan: '3-6 ans',
    plantLink: 'Baies des forets',
    rarity: 2,
    hp: 68,
    maxHp: 100,
    atk: 39,
    def: 22,
    spd: 68,
    image: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&fit=crop',
  },
  {
    id: 'great-white-shark',
    name: 'Grand requin blanc',
    scientificName: 'Carcharodon carcharias',
    type: 'marine',
    category: 'fauna',
    weight: '680-1100 kg',
    lifespan: '30-40 ans',
    plantLink: 'Forets de kelp',
    rarity: 4,
    hp: 210,
    maxHp: 300,
    atk: 72,
    def: 46,
    spd: 61,
    image: 'https://images.unsplash.com/photo-1560275619-4cc5fa59d3ae?w=400&fit=crop',
  },
  {
    id: 'bald-eagle',
    name: 'Pygargue a tete blanche',
    scientificName: 'Haliaeetus leucocephalus',
    type: 'flying',
    category: 'fauna',
    weight: '3-6.3 kg',
    lifespan: '20-30 ans',
    plantLink: 'Bosquets de pins',
    rarity: 3,
    hp: 90,
    maxHp: 120,
    atk: 51,
    def: 31,
    spd: 74,
    image: 'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=400&fit=crop',
  },
  {
    id: 'snow-leopard',
    name: 'Leopard des neiges',
    scientificName: 'Panthera uncia',
    type: 'terrestrial',
    category: 'fauna',
    weight: '27-55 kg',
    lifespan: '15-18 ans',
    plantLink: 'Arbustes alpins',
    rarity: 5,
    hp: 145,
    maxHp: 180,
    atk: 66,
    def: 44,
    spd: 70,
    image: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=400&fit=crop',
  },
  {
    id: 'barn-owl',
    name: 'Chouette effraie',
    scientificName: 'Tyto alba',
    type: 'flying',
    category: 'fauna',
    weight: '0.4-0.7 kg',
    lifespan: '4-10 ans',
    plantLink: 'Graines de prairie',
    rarity: 3,
    hp: 55,
    maxHp: 80,
    atk: 38,
    def: 19,
    spd: 76,
    image: 'https://base-prod.rspb-prod.magnolia-platform.com/.imaging/focalpoint/_WIDTH_x_HEIGHT_/dam/jcr:2bf52d08-2eb9-4c24-b0d2-2e2c076bc48d/374227486-Species-Barn-owl-in-flight-before-attack-clean-background.jpg',
  },
  {
    id: 'clownfish',
    name: 'Poisson-clown',
    scientificName: 'Amphiprioninae',
    type: 'marine',
    category: 'fauna',
    weight: '0.25-0.5 kg',
    lifespan: '6-10 ans',
    plantLink: 'Anemones marines',
    rarity: 2,
    hp: 30,
    maxHp: 50,
    atk: 24,
    def: 14,
    spd: 52,
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&fit=crop',
  },
  {
    id: 'peregrine-falcon',
    name: 'Faucon pelerin',
    scientificName: 'Falco peregrinus',
    type: 'flying',
    category: 'fauna',
    weight: '0.7-1.5 kg',
    lifespan: '13-20 ans',
    plantLinkId: 'royal-fern',
    rarity: 4,
    hp: 75,
    maxHp: 100,
    atk: 57,
    def: 29,
    spd: 92,
    image: 'https://i.natgeofe.com/k/68424626-f7d0-4275-8d50-0450b5800563/peregrine-falcon-wings-extended_4x3.jpg',
  },
  {
    id: 'giant-panda',
    name: 'Panda geant',
    scientificName: 'Ailuropoda melanoleuca',
    type: 'terrestrial',
    category: 'fauna',
    weight: '70-120 kg',
    lifespan: '20-30 ans',
    plantLinkId: 'blue-agave',
    rarity: 5,
    hp: 200,
    maxHp: 200,
    atk: 48,
    def: 58,
    spd: 34,
    image: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&fit=crop',
  },
  {
    id: 'royal-fern',
    name: 'Fougere royale',
    scientificName: 'Osmunda regalis',
    type: 'flora',
    category: 'flora',
    rarity: 2,
    effects: [
      'Acceleration de la recuperation (+8% HP/tour)',
      'Resistance au vent (+10% DEF)',
    ],
    image: 'https://newfs.s3.amazonaws.com/taxon-images-1000s1000/Osmundaceae/osmunda-regalis-le-mlovit.jpg',
  },
  {
    id: 'blue-agave',
    name: 'Agave bleu',
    scientificName: 'Agave tequilana',
    type: 'flora',
    category: 'flora',
    rarity: 4,
    effects: [
      'Boost de puissance (+12% ATQ)',
      'Peau epineuse (retour de degats 6%)',
    ],
    image: 'https://www.ranchotissue.com/wp-content/uploads/2024/01/Agave-tequiliana-blue-1.jpg',
  },
];

export async function fetchCollection() {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return mockAnimals;
}

export function getCollectionAnimalDetailsById(id) {
  return mockAnimals.find((animal) => animal.id === id);
}

export function getCollectionPlants() {
  return mockAnimals.filter((animal) => animal.category === 'flora');
}

export function linkPlantToAnimal(animalId, plantId) {
  const animal = getCollectionAnimalDetailsById(animalId);
  const plant = getCollectionAnimalDetailsById(plantId);

  if (!animal || !plant || plant.category !== 'flora') {
    return false;
  }

  animal.plantLinkId = plant.id;
  return true;
}

export function unlinkPlantFromAnimal(animalId) {
  const animal = getCollectionAnimalDetailsById(animalId);

  if (!animal) {
    return false;
  }

  animal.plantLinkId = undefined;
  return true;
}

export function getAnimalLinkedToPlant(plantId) {
  return mockAnimals.find(
    (animal) => animal.category === 'fauna' && animal.plantLinkId === plantId,
  );
}

/**
 * Parses plant effects to extract stat modifiers
 * Expected format: "+X% STAT" where STAT is one of: HP, ATQ, DEF, SPD
 * Returns an object with stat modifiers
 */
function parsePlantEffects(plant) {
  if (!plant || !plant.effects || !Array.isArray(plant.effects)) {
    return {};
  }

  const modifiers = {};
  
  plant.effects.forEach((effect) => {
    // Match patterns like "+8% HP/tour", "+12% ATQ", "+10% DEF"
    // The regex allows for extra text after the stat name
    const match = effect.match(/\+(\d+)%\s+(hp|atq|def|spd)(?:\W|$)/i);
    if (match) {
      const percentage = parseInt(match[1]);
      const stat = match[2].toUpperCase();
      
      // Map stat names to animal stat keys
      const statMap = {
        'HP': 'hp',
        'ATQ': 'atk',
        'DEF': 'def',
        'SPD': 'spd',
      };
      
      modifiers[statMap[stat]] = percentage;
    }
  });

  return modifiers;
}

/**
 * Calculates the modified stats of an animal after applying plant effects
 * Returns a new object with the calculated stats
 */
export function getAnimalStatsWithPlantEffects(animal) {
  if (!animal.plantLinkId) {
    // No plant linked, return base stats
    return {
      hp: animal.hp,
      maxHp: animal.maxHp,
      atk: animal.atk,
      def: animal.def,
      spd: animal.spd,
    };
  }

  const plant = getCollectionAnimalDetailsById(animal.plantLinkId);
  if (!plant) {
    return {
      hp: animal.hp,
      maxHp: animal.maxHp,
      atk: animal.atk,
      def: animal.def,
      spd: animal.spd,
    };
  }

  const modifiers = parsePlantEffects(plant);
  
  return {
    hp: animal.hp + Math.floor(animal.hp * (modifiers.hp || 0) / 100),
    maxHp: animal.maxHp + Math.floor(animal.maxHp * (modifiers.hp || 0) / 100),
    atk: animal.atk + Math.floor(animal.atk * (modifiers.atk || 0) / 100),
    def: animal.def + Math.floor(animal.def * (modifiers.def || 0) / 100),
    spd: animal.spd + Math.floor(animal.spd * (modifiers.spd || 0) / 100),
  };
}
