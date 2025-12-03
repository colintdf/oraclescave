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


// =============================
// MAIN RENDER FUNCTION
// =============================
function renderRoom() {
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

    if (!room.appearance) generateRoomAppearance(room);

    // Render walls
    ['UP', 'DOWN', 'LEFT', 'RIGHT'].forEach(dir => {
        renderWallFromAppearance(room, dir, gameDiv);
    });

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
}


// =============================
// WALL RENDERING (canvas-based)
// =============================
function renderWallFromAppearance(room, dir, gameDiv) {
    const segments = room.appearance.walls[dir];
    if (!segments || !segments.length) return;

    const width = gameDiv.clientWidth || 1280;
    const height = gameDiv.clientHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';

    const ctx = canvas.getContext('2d');
    const base = room.appearance.wallPalette;

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

    gameDiv.appendChild(canvas);
}


// =============================
// ENEMY RENDER
// =============================
function renderEnemy(room, gameDiv) {
    const img = document.createElement('img');
    img.src = `app/images/${room.enemy.toLowerCase().replaceAll(' ', '_')}.png`;
    img.className = 'enemy';
    if (room.isBoss) img.classList.add('boss');

    img.style.left = '12%';
    img.style.top = '50%';

    const hb = document.createElement('div');
    hb.id = 'enemyHealthBar';
    hb.style.position = 'absolute';
    hb.style.left = '9%';
    hb.style.top = '37%';
    hb.style.width = '80px';
    hb.style.height = '5px';
    hb.style.border = '1px solid white';
    hb.style.background = 'red';
    hb.style.overflow = 'hidden';

    const fill = document.createElement('div');
    fill.id = 'enemyHealthFill';
    fill.style.height = '100%';
    fill.style.background = 'green';

    const pct = Math.max(0, (room.enemyHealth / room.enemyMaxHealth) * 100);
    fill.style.width = pct + '%';

    hb.appendChild(fill);
    gameDiv.appendChild(img);
    gameDiv.appendChild(hb);
}


// =============================
// ITEM RENDER HELPERS
// =============================
function renderWeapon(room, gameDiv) { renderSimpleItem(room.weapon, 'weapon', room, gameDiv, '30%'); }
function renderFood(room, gameDiv) { renderSimpleItem(room.food, 'food', room, gameDiv, '70%'); }
function renderOtherItem(room, gameDiv) { renderSimpleItem(room.otherItem, 'otherItem', room, gameDiv, '50%'); }
function renderHealth(room, gameDiv) { renderSimpleItem(room.health, 'health', room, gameDiv, '60%'); }
function renderShield(room, gameDiv) { renderSimpleItem(room.shield, 'shield', room, gameDiv, '40%'); }

function renderSimpleItem(name, cls, room, gameDiv, left) {
    const img = document.createElement('img');
    img.src = `app/images/${name.toLowerCase().replaceAll(' ', '_')}.png`;
    img.className = cls;
    img.style.left = left;
    img.style.top = '50%';
    gameDiv.appendChild(img);
}


// =============================
// DUNGEON EXIT RENDER
// =============================
function renderDungeonExit(room, gameDiv) {
    const exit = room.dungeonExits[0];
    const img = document.createElement('img');
    img.src = `app/images/${exit.name.toLowerCase().replaceAll(' ', '_').replaceAll('\'','')}.png`;
    img.className = 'dungeonExit';
    img.style.left = '20%';
    img.style.top = '25%';
    gameDiv.appendChild(img);
}


// =============================
// MINI MAP
// =============================
function renderMiniMap() {
    const map = document.getElementById('mini-map');
    map.innerHTML = '';

    dungeon.forEach((room, idx) => {
        const div = document.createElement('div');
        div.className = 'mini-room';

        if (room.discovered) div.classList.add('discovered');
        if (room.isBoss) div.classList.add(room.enemy === 'Oracle' ? 'oracleRoom' : 'bossRoom');
        if (room.dungeonExits.length > 0) div.classList.add('exitRoom');
        if (idx === getIndex(currentX, currentY)) div.classList.add('current');

        room.exits.forEach(dir => {
            const e = document.createElement('div');
            e.className = `mini-exit ${dir.toLowerCase()}`;
            div.appendChild(e);
        });

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


// =============================
// INVENTORY
// =============================
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



// =============================
// APPEARANCE GENERATION
// =============================

function generateRoomAppearance(room) {
    if (!room.appearance) room.appearance = {};

    room.appearance.wallPalette = BASE_BROWN;

    room.appearance.walls = {
        UP: generateWallSegmentsForSide('UP', room.exits.includes('UP')),
        DOWN: generateWallSegmentsForSide('DOWN', room.exits.includes('DOWN')),
        LEFT: generateWallSegmentsForSide('LEFT', room.exits.includes('LEFT')),
        RIGHT: generateWallSegmentsForSide('RIGHT', room.exits.includes('RIGHT'))
    };
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
