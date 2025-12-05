let bgAudio = new Audio("app/sound/background.wav");
bgAudio.loop = true;
bgAudio.volume = 0.2; // adjust to taste

let collectAudio = new Audio("app/sound/collect.wav");
collectAudio.volume = 0.5;

let walkAudio = new Audio("app/sound/footsteps.wav");
walkAudio.volume = 0.2;

let randomSoundsDir = 'app/sound/randomsounds/';
let randomSoundFiles = [
    'moan.wav',
    'monsters.wav',
    'scream.wav'
];
let randomSoundAudios = randomSoundFiles.map(file => {
    let audio = new Audio(randomSoundsDir + file);
    audio.volume = 0.3;
    return audio;
});
let rockfallAudio = new Audio("app/sound/rockfall.wav");
rockfallAudio.volume = 0.5;

// =====================================================
// OCCASIONAL RANDOM BACKGROUND NOISE (no overlap)
// =====================================================
let ambientActive = false;
let ambientPlaying = false;

function scheduleAmbientNoise() {
    console.log("Scheduling ambient noise...");
    if (!ambientActive || ambientPlaying) return;
    // 15–45 second delay between ambient sounds
    const delay = 15000 + Math.random() * 30000;
    console.log("Ambient noise scheduled.", delay);

    setTimeout(() => {
        console.log("Playing ambient noise...");
        if (!ambientActive || ambientPlaying) return;
        console.log("Ambient noise playing.");
        const audio = randomSoundAudios[Math.floor(Math.random() * randomSoundAudios.length)];
        ambientPlaying = true;
        console.log("Ambient audio selected:", audio.src);
        audio.currentTime = 0;
        audio.play()
            .catch(() => {
                ambientPlaying = false;
                scheduleAmbientNoise();
            });

        audio.onended = () => {
            ambientPlaying = false;
            scheduleAmbientNoise();
        };

    }, delay);
}


// ===============================
// ADD EXIT BETWEEN ROOMS
// ===============================
function addExit(x1, y1, x2, y2) {
    const room1 = dungeon[getIndex(x1, y1)];
    const room2 = dungeon[getIndex(x2, y2)];
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === -1) { room1.exits.push('UP'); room2.exits.push('DOWN'); }
    if (dx === 0 && dy === 1)  { room1.exits.push('DOWN'); room2.exits.push('UP'); }
    if (dx === -1 && dy === 0) { room1.exits.push('LEFT'); room2.exits.push('RIGHT'); }
    if (dx === 1 && dy === 0)  { room1.exits.push('RIGHT'); room2.exits.push('LEFT'); }
}

// ===============================
// MAZE GENERATION
// ===============================
function generateMaze() {
    const stack = [];
    const visited = new Set();

    let x = GRID_SIZE - 1;
    let y = GRID_SIZE - 1;

    visited.add(`${x},${y}`);
    stack.push({ x, y });

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const { x, y } = current;

        const neighbors = [];

        for (const [_, [dx, dy]] of Object.entries(DIRECTIONS)) {
            const nx = x + dx;
            const ny = y + dy;

            if (isInBounds(nx, ny) && !visited.has(`${nx},${ny}`)) {
                neighbors.push({ x: nx, y: ny });
            }
        }

        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            addExit(x, y, next.x, next.y);

            visited.add(`${next.x},${next.y}`);
            stack.push(next);
        } else {
            stack.pop();
        }
    }
}

// ===============================
// PLACE ENEMIES + BOSSES
// ===============================
function placeEnemies() {
    const bossPositions = new Set();

    // Place bosses in the top half
    while (bossPositions.size < BOSS_TYPES.length) {
        const pos = Math.floor(Math.random() * TOTAL_SCREENS / 1.5);

        if (pos !== 0 && pos !== TOTAL_SCREENS - 1) {
            bossPositions.add(pos);
            const bossIndex = bossPositions.size - 1;

            dungeon[pos].isBoss = true;
            dungeon[pos].enemy = BOSS_TYPES[bossIndex].name;

            // Oracle artifact selection
            if (bossIndex === 0) {
                let possibleOracleArtifacts = [
                    "Oracle's Potion",
                    "Oracle's Key",
                    "Oracle's Portal Charm"
                ];

                dungeon[pos].artifact =
                    possibleOracleArtifacts[Math.floor(Math.random() * possibleOracleArtifacts.length)];

            } else {
                dungeon[pos].artifact = ARTIFACTS[bossIndex];

                let unassignedArtifacts = ARTIFACTS.filter(a =>
                    !dungeon.some(room => room.artifact === a)
                );

                if (unassignedArtifacts.length > 0) {
                    dungeon[pos].artifact = unassignedArtifacts[Math.floor(Math.random() * unassignedArtifacts.length)];
                } else {
                    dungeon[pos].artifact = ARTIFACTS[Math.floor(Math.random() * ARTIFACTS.length)];
                }
            }

            // Boss health/strength with difficulty multipliers
            dungeon[pos].enemyHealth = BOSS_TYPES[bossIndex].health;
            dungeon[pos].enemyHealth = Math.floor(
                dungeon[pos].enemyHealth * DIFFICULTY_MULTIPLIERS[player.difficulty].enemyMultipliers.Boss
            );

            dungeon[pos].enemyMaxHealth = dungeon[pos].enemyHealth;

            dungeon[pos].enemyStrength = BOSS_TYPES[bossIndex].strength;
            dungeon[pos].enemyStrength = Math.floor(
                dungeon[pos].enemyStrength * DIFFICULTY_MULTIPLIERS[player.difficulty].enemyMultipliers.Boss
            );

            dungeon[pos].enemyStatus = BOSS_TYPES[bossIndex].status;
            dungeon[pos].enemyScore = BOSS_TYPES[bossIndex].score;

            // console.log(`Boss ${bossIndex + 1}: ${dungeon[pos].enemy} placed in room ${pos} with ${dungeon[pos].enemyHealth} health and ${dungeon[pos].enemyStrength} strength`);

            gameStatus.totalBosses += 1;
        }
    }

    // Regular enemies
    dungeon.forEach((room, index) => {
        if (!room.isBoss && index !== 0 && index !== TOTAL_SCREENS - 1) {
            if (Math.random() < 0.8) {

                var randomEnemy = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
                var enemyCount = dungeon.filter(r => r.enemy === randomEnemy.name).length;

                var countMultiplier =
                    DIFFICULTY_MULTIPLIERS[player.difficulty].enemyMultipliers[randomEnemy.name];

                randomEnemy.maxCount = Math.floor(randomEnemy.maxCount * countMultiplier);

                if (enemyCount < randomEnemy.maxCount) {

                    room.enemy = randomEnemy.name;

                    let scaledHealth = Math.floor(
                        randomEnemy.health *
                        DIFFICULTY_MULTIPLIERS[player.difficulty].enemyMultipliers[randomEnemy.name]
                    );

                    room.enemyHealth = scaledHealth;
                    room.enemyMaxHealth = scaledHealth;

                    room.enemyStrength = Math.floor(
                        randomEnemy.strength *
                        DIFFICULTY_MULTIPLIERS[player.difficulty].enemyMultipliers[randomEnemy.name]
                    );

                    room.enemyStatus =
                        ENEMY_STATUSES[Math.floor(Math.random() * ENEMY_STATUSES.length)];

                    if (
                        player.difficulty === 'Hard' ||
                        player.difficulty === 'Extreme' ||
                        player.difficulty === 'Impossible'
                    ) {
                        if (
                            room.enemyStatus === 'sleeping' ||
                            room.enemyStatus === 'uninterested' ||
                            room.enemyStatus === 'curious'
                        ) {
                            room.enemyStatus = 'furious';
                        }
                    }

                    room.enemyScore = randomEnemy.score;

                    gameStatus.totalEnemies += 1;
                }
            }
        }
    });

    console.log( 'Placed ' + dungeon.filter(r => r.enemy).length + ' enemies in the dungeon');

    ENEMY_TYPES.forEach(enemyType => {
        const count = dungeon.filter(room => room.enemy === enemyType.name).length;
        // console.log(`Placed ${count} ${enemyType.name}(s) in the dungeon`);
    });
}

// ===============================
// PLACE WEAPONS
// ===============================
function placeWeapons() {
    dungeon.forEach((room, index) => {
        if (Math.random() < 0.4 && index !== 0 && index !== TOTAL_SCREENS - 1) {
            var randomWeapon = WEAPON_ITEMS[Math.floor(Math.random() * WEAPON_ITEMS.length)];

            var weaponCount = dungeon.filter(r => r.weapon === randomWeapon.name).length;

            if (weaponCount < randomWeapon.maxCount) {
                room.weapon = randomWeapon.name;
                room.weaponStrength = randomWeapon.strength;
                room.weaponUses = randomWeapon.uses;
            }
        }
    });

   
}

// ===============================
// PLACE FOOD + HEALTH + SHIELDS + MAPS
// ===============================
function placeItems() {

    dungeon.forEach((room, index) => {

        if (Math.random() < 0.3 && index !== 0 && index !== TOTAL_SCREENS - 1) {
            var randomFood = FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)];
            room.food = randomFood.name;
            room.foodHealth = randomFood.health;
        }

        if (Math.random() < 0.2 && index !== 0 && index !== TOTAL_SCREENS - 1) {
            var randomHealth = HEALTH_ITEMS[Math.floor(Math.random() * HEALTH_ITEMS.length)];
            room.health = randomHealth.name;
            room.healthValue = randomHealth.health;
        }

        if (Math.random() < 0.3 && index !== 0 && index !== TOTAL_SCREENS - 1) {
            var randomShield = SHIELD_ITEMS[Math.floor(Math.random() * SHIELD_ITEMS.length)];
            room.shield = randomShield.name;
            room.shieldStrength = randomShield.strength;
            room.shieldUses = randomShield.uses;
        }

        if (Math.random() < 0.2 && index !== 0 && index !== TOTAL_SCREENS - 1) {
            var otherItem = OTHER_ITEMS[Math.floor(Math.random() * OTHER_ITEMS.length)];
            var itemCount = dungeon.filter(r => r.otherItem === otherItem.name).length;

            if (itemCount < otherItem.count) {
                room.otherItem = otherItem.name;
            }
        }
    });
}

// ===============================
// PLACE EXIT ROOMS
// ===============================
function placeDungeonExits() {
    EXITS.forEach(exit => {
        let roomX = CORNER_ROOMS_COORDINATES[0].x;
        let roomY = CORNER_ROOMS_COORDINATES[0].y;

        CORNER_ROOMS_COORDINATES.shift();

        let roomIndex = getIndex(roomX, roomY);

        dungeon[roomIndex].dungeonExits.push({
            name: exit.name,
            activationArtifact: exit.activationArtifact
        });
    });
}

// ===============================
// COMPLETE DUNGEON GENERATION
// ===============================
function generateDungeon() {
    generateMaze();
    placeEnemies();
    placeWeapons();
    placeItems();
    placeDungeonExits();

    // Appearance generation for every room
    dungeon.forEach(room => {
        generateRoomAppearance(room);
    });

    // console.log("Dungeon generation complete.");
}

// ===============================
// START NEW GAME FROM DIFFICULTY SELECT
// ===============================
function startGame(difficulty) {
    player.difficulty = difficulty;

    player.health = player.health * DIFFICULTY_MULTIPLIERS[player.difficulty].health;

    // START BACKGROUND AUDIO (safe and repeatable)
    if (bgAudio) {
        bgAudio.currentTime = 0;   // always restart from the beginning
        bgAudio.play().catch(() => {
            showPopup("Background audio playback was prevented. Please interact with the game to enable sound.", true);
        });
    }

    // Start occasional ambient noise
    ambientActive = true;
    scheduleAmbientNoise();


    requestAnimationFrame(idleLoop);

    generateDungeon();

    renderRoom();
}
