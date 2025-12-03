// ===============================
// CORE CONSTANTS
// ===============================
const GRID_SIZE = 10;
const TOTAL_SCREENS = GRID_SIZE * GRID_SIZE;

const DIRECTIONS = {
    UP: [0, -1],
    DOWN: [0, 1],
    LEFT: [-1, 0],
    RIGHT: [1, 0]
};

// ===============================
// DIFFICULTY MULTIPLIERS
// ===============================
const DIFFICULTY_MULTIPLIERS = {
    'Easy': {
        'health': 2,
        'strength': 2,
        'enemyMultipliers': {
            'Goblin': 1,
            'Troll': 1,
            'Orc': 1,
            'Cyclops': 1,
            'Wraith': 0.5,
            'Minotaur': 0.25,
            'Demon': 0.1,
            'Boss': 0.5
        }
    },
    'Medium': {
        'health': 1.5,
        'strength': 1.5,
        'enemyMultipliers': {
            'Goblin': 2,
            'Troll': 1.5,
            'Orc': 1,
            'Cyclops': 1,
            'Wraith': 0.75,
            'Minotaur': 0.5,
            'Demon': 0.25,
            'Boss': 0.75
        }
    },
    'Hard': {
        'health': 1,
        'strength': 1,
        'enemyMultipliers': {
            'Goblin': 1,
            'Troll': 1,
            'Orc': 1,
            'Cyclops': 1,
            'Wraith': 1,
            'Minotaur': 1,
            'Demon': 1,
            'Boss': 1
        }
    },
    'Extreme': {
        'health': 0.5,
        'strength': 0.5,
        'enemyMultipliers': {
            'Goblin': 0.5,
            'Troll': 0.75,
            'Orc': 0.8,
            'Cyclops': 1,
            'Wraith': 2,
            'Minotaur': 3,
            'Demon': 4,
            'Boss': 2
        }
    },
    'Impossible': {
        'health': 0.25,
        'strength': 0.25,
        'enemyMultipliers': {
            'Goblin': 0.1,
            'Troll': 0.25,
            'Orc': 0.5,
            'Cyclops': 1,
            'Wraith': 3,
            'Minotaur': 5,
            'Demon': 10,
            'Boss': 5
        }
    }
};

// ===============================
// ENEMY STATUSES
// ===============================
const ENEMY_STATUSES = [
    "sleeping", "uninterested", "furious", "hungry", "curious"
];

// ===============================
// CORNER ROOMS FOR EXITS
// ===============================
const CORNER_ROOMS_COORDINATES = [
    { x: 0, y: 0 },
    { x: GRID_SIZE - 1, y: 0 },
    { x: 0, y: GRID_SIZE - 1 },
    { x: GRID_SIZE - 1, y: GRID_SIZE - 1 }
];

// ===============================
// EXITS
// ===============================
const EXITS = [
    {
        name: "Oracle's Cauldron",
        activationArtifact: "Oracle's Potion",
    },
    {
        name: "Locked Gate",
        activationArtifact: "Oracle's Key",
    },
    {
        name: "Mystical Portal",
        activationArtifact: "Oracle's Portal Charm",
    }
];

// ===============================
// ENEMY TYPES
// ===============================
const ENEMY_TYPES = [
    { name: "Goblin",    health: 50,  strength: 10, maxCount: Math.floor(TOTAL_SCREENS * 0.3),  score: 10 },
    { name: "Troll",     health: 100, strength: 10, maxCount: Math.floor(TOTAL_SCREENS * 0.2),  score: 20 },
    { name: "Orc",       health: 150, strength: 30, maxCount: Math.floor(TOTAL_SCREENS * 0.15), score: 30 },
    { name: "Cyclops",   health: 200, strength: 40, maxCount: Math.floor(TOTAL_SCREENS * 0.1),  score: 40 },
    { name: "Wraith",    health: 250, strength: 50, maxCount: Math.floor(TOTAL_SCREENS * 0.08), score: 50 },
    { name: "Minotaur",  health: 300, strength: 60, maxCount: Math.floor(TOTAL_SCREENS * 0.05), score: 60 },
    { name: "Demon",     health: 500, strength: 70, maxCount: Math.floor(TOTAL_SCREENS * 0.02), score: 100 },
];

// ===============================
// BOSS TYPES
// ===============================
const BOSS_TYPES = [
    { name: "Oracle",            health: 10000, strength: 300,  status: "mystical", score: 1000 },
    { name: "Ancient Dragon",    health: 1000,  strength: 100,   status: "angry",    score: 1000 },
    { name: "Necromancer King",  health: 1000,  strength: 100,   status: "angry",    score: 1000 },
    { name: "Infernal Overlord", health: 1000,  strength: 100,   status: "angry",    score: 1000 },
    { name: "Leviathan",         health: 1000,  strength: 100,   status: "angry",    score: 1000 }
];

// ===============================
// ITEMS
// ===============================
const FOOD_ITEMS = [
    { name: "apple",  health: 50 },
    { name: "bread",  health: 30 },
    { name: "cheese", health: 40 },
    { name: "meat",   health: 50 },
];

const HEALTH_ITEMS = [
    { name: "bandage", health: 100 },
    { name: "potion",  health: 200 },
    { name: "elixir",  health: 500 },
    { name: "herb",    health: 50 }
];

const SHIELD_ITEMS = [
    { name: "Wooden Shield", strength: 20, uses: 10 },
    { name: "Iron Shield",   strength: 40, uses: 20 },
    { name: "Golden Shield", strength: 80, uses: 30 },
    { name: "Diamond Shield", strength: 100, uses: 10000 }
];

const OTHER_ITEMS = [
    { name: "Map", description: "A map of the dungeon", count: 10 }
];

const WEAPON_ITEMS = [
    { name: "Wooden Sword",   strength: 20,  uses: 10,    maxCount: Math.floor(TOTAL_SCREENS * 0.5) },
    { name: "Iron Sword",     strength: 40,  uses: 20,    maxCount: Math.floor(TOTAL_SCREENS * 0.25) },
    { name: "Golden Sword",   strength: 80,  uses: 30,    maxCount: Math.floor(TOTAL_SCREENS * 0.15) },
    { name: "Diamond Sword",  strength: 100, uses: 10000, maxCount: Math.floor(TOTAL_SCREENS * 0.1) },
    { name: "Battle Axe",     strength: 50,  uses: 15,    maxCount: Math.floor(TOTAL_SCREENS * 0.2) },
    { name: "War Hammer",     strength: 70,  uses: 20,    maxCount: Math.floor(TOTAL_SCREENS * 0.15) },
    { name: "Magic Staff",    strength: 90,  uses: 10,    maxCount: Math.floor(TOTAL_SCREENS * 0.1) },
    { name: "Crossbow",       strength: 60,  uses: 20,    maxCount: Math.floor(TOTAL_SCREENS * 0.2) },
    { name: "Throwing Knives", strength: 30, uses: 5,     maxCount: Math.floor(TOTAL_SCREENS * 0.25) },
];

// ===============================
// ARTIFACTS
// ===============================
let ARTIFACTS = [
    "Sword of Power",
    "Shield of Ages",
    "All Seeing Eye",
    "Amulet of Souls"
];

// ===============================
// DUNGEON STATE
// ===============================
const dungeon = Array.from({ length: TOTAL_SCREENS }, (_, index) => {
    const x = index % GRID_SIZE;
    const y = Math.floor(index / GRID_SIZE);

    return {
        x,
        y,
        exits: [],
        discovered: false,
        enemy: null,
        enemyHealth: null,
        enemyStrength: null,
        isBoss: false,
        artifact: null,
        hasArtifact: false,
        dungeonExits: []
    };
});

let currentX = GRID_SIZE - 1;
let currentY = GRID_SIZE - 1;

// ===============================
// PLAYER STATE
// ===============================
let player = {
    'name': 'Player 1',
    'inventory': {
        'food': [],
        'weapon': [],
        'shield': [],
        'artifacts': [],
        'health': [
            { 'name': 'bandage', 'quantity': 10 }
        ]
    },
    'health': 250,
    'max-health': 500,
    'weaponstrength': 10,
    'weaponuses': -1,
    'weapon': 'none',
    'shieldstrength': 0,
    'shielduses': -1,
    'shield': 'none',
    'score': 0,
    'percentcomplete': 0
};

// ===============================
// GAME STATUS
// ===============================
let gameStatus = {
    'totalEnemies': 0,
    'totalBosses': 0,
    'discoveredRooms': 0,
    'totalRooms': TOTAL_SCREENS
};

// ===============================
// HELPER FUNCTIONS
// ===============================
function isInBounds(x, y) {
    return (
        x >= 0 &&
        x < GRID_SIZE &&
        y >= 0 &&
        y < GRID_SIZE
    );
}

function getIndex(x, y) {
    return y * GRID_SIZE + x;
}
