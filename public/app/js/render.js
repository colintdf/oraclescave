// =============================
// GLOBAL WALL / ROOM SETTINGS
// =============================

// render.js or a new preload.js
window.spriteSheets = {
    move: null,
    idle: null
};


const BASE_BROWN = { hue: 30, sat: 32, light: 26 };
const WALL_LAYER_COLORS = [
    { dLight: -8 },
    { dLight: -4 },
    { dLight: 0 },
    { dLight: +4 },
    { dLight: +8 }
];

const WALL_THICKNESS_PERC = 0.03;
const EXIT_GAP_PERC = 0.25;


function preloadSpriteSheets(callback) {
    const moveImg = new Image();
    const idleImg = new Image();

    let loaded = 0;
    function check() {
        loaded++;
        if (loaded === 2) callback();
    }

    moveImg.onload = check;
    idleImg.onload = check;

    moveImg.src = PLAYER_SPRITE_SHEET_MOVE;
    idleImg.src = PLAYER_SPRITE_SHEET_IDLE;

    spriteSheets.move = moveImg;
    spriteSheets.idle = idleImg;
}

function enableAutoDepthSorting() {
    const game = document.getElementById('game');

    // 1. MutationObserver for style changes
    const styleObserver = new MutationObserver(mutations => {
        for (const m of mutations) {
            if (m.type === "attributes" && m.attributeName === "style") {
                const el = m.target;
                if (el.classList.contains('sprite-wrapper')) {
                    requestAnimationFrame(() => applyDepthSorting(el));
                }
            }
        }
    });

    // 2. ResizeObserver for size changes
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            const el = entry.target;
            if (el.classList.contains('sprite-wrapper')) {
                requestAnimationFrame(() => applyDepthSorting(el));
            }
        }
    });

    // Attach observers to all wrappers
    game.querySelectorAll('.sprite-wrapper').forEach(el => {
        styleObserver.observe(el, { attributes: true });
        resizeObserver.observe(el);
    });
}

function calculateVictoryChance(player, room) {
    if (!room.enemy) return 0;

    const difficultyBoost = DIFFICULTY_MULTIPLIERS[player.difficulty].strength;

    const playerAvg = (player.weaponstrength * difficultyBoost) / 2;
    const enemyAvg = (room.enemyStrength) / 2;

    const playerTTK = room.enemyHealth / playerAvg;
    const enemyTTK = player.health / enemyAvg;

    let chance = (enemyTTK / (playerTTK + enemyTTK)) * 100;

    if (chance < 1) chance = 1;
    if (chance > 99) chance = 99;

    return Math.floor(chance);
}


// =============================
// MAIN RENDER FUNCTION
// =============================


function renderRoom() {
    // console.log(`Rendering room at (${currentX}, ${currentY})`);
    // if enemy log status
    if (dungeon[getIndex(currentX, currentY)].enemy) {
        // console.log(`Enemy status: ${dungeon[getIndex(currentX, currentY)].enemyStatus}`);
    }
    clearPopups();

    const gameDiv = document.getElementById('game');
    const descriptionDiv = document.getElementById('description');

    // =============================================
    // FIX: Do NOT wipe the player sprite on redraw
    // =============================================
    Array.from(gameDiv.children).forEach(child => {
        if (child.id !== 'player-sprite') {
            child.remove();
        }
    });

    const room = dungeon[getIndex(currentX, currentY)];
    room.discovered = true;

    if (!room.appearance) generateRoomAppearance(room);



    // Render walls
    ['UP', 'DOWN', 'LEFT', 'RIGHT'].forEach(dir => {
        renderWallFromAppearance(room, dir, gameDiv);
    });

    renderFloorTexture(gameDiv, room.appearance.floorPatches); // ADD THIS


    // Enemy
    if (room.enemy) renderEnemy(room, gameDiv);

    // Items
    if (room.weapon) renderWeapon(room, gameDiv);
    if (room.food) renderFood(room, gameDiv);
    if (room.health) renderHealth(room, gameDiv);
    if (room.shield) renderShield(room, gameDiv);
    if (room.otherItem) renderOtherItem(room, gameDiv);
    if (room.dungeonExits.length > 0) renderDungeonExit(room, gameDiv);

    // =============================================
    // Procedural description system
    // =============================================
    if (!room.descriptionFlavor) initRoomDescription(room);
    const flavour = buildDynamicRoomDescription(room);
    descriptionDiv.innerHTML = flavour + "<br><br>" + buildRoomDescription(room);

    // Status + Inventory + Map
    renderPlayerStatus();
    renderInventory();
    renderMiniMap();

    // =============================================
    // Render player sprite LAST so it sits on top
    // =============================================
    renderPlayerSprite(gameDiv);

    // fallback images
    document.querySelectorAll('img').forEach(img => {
        img.onerror = () => { img.src = 'https://placehold.co/400'; };
    });

    if (room.enemy) {
        const fill = document.getElementById('enemyHealthFill');
        if (fill) {
            const pct = Math.max(0, (room.enemyHealth / room.enemyMaxHealth) * 100);
            fill.style.width = pct + '%';
        }
    }

    gameDiv.querySelectorAll('.sprite-wrapper').forEach(el => {
        if (el.classList.contains('sprite-wrapper')) {
            applyDepthSorting(el);
        }
    });
 
    setTimeout(enableAutoDepthSorting, 50);
    positionPopupContainer();

   //debugDrawRockTest();
}


// =============================
// WALL RENDERING (canvas-based)
// =============================
function renderWallFromAppearance(room, dir, gameDiv) {
    // console.log(`Rendering wall ${dir} for room at (${room.x}, ${room.y})`);
    const segments = room.appearance.walls[dir];
    if (!segments || !segments.length) return;
    // console.log(`  Found ${segments.length} wall segments to render.`);
    const width = gameDiv.clientWidth || 1280;
    const height = gameDiv.clientHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.zIndex = '1';

    const ctx = canvas.getContext('2d');
    const base = room.appearance.wallPalette;

    // ===============================
    // Draw wall layers
    // ===============================
    segments.forEach((poly, index) => {
        if (!poly || !poly.length) return;

        ctx.save();

        const shade = WALL_LAYER_COLORS[index % WALL_LAYER_COLORS.length];
        const hue = base.hue;
        const sat = base.sat;
        const light = Math.max(5, Math.min(95, base.light + shade.dLight));

        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;

        ctx.beginPath();
        ctx.moveTo(poly[0].x * width, poly[0].y * height);
        for (let i = 1; i < poly.length; i++) {
            const p = poly[i];
            ctx.lineTo(p.x * width, p.y * height);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });

const hasExit = (Array.isArray(room.exits) && room.exits.includes(dir)) ||
                (Array.isArray(room.storedExits) && room.storedExits.includes(dir));

    if (
        room.enemy &&
        (room.enemyStatus === 'furious' || room.enemyStatus === 'hungry') &&
        hasExit
    ) {
        // console.log('room.appearance.blockedExitRocks:', room.appearance.blockedExitRocks);
        if (!room.appearance) room.appearance = {};
        if (!room.appearance.blockedExitRocks) room.appearance.blockedExitRocks = {};
        if (!Array.isArray(room.appearance.blockedExitRocks[dir])) {
            // console.log(`Generating blocked exit rock data for direction: ${dir}`);
            room.appearance.blockedExitRocks[dir] = generateBlockedExitRockData(dir);
        }
        // console.log('Drawing blocked exit rocks for', dir, room.appearance.blockedExitRocks[dir]);
        drawBlockedExitRocks(ctx, dir, room);
    }

    ctx.restore();


    gameDiv.appendChild(canvas);
}


function drawBlockedExitRocks(ctx, dir, room) {
    const stones = room.appearance.blockedExitRocks?.[dir];
    if (!stones) return;

    stones.forEach(stone => {
        drawRock(ctx, stone.x, stone.y, stone.size, stone.verts, stone.color);
    });
}
function drawRock(ctx, x, y, size, verts, color) {
    ctx.beginPath();

    const first = verts[0];
    ctx.moveTo(
        x + first.dist * Math.cos(first.angle),
        y + first.dist * Math.sin(first.angle)
    );

    for (let i = 1; i < verts.length; i++) {
        const p = verts[i];
        ctx.lineTo(
            x + p.dist * Math.cos(p.angle),
            y + p.dist * Math.sin(p.angle)
        );
    }

    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
}


function generateBlockedExitRockData(dir) {
    // console.log(`Generating blocked exit rock data for direction: ${dir}`);

    const { w, h } = getRoomDimensions();

    const gapStart = 0.5 - EXIT_GAP_PERC / 2;
    const gapEnd   = 0.5 + EXIT_GAP_PERC / 2;

    const wallY = WALL_THICKNESS_PERC * h;
    const wallX = WALL_THICKNESS_PERC * w;

    const chunks = 80;
    const stones = [];

    // Base palette from appearance
    const base = BASE_BROWN; 
    // hue/sat/light ∈ the real palette you already use for walls

    for (let i = 0; i < chunks; i++) {
        const t = Math.random();

        let px, py;

        if (dir === 'UP') {
            px = (gapStart + t * (gapEnd - gapStart)) * w;
            py = Math.random() * wallY;
        }
        else if (dir === 'DOWN') {
            px = (gapStart + t * (gapEnd - gapStart)) * w;
            py = h - wallY + Math.random() * wallY;
        }
        else if (dir === 'LEFT') {
            px = Math.random() * wallX;
            py = (gapStart + t * (gapEnd - gapStart)) * h;
        }
        else if (dir === 'RIGHT') {
            px = w - wallX + Math.random() * wallX;
            py = (gapStart + t * (gapEnd - gapStart)) * h;
        }

        const size = 12 + Math.random() * 22;

        // RANDOMISED COLOUR that stays consistent once generated
        const lightVariation = base.light + (-10 + Math.floor(Math.random() * 20));
        const colour = `hsl(${base.hue}, ${base.sat}%, ${lightVariation}%)`;

        stones.push({
            x: px,
            y: py,
            size: size,
            verts: generateRockPolygon(size),
            color: colour          // <-- STORED forever
        });
    }

    return stones;
}



function generateRockPolygon(size) {
    const points = 5 + Math.floor(Math.random() * 4);
    const angleStep = (Math.PI * 2) / points;
    const verts = [];

    for (let i = 0; i < points; i++) {
        const dist = size * (0.6 + Math.random() * 0.4); // stable irregularity
        verts.push({
            angle: i * angleStep,
            dist
        });
    }

    return verts;
}

function renderEnemy(room, gameDiv) {
    // Create the wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'sprite-wrapper enemy';
    wrapper.style.position = 'absolute';
   // wrapper.style.pointerEvents = 'none'; // avoids hover artifacts

    // Spawn position (persistent)
    if (!room.enemyPos) {
        room.enemyPos = {
            x: 20 + Math.random() * 60, // 20–80%
            y: 20 + Math.random() * 60
        };
    }

    wrapper.style.left = room.enemyPos.x + '%';
    wrapper.style.top = room.enemyPos.y + '%';

    // Enemy image
    const img = document.createElement('img');
    img.src = `app/images/${room.enemy.toLowerCase().replaceAll(' ', '_')}.png`;
    img.style.width = room.isBoss ? '180px' : '100px';
    img.style.height = room.isBoss ? '180px' : '100px';

    // match wrapper size to image
    wrapper.style.width = img.style.width;
    wrapper.style.height = img.style.height;

        // Enemy element
    wrapper.appendChild(img);
    gameDiv.appendChild(wrapper);

    // ------- CLICK TO ATTACK -------
    wrapper.style.cursor = "pointer";
    wrapper.addEventListener("click", () => {
        const tip = document.getElementById("exit-tooltip");
        tip.style.opacity = 0;
        tooltipLocked = false;

        attackEnemy();
    });

    // ------- TOOLTIP ON HOVER -------
    const tooltip = document.getElementById("exit-tooltip");

    wrapper.addEventListener("mousemove", (e) => {
        tooltipLocked = true;

        const room = dungeon[getIndex(currentX, currentY)];
        const chance = calculateVictoryChance(player, room);

        tooltip.innerHTML = `ATTACK!<br /> <br/>${room.enemy} — Victory Chance: ${chance}%`;

        tooltip.style.left = (e.clientX + 12) + "px";
        tooltip.style.top = (e.clientY + 12) + "px";
        tooltip.style.opacity = 1;
    });

    wrapper.addEventListener("mouseleave", () => {
        tooltipLocked = false;
        tooltip.style.opacity = 0;
    });

    // ================================
    // HEALTH BAR (inline version)
    // ================================
    const hb = document.createElement('div');
    hb.id = 'enemyHealthBar';
    hb.style.position = 'absolute';
    hb.style.width = '70px';
    hb.style.height = '5px';
    hb.style.border = '1px solid white';
    hb.style.background = 'red';
    hb.style.overflow = 'hidden';
    hb.style.pointerEvents = 'none';

    const fill = document.createElement('div');
    fill.id = 'enemyHealthFill';
    fill.style.height = '100%';
    fill.style.background = 'green';

    const pct = Math.max(0, (room.enemyHealth / room.enemyMaxHealth) * 100);
    fill.style.width = pct + '%';

    hb.appendChild(fill);
    gameDiv.appendChild(hb);

    // =====================================
    // Delay required so wrapper has size
    // =====================================
    setTimeout(() => {
        positionEnemyHealthBar(wrapper, hb);
        applyDepthSorting(wrapper);
    }, 20);
}


function positionEnemyHealthBar(wrapper, bar) {
    const rect = wrapper.getBoundingClientRect();
    const gameRect = document.getElementById('game').getBoundingClientRect();

    const x = rect.left - gameRect.left;
    const y = rect.top - gameRect.top;

    bar.style.left = (x + rect.width / 2 - 40) + 'px';
    bar.style.top = (y - 30) + 'px';
}

// =============================
// ITEM RENDER HELPERS
// =============================
function renderWeapon(room, gameDiv) { renderSimpleItem(room.weapon, 'weapon', room, gameDiv, '30%'); }
function renderFood(room, gameDiv) { renderSimpleItem(room.food, 'food', room, gameDiv, '70%'); }
function renderOtherItem(room, gameDiv) { renderSimpleItem(room.otherItem, 'otherItem', room, gameDiv, '50%'); }
function renderHealth(room, gameDiv) { renderSimpleItem(room.health, 'health', room, gameDiv, '60%'); }
function renderShield(room, gameDiv) { renderSimpleItem(room.shield, 'shield', room, gameDiv, '40%'); }

function renderSimpleItem(name, cls, room, gameDiv) {
    const wrapper = document.createElement('div');
    wrapper.className = 'sprite-wrapper ' + cls;
    wrapper.style.position = 'absolute';

    const pos = room.appearance.objectPositions[cls];
    wrapper.style.left = (pos.x * 100) + '%';
    wrapper.style.top = (pos.y * 100) + '%';

    const img = document.createElement('img');
    img.src = `app/images/${name.toLowerCase().replaceAll(' ', '_')}.png`;
    img.style.width = '50px';
    img.style.height = '50px';

    wrapper.appendChild(img);
    gameDiv.appendChild(wrapper);

    wrapper.style.cursor = "pointer";

    wrapper.addEventListener("click", () => {
        // Hide tooltip when item is picked up
        const tooltip = document.getElementById("exit-tooltip");
        tooltip.style.opacity = 0;
        tooltipLocked = false;

        pickUpItem(name);
    });


    // TOOLTIP SUPPORT
        const tooltip = document.getElementById("exit-tooltip");

        wrapper.addEventListener("mousemove", (e) => {
            tooltipLocked = true;
            tooltip.textContent = 'Pick up ' + name;
            tooltip.style.left = (e.clientX + 12) + "px";
            tooltip.style.top = (e.clientY + 12) + "px";
            tooltip.style.opacity = 1;
        });

        wrapper.addEventListener("mouseleave", () => {
            tooltipLocked = false;
            tooltip.style.opacity = 0;
        });


    setTimeout(() => applyDepthSorting(wrapper), 0);

}



// DUNGEON EXIT RENDER
// =============================
function renderDungeonExit(room, gameDiv) {
    const exit = room.dungeonExits[0];

    const wrap = document.createElement('div');
    wrap.className = 'sprite-wrapper exit-wrapper';
    wrap.style.position = 'absolute';

    const pos = room.appearance.objectPositions.exit;
    wrap.style.left = (pos.x * 100) + '%';
    wrap.style.top = (pos.y * 100) + '%';

    const img = document.createElement('img');
    img.src = `app/images/${exit.name.toLowerCase().replaceAll(' ', '_').replaceAll("'", "")}.png`;
    img.className = 'dungeonExit';

    // GIVE IT A SIZE (important!)
    img.style.width = "120px";
    img.style.height = "120px";
    wrap.style.width = img.style.width;
    wrap.style.height = img.style.height;

    wrap.appendChild(img);
    gameDiv.appendChild(wrap);

    // depth-sort after image loads
    img.onload = () => applyDepthSorting(wrap);
}



function renderMiniMap() {
    const map = document.getElementById('mini-map');

    // Difficulty-level behaviour
    if (player.difficulty === 'Extreme' || player.difficulty === 'Impossible') {
        map.style.display = 'none';
        return;
    } else {
        map.style.display = 'grid';
    }

    map.innerHTML = '';

    dungeon.forEach((room, idx) => {
        const div = document.createElement('div');
        div.className = 'mini-room';

        // EASY: entire map is visible
        if (player.difficulty === 'Easy') {
            room.discovered = true;
        }

        // MEDIUM: only bosses + exits start revealed
        if (player.difficulty === 'Medium') {
            if (room.isBoss || room.dungeonExits.length > 0) {
                room.discovered = true;
            }
        }

        // apply colours only if discovered
        if (room.discovered) {
            div.classList.add('discovered');

            if (room.isBoss) {
                div.classList.add(room.enemy === 'Oracle' ? 'oracleRoom' : 'bossRoom');
            }

            if (room.dungeonExits.length > 0) {
                div.classList.add('exitRoom');
            }
        } else {
            // undiscovered should be black, like the old version
            div.style.backgroundColor = 'black';
        }

        // current room highlight
        if (idx === getIndex(currentX, currentY)) {
            div.classList.add('current');
        }

        // exits (only drawn if the room is visible)
        if (room.discovered) {
            room.exits.forEach(dir => {
                const e = document.createElement('div');
                e.className = `mini-exit ${dir.toLowerCase()}`;
                div.appendChild(e);
            });
        }

        map.appendChild(div);
    });
}


// =============================
// PLAYER STATUS PANEL
// =============================
function renderPlayerStatus() {
    const statusDiv = document.getElementById('status-panel');
    statusDiv.innerHTML = '';

    const healthBarContainer = document.createElement('div');
    healthBarContainer.style.position = 'relative';

    const healthBar = document.createElement('div');
    healthBar.style.width = '200px';
    healthBar.style.height = '20px';
    healthBar.style.border = '1px solid white';
    healthBar.style.backgroundColor = 'red';
    healthBar.style.position = 'relative';
    healthBar.style.overflow = 'hidden';
    healthBar.style.boxSizing = 'border-box';

    const healthFill = document.createElement('div');
    healthFill.style.height = '100%';
    healthFill.style.backgroundColor = 'green';

    const pct = (player.health / player['max-health']) * 100;
    healthFill.style.width = `calc(${pct}% - 0px)`;
    healthFill.style.position = 'absolute';
    healthFill.style.left = '-10px';
    healthFill.style.top = '0px';

    healthBar.appendChild(healthFill);
    healthBarContainer.appendChild(healthBar);
    statusDiv.appendChild(healthBarContainer);

    const weaponDiv = document.createElement('div');
    weaponDiv.textContent =
        `Weapon: ${player.weapon} (Strength: ${player.weaponstrength}${player.weaponuses < 0 ? '' : `, Uses: ${player.weaponuses}`})`;
    statusDiv.appendChild(weaponDiv);

    const shieldDiv = document.createElement('div');
    shieldDiv.textContent =
        `Shield: ${player.shield} (Strength: ${player.shieldstrength}${player.shielduses < 0 ? '' : `, Uses: ${player.shielduses}`})`;
    statusDiv.appendChild(shieldDiv);

    const scoreDiv = document.createElement('div');
    scoreDiv.textContent = `Score: ${player.score}`;
    statusDiv.appendChild(scoreDiv);

    const percentCompleteDiv = document.createElement('div');
    percentCompleteDiv.textContent =
        `Percentage Complete: ${player.percentcomplete.toFixed(2)}%`;
    statusDiv.appendChild(percentCompleteDiv);
}

function renderInventory() {
    const div = document.getElementById('inventory');
    div.innerHTML = '';

    for (const cat in player.inventory) {
        if (player.inventory[cat].length > 0) {

            const c = document.createElement('div');
            c.textContent = `${cat}:`;
            div.appendChild(c);

            player.inventory[cat].forEach(item => {

                const i = document.createElement('div');
                i.textContent = `${item.name} x${item.quantity || 1}`;

                // ==========================================================
                // APPLY POINTER ONLY TO FOOD + HEALTH ITEMS
                // ==========================================================
                const isFood = FOOD_ITEMS.some(f => f.name === item.name);
                const isHealth = HEALTH_ITEMS.some(h => h.name === item.name);

                // Weapons, shields, artifacts, misc → NO POINTER
                i.style.cursor = (isFood || isHealth) ? "pointer" : "default";


                // ==========================================================
                // CLICK TO USE (same validation rules as keyboard "U")
                // ==========================================================
                i.addEventListener("click", () => {

                    // ======================================================
                    // EXIT ARTEFACT HANDLING
                    // ======================================================
                    const room = dungeon[getIndex(currentX, currentY)];
                    const exitObj = hasArtifactForExit(room);

                    if (exitObj && item.name === exitObj.activationArtifact) {
                        completeGame(exitObj);
                        return;
                    }

                    // NON-usable items
                    if (!isFood && !isHealth) return;

                    // FULL HEALTH check (matches input.js)
                    if (player.health === player['max-health']) {
                        showPopup("Full health.");
                        return;
                    }

                    // Identify item definition
                    const foodDef = FOOD_ITEMS.find(f => f.name === item.name);
                    const healthDef = HEALTH_ITEMS.find(h => h.name === item.name);

                    // POTION special rules (identical to use-key logic)
                    if (item.name === "potion") {

                        // Remove 1 potion
                        item.quantity -= 1;
                        if (item.quantity <= 0) {
                            player.inventory.food =
                                player.inventory.food.filter(f => f.name !== "potion");
                        }

                        // Same random effects as USE command
                        let effect = Math.floor(Math.random() * 3);

                        if (effect === 0) {
                            let loss = Math.floor(Math.random() * 50) * -1;
                            player.health += loss;
                            showPopup(`You drank the potion and lost ${loss} health.`);
                            if (player.health <= 0) {
                                showPopup("You died!", true);
                                location.reload();
                            }
                        } else if (effect === 1) {
                            player.health += Math.floor(Math.random() * 500);
                            if (player.health > player['max-health']) {
                                player.health = player['max-health'];
                            }
                            showPopup("You gained health.");
                        } else {
                            let randomRoom = Math.floor(Math.random() * TOTAL_SCREENS);
                            currentX = randomRoom % GRID_SIZE;
                            currentY = Math.floor(randomRoom / GRID_SIZE);
                            showPopup("You passed out and woke up somewhere else.", true);
                            renderRoom();
                        }

                        renderPlayerStatus();
                        renderInventory();
                        return;
                    }


                    // ======================================================
                    // STANDARD FOOD / HEALTH ITEM CONSUMPTION
                    // ======================================================
                    const healAmount = (foodDef && foodDef.health) ||
                                       (healthDef && healthDef.health) ||
                                       0;

                    player.health = Math.min(
                        player['max-health'],
                        player.health + healAmount
                    );

                    // Reduce quantity and remove if zero
                    item.quantity -= 1;

                    if (isFood) {
                        player.inventory.food =
                            player.inventory.food.filter(f => f.quantity > 0);
                    }

                    if (isHealth) {
                        player.inventory.health =
                            player.inventory.health.filter(h => h.quantity > 0);
                    }

                    renderPlayerStatus();
                    renderInventory();
                });

                div.appendChild(i);
            });
        }
    }
}


// =============================
// START SCREEN
// =============================
function renderStartScreen() {
    const gameDiv = document.getElementById('game');
    gameDiv.innerHTML = '';

    const box = document.createElement('div');
    box.id = 'start-screen';

    const t = document.createElement('h2');
    t.textContent = "Welcome to The Oracle's Dungeon";
    box.appendChild(t);

    const p = document.createElement('p');
    p.style.padding = '20px 50px';
    p.style.lineHeight = '2';
    p.style.fontSize = '20px';
    p.textContent =
        "The Oracle's Dungeon is a browser adventure game inspired by the 8-bit classic. " +
        "Explore caves, defeat monsters, collect artifacts, and escape.";
    box.appendChild(p);

    const label = document.createElement('p');
    label.textContent = "Choose a difficulty:";
    box.appendChild(label);

    const wrap = document.createElement('div');
    ['Easy','Medium','Hard','Extreme','Impossible'].forEach(d => {
        const b = document.createElement('button');
        b.textContent = d;
        b.style.padding = '6px';
        b.style.fontSize = '20px';
        b.style.fontFamily = 'Metamorphous';
        b.style.margin = '10px';
        b.style.cursor = 'pointer';
        b.onclick = () => startGame(d);
        wrap.appendChild(b);
    });

    box.appendChild(wrap);
    gameDiv.appendChild(box);
}


// =============================
// ROOM DESCRIPTION BUILDER
// =============================
function buildRoomDescription(room) {
    const parts = [];

    if (room.enemy) {
        parts.push(
            `You see a ${room.enemyStatus} ${room.enemy} here. ` +
            `It has ${room.enemyHealth} health and ${room.enemyStrength} strength.`
        );
    }

    const items = [];
    if (room.weapon) items.push(room.weapon);
    if (room.food) items.push(room.food);
    if (room.health) items.push(room.health);
    if (room.shield) items.push(room.shield);
    if (room.otherItem) items.push(room.otherItem);

    if (items.length) parts.push(`You see ${items.join(', ')} here.`);

    if (room.isBoss) {
        parts.push(`This cave contains the ${room.artifact}.`);
    }

    if (room.dungeonExits.length) {
        room.dungeonExits.forEach(e => {
            parts.push(`There is a ${e.name} here. You need the ${e.activationArtifact} to escape.`);
        });
    }

    // Exits should be last
    parts.push(`Exits lead: ${room.exits.length ? room.exits.join(', ') : 'nowhere'}`);

    return parts.join('<br>');
}
function generateObjectPositions(room) {
    const positions = {};

    // Spawnable area inside walls
    const minX = 0.3;
    const maxX = 0.7;
    const minY = 0.3;
    const maxY = 0.7;

    const placed = []; // track placed objects to avoid overlap

    const ITEM_RADIUS = 60;   // ~50–90px items
    const ENEMY_RADIUS = 90;  // 160–200px bosses

    function place(type) {
        const radius = type === "enemy" ? ENEMY_RADIUS : ITEM_RADIUS;

        for (let tries = 0; tries < 80; tries++) {
            const x = minX + Math.random() * (maxX - minX);
            const y = minY + Math.random() * (maxY - minY);  // <-- FIXED

            let ok = true;

            for (const obj of placed) {
                const dx = (x - obj.x) * 1280;
                const dy = (y - obj.y) * 720;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < obj.radius + radius) {
                    ok = false;
                    break;
                }
            }

            if (ok) {
                placed.push({ x, y, radius });
                return { x, y };
            }
        }

        // Fallback if we fail to place without overlap
        return { x: 0.5, y: 0.5 };
    }

    // Enemy
    if (room.enemy) positions.enemy = place("enemy");

    // Items
    ['weapon', 'food', 'health', 'shield', 'otherItem'].forEach(key => {
        if (room[key]) positions[key] = place("item");
    });

    // Dungeon exit
    if (room.dungeonExits.length > 0) {
        positions.exit = place("item");
    }

    return positions;
}


// =============================
// APPEARANCE GENERATION
// =============================

function generateRoomAppearance(room) {
    if (!room.appearance) room.appearance = {};
    if (!room.appearance.blockedExitRocks) {
        room.appearance.blockedExitRocks = {};
    }
    room.appearance.wallPalette = BASE_BROWN;

    room.appearance.walls = {
        UP: generateWallSegmentsForSide('UP', room.exits.includes('UP')),
        DOWN: generateWallSegmentsForSide('DOWN', room.exits.includes('DOWN')),
        LEFT: generateWallSegmentsForSide('LEFT', room.exits.includes('LEFT')),
        RIGHT: generateWallSegmentsForSide('RIGHT', room.exits.includes('RIGHT'))
    };

    if (!room.appearance.floorPatches) {
        room.appearance.floorPatches = generateFloorPatches();
    }
    if (!room.appearance.objectPositions) {
        room.appearance.objectPositions = generateObjectPositions(room);
    }
    ['UP', 'DOWN', 'LEFT', 'RIGHT'].forEach(dir => {
        if (
            room.enemy &&
            (room.enemyStatus === 'furious' || room.enemyStatus === 'hungry') &&
            room.exits.includes(dir)
        ) {
            if (!room.appearance.blockedExitRocks[dir]) {
                room.appearance.blockedExitRocks[dir] =
                    generateBlockedExitRockData(dir);
            }
        }
    });
}

function generateFloorPatches() {
    const patches = [];
    const count = 120; // more patches = more texture

    for (let i = 0; i < count; i++) {
        patches.push({
            x: Math.random(),   // 0..1 (percentage)
            y: Math.random(),
            w: 20 + Math.random() * 100,
            h: 20 + Math.random() * 80,
            rot: Math.random() * Math.PI * 2,
            opacity: 0.04 + Math.random() * 0.08,
            shade: 15 + Math.floor(Math.random() * 30) // dark grey variety
        });
    }

    return patches;
}

// =============================
// WALL GEOMETRY
// =============================

function generateWallSegmentsForSide(dir, hasExit) {
    const layers = 5;
    const thickness = WALL_THICKNESS_PERC;
    const jagged = 0.06;
    const layerShrink = 0.20;

    const gapSize = hasExit ? EXIT_GAP_PERC : 0;
    const gapStart = hasExit ? 0.5 - gapSize / 2 : 0;
    const gapEnd = hasExit ? 0.5 + gapSize / 2 : 1;

    const horizStep = 1 / 20;
    const vertStep = 1 / 20;

    const segments = [];

    function horizontalBand(x0, x1, isTop, layer) {
        if (x1 <= x0) return null;

        const pts = [];
        const offset = layer * thickness * layerShrink * 0.3;

        const outerY = isTop ? 0 + offset : 1 - offset;
        const innerY = isTop ? (thickness - offset) : (1 - (thickness - offset));

        for (let x = x0; x <= x1 + 1e-6; x += horizStep) {
            pts.push({ x: Math.min(x, x1), y: outerY });
        }

        for (let x = x1; x >= x0 - 1e-6; x -= horizStep) {
            pts.push({
                x: Math.max(x, x0),
                y: innerY + (Math.random() * jagged * (isTop ? 1 : -1))
            });
        }

        return pts;
    }

    function verticalBand(y0, y1, isLeft, layer) {
        if (y1 <= y0) return null;

        const pts = [];
        const offset = layer * thickness * layerShrink * 0.3;

        const outerX = isLeft ? 0 + offset : 1 - offset;
        const innerX = isLeft ? (thickness - offset) : (1 - (thickness - offset));

        for (let y = y0; y <= y1 + 1e-6; y += vertStep) {
            pts.push({ x: outerX, y: Math.min(y, y1) });
        }

        for (let y = y1; y >= y0 - 1e-6; y -= vertStep) {
            pts.push({
                x: innerX + (Math.random() * jagged * (isLeft ? 1 : -1)),
                y: Math.max(y, y0)
            });
        }

        return pts;
    }

    function addHorizontal(isTop) {
        for (let layer = 0; layer < layers; layer++) {
            if (hasExit) {
                segments.push(horizontalBand(0, gapStart, isTop, layer));
                segments.push(horizontalBand(gapEnd, 1, isTop, layer));
            } else {
                segments.push(horizontalBand(0, 1, isTop, layer));
            }
        }
    }

    function addVertical(isLeft) {
        for (let layer = 0; layer < layers; layer++) {
            if (hasExit) {
                segments.push(verticalBand(0, gapStart, isLeft, layer));
                segments.push(verticalBand(gapEnd, 1, isLeft, layer));
            } else {
                segments.push(verticalBand(0, 1, isLeft, layer));
            }
        }
    }

    if (dir === 'UP') addHorizontal(true);
    if (dir === 'DOWN') addHorizontal(false);
    if (dir === 'LEFT') addVertical(true);
    if (dir === 'RIGHT') addVertical(false);

    return segments.filter(Boolean);
}
function applyDepthSorting(el) {
    if (!el) return;

    // Wait for images to load so offsetHeight is valid
    if (el.tagName === "IMG" && !el.complete) {
        el.onload = () => applyDepthSorting(el);
        return;
    }

    const game = document.getElementById('game');
    const gameHeight = game.clientHeight;

    // -------------------------------------------
    // 1. RESOLVE TOP POSITION IN PIXELS
    // -------------------------------------------
    let topPx = 0;
    if (el.style.top.includes('%')) {
        topPx = (parseFloat(el.style.top) / 100) * gameHeight;
    } else {
        topPx = parseFloat(el.style.top) || 0;
    }

    // -------------------------------------------
    // 2. TRUE ELEMENT HEIGHT
    // -------------------------------------------
    const heightPx = el.offsetHeight || 0;

    // -------------------------------------------
    // 3. FEET OFFSET (player only)
    // -------------------------------------------
    let feetOffset = 0;

    if (el.id === 'player-sprite') {
        // Your sprite frame is ~160px tall inside a 640px sheet row
        // Adjust until feet align correctly
        feetOffset = getSpriteFeetOffset(el);
    }

    // -------------------------------------------
    // 4. TRUE FEET POSITION
    // -------------------------------------------
    const bottom = topPx + heightPx - feetOffset;

    // -------------------------------------------
    // 5. APPLY DEPTH Z-INDEX
    // -------------------------------------------
    el.style.zIndex = 1000 + Math.floor(bottom);

    // -------------------------------------------
    // 6. DEBUG LEGEND
    // -------------------------------------------
   /* let dbg = el.querySelector('.depth-debug');
    if (!dbg) {
        dbg = document.createElement('div');
        dbg.className = 'depth-debug';
        dbg.style.position = 'absolute';
        dbg.style.left = '0';
        dbg.style.top = '100%';
        dbg.style.fontSize = '10px';
        dbg.style.color = 'white';
        dbg.style.background = 'rgba(0,0,0,0.7)';
        dbg.style.padding = '2px 4px';
        dbg.style.pointerEvents = 'none';
        dbg.style.whiteSpace = 'nowrap';
        dbg.style.zIndex = 999999;
        el.appendChild(dbg);
    }
    dbg.textContent = `bottom: ${Math.floor(bottom)} | z: ${el.style.zIndex}`;*/

    // -------------------------------------------
    // 7. DEBUG BORDER OUTLINE (100% working)
    // -------------------------------------------
  //  el.style.outline = '2px solid rgba(255,255,255,0.8)';
}



function renderFloorTexture(gameDiv, patches) {
    const width = gameDiv.clientWidth || 1280;
    const height = gameDiv.clientHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.zIndex = '0';

    const ctx = canvas.getContext('2d');

    // Base
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);

    // Draw stored patches
    patches.forEach(p => {
        ctx.save();
        ctx.translate(p.x * width, p.y * height);
        ctx.rotate(p.rot);

        ctx.fillStyle = `rgba(${p.shade}, ${p.shade}, ${p.shade}, ${p.opacity})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w, p.h, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    gameDiv.appendChild(canvas);
}

function positionEnemyHealthBar(enemyImg, bar) {
    const rect = enemyImg.getBoundingClientRect();
    const gameRect = document.getElementById('game').getBoundingClientRect();

    // Compute top-left position relative to game container
    const x = rect.left - gameRect.left;
    const y = rect.top - gameRect.top;

    // Health bar goes slightly above the enemy sprite
    bar.style.left = (x + rect.width / 2 - 40) + 'px';  // 80px bar width
    bar.style.top = (y - 12) + 'px';                    // slight offset upward
}
function showPopup(message, requireOk = false) {

    const container = document.getElementById("game-popup-container");

    // Deduplication: prevent repeating identical popup
    if (container && container.lastElementChild) {
        const last = container.lastElementChild;
        const lastMsgEl = last.querySelector('div');
        const lastText = lastMsgEl ? (lastMsgEl.textContent || '').trim() : (last.textContent || '').trim();

        if (lastText === String(message).trim()) {
            return () => {};
        }
    }

    // MAX POPUP LOGIC: enforce maximum of 5 popups
    if (container.children.length >= 5) {
        // Remove the oldest popup (the first child)
        container.firstElementChild.remove();
    }

    const overlay = document.getElementById("game-popup-overlay");

    const box = document.createElement("div");
    box.className = "game-popup";
    box.style.cssText = `
        background: rgba(0,0,0,0.85);
        color:white;
        padding:12px 16px;
        border-radius:6px;
        font-size:14px;
        max-width:260px;
        pointer-events:auto;
    `;
    box.innerHTML = `<div>${message}</div>`;

    let timeout = null;

    if (requireOk) {
        overlay.style.display = "block";
        positionPopupContainer();

        const btn = document.createElement("button");
        btn.textContent = "OK";
        btn.onclick = () => {
            overlay.style.display = "none";
            box.remove();
            positionPopupContainer();
        };
        box.appendChild(btn);

    } else {
        timeout = setTimeout(() => {
            box.remove();
            positionPopupContainer();
        }, 5000);
    }

    container.appendChild(box);

    positionPopupContainer();

    return () => {
        if (timeout) clearTimeout(timeout);
        box.remove();
        overlay.style.display = "none";
        positionPopupContainer();
    };
}




// Remove all popups on room change:
function clearPopups() {
    // console.log("Clearing popups");
   // const container = document.getElementById("game-popup-container");
   // container.innerHTML = "";
}

function positionPopupContainer() {
    const game = document.getElementById("game");
    const popup = document.getElementById("game-popup-container");

    if (!game || !popup) return;

    const rect = game.getBoundingClientRect();

    popup.style.position = "absolute";
    popup.style.left = (rect.left + rect.width - popup.offsetWidth - 20) + "px";
    popup.style.top  = (rect.top + rect.height - popup.offsetHeight - 20) + "px";
}

function stackPopups() {
    const container = document.getElementById("game-popup-container");
    const boxes = Array.from(container.children);

    // Sort oldest at top, newest at bottom
    let offset = 0;

    boxes.forEach(box => {
        box.style.marginTop = offset + "px";
        offset -= (box.offsetHeight + 10); 
    });
}


window.addEventListener("resize", positionPopupContainer);
function debugDrawRockTest() {
    const gameDiv = document.getElementById('game');
    const width = gameDiv.clientWidth || 1280;
    const height = gameDiv.clientHeight || 720;

    let testCanvas = document.getElementById("rock-debug");
    if (!testCanvas) {
        testCanvas = document.createElement("canvas");
        testCanvas.id = "rock-debug";
        testCanvas.style.position = "absolute";
        testCanvas.style.left = "0";
        testCanvas.style.top = "0";
        testCanvas.style.zIndex = "999999"; // ABOVE EVERYTHING
        testCanvas.style.pointerEvents = "none";
        gameDiv.appendChild(testCanvas);
    }

    testCanvas.width = width;
    testCanvas.height = height;

    const ctx = testCanvas.getContext("2d");

    // Giant red square test
    ctx.fillStyle = "rgba(255,0,0,0.6)";
    ctx.fillRect(width * 0.4, height * 0.05, width * 0.2, height * 0.2);

    // console.log("DEBUG ROCK TEST DRAWN");
}
