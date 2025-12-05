// =============================
// PLAYER SPRITE SHEETS & SETTINGS
// =============================

const PLAYER_SPRITE_SHEET_MOVE = "app/images/player/sprites.png";
const PLAYER_SPRITE_SHEET_IDLE = "app/images/player/idle.png";

const FRAME_W = 64;
const FRAME_H = 64;

const MOVE_FPS = 12;
const IDLE_FPS = 4;

const INNER_W = 24;
const INNER_H = 24;
const INNER_OFFSET = 20;

const DISPLAY_W = 60;
const DISPLAY_H = 60;

const FRAMES_PER_DIR = 6;

const IDLE_FRAMES = {
    down: 12,
    left: 12,
    right: 12,
    up: 4
};

const IDLE_TOTAL_COLS = 12;
const IDLE_ROWS = 4;

const PLAYER_SPEED_PX_PER_SEC = 180;

const DIR_TO_ROW = {
    down: 0,
    left: 1,
    right: 2,
    up: 3
};

// =============================
// DEBUG (disabled)
// =============================

function dbgState(label) {
    return false;
     console.log(
        `[DBG] ${label} | phase=${playerSpriteState.phase} anim=${playerIsAnimating} dir=${playerSpriteState.dir}`
    );
}

function dbgIdleCheck() {
    return false;
    const now = performance.now();
     console.log(
        `[IDLE-DBG] now=${now.toFixed(0)} phase=${playerSpriteState.phase}`
    );
}

// =============================
// PLAYER STATE
// =============================

var playerSpriteState = {
    x: 0,
    y: 0,
    dir: "down",        // "up" | "down" | "left" | "right"
    phase: "idle",      // "idle" | "move" | "toExit" | "toCenter"
    targetX: 0,
    targetY: 0,
    nextRoom: null,
    lastTimestamp: null,
    initialised: false,
    animStart: performance.now()
};

var playerIsAnimating = false;

// =============================
// DIMENSIONS
// =============================

function getRoomDimensions() {
    const gameDiv = document.getElementById("game");
    const w = gameDiv ? (gameDiv.clientWidth || 1290) : 1290;
    const h = gameDiv ? (gameDiv.clientHeight || 730) : 730;
    return { w, h };
}

// =============================
// ENEMY CHECK
// =============================

function isEnemyPresent() {
    const room = dungeon[getIndex(currentX, currentY)];
    const present = !!room.enemy && room.enemyHealth > 0;
    return present;
}

// =============================
// FRAME OFFSET
// =============================

function getFrameOffset(dirKey, phaseTime, phase) {
    const row = DIR_TO_ROW[dirKey];

    // For everything except "idle", use movement sheet timing
    const isIdle = (phase === "idle");
    const framesThisDir = isIdle ? IDLE_FRAMES[dirKey] : FRAMES_PER_DIR;
    const fps = isIdle ? IDLE_FPS : MOVE_FPS;

    const frame = Math.floor(phaseTime * fps) % framesThisDir;

    return {
        sx: frame * FRAME_W + INNER_OFFSET,
        sy: row * FRAME_H + INNER_OFFSET,
        frameIndex: frame
    };
}

function updateSpriteDirectionFromVector(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
        playerSpriteState.dir = dx > 0 ? "right" : "left";
    } else {
        playerSpriteState.dir = dy > 0 ? "down" : "up";
    }
}

// =============================
// RENDER HELPERS
// =============================

function getSpriteFeetOffset(el) {
    if (el.id === "player-sprite") {
        return 30;
    }
    return 0;
}

// =============================
// MAIN SPRITE RENDER
// =============================

function renderPlayerSprite(gameDiv) {
    if (!gameDiv) return;

    const { w, h } = getRoomDimensions();

    // Initial placement at room center
    if (!playerSpriteState.initialised) {
        playerSpriteState.x = w * 0.5;
        playerSpriteState.y = h * 0.5;
        playerSpriteState.targetX = playerSpriteState.x;
        playerSpriteState.targetY = playerSpriteState.y;
        playerSpriteState.initialised = true;
        playerSpriteState.animStart = performance.now();
    }

    let sprite = document.getElementById("player-sprite");
    if (!sprite) {
        sprite = document.createElement("div");
        sprite.id = "player-sprite";
        sprite.style.position = "absolute";
        sprite.style.width = DISPLAY_W + "px";
        sprite.style.height = DISPLAY_H + "px";
        sprite.style.transform = "translate(-50%, -50%)";
        sprite.style.backgroundRepeat = "no-repeat";
        sprite.dataset.sheet = "";
        gameDiv.appendChild(sprite);
    }

    dbgIdleCheck();

    // If idle and an enemy is present, face left like before
    if (!playerIsAnimating &&
        playerSpriteState.phase === "idle" &&
        isEnemyPresent()) {
        playerSpriteState.dir = "left";
    }

    // Decide which sheet to use based on phase
    let cols, rows, img;
    if (playerSpriteState.phase === "idle") {
        cols = IDLE_TOTAL_COLS;
        rows = IDLE_ROWS;
        img = spriteSheets.idle;
    } else {
        cols = FRAMES_PER_DIR;
        rows = 4;
        img = spriteSheets.move;
    }

    const scaleX = DISPLAY_W / INNER_W;
    const scaleY = DISPLAY_H / INNER_H;

    // Set background-size based on sheet grid
    const sizeKey = `${cols}x${rows}`;
    if (sprite.dataset.size !== sizeKey) {
        sprite.dataset.size = sizeKey;
        sprite.style.backgroundSize =
            `${cols * FRAME_W * scaleX}px ${rows * FRAME_H * scaleY}px`;
    }

    // Only change background-image when it actually changes
    if (img && sprite.dataset.sheet !== img.src) {
        sprite.dataset.sheet = img.src;
        sprite.style.backgroundImage = `url(${img.src})`;
        // Reset animation timer on sheet swap for stable frames
        playerSpriteState.animStart = performance.now();
    }

    // Position sprite
    sprite.style.left = playerSpriteState.x + "px";
    sprite.style.top = playerSpriteState.y + "px";

    // Depth sorting: higher Y = in front, lower Y = behind
    if (typeof applyDepthSorting === "function") {
        applyDepthSorting(sprite);
    }

    // Animate current phase
    const now = performance.now();
    const t = (now - playerSpriteState.animStart) / 1000;

    let phaseKey = playerSpriteState.phase;
    if (phaseKey !== "idle" && phaseKey !== "move") {
        phaseKey = "move"; // transitions still use movement frames
    }
    const { sx, sy } = getFrameOffset(
        playerSpriteState.dir,
        t,
        phaseKey
    );

    sprite.style.backgroundPosition =
        `-${sx * scaleX}px -${sy * scaleY}px`;
}

// =============================
// EXIT / ENTRY POSITIONS
// =============================

function getExitPositionForDirection(dir) {
    const { w, h } = getRoomDimensions();
    const margin = 40;

    switch (dir) {
        case "UP":
            return { x: w * 0.5, y: WALL_THICKNESS_PERC * h + margin };
        case "DOWN":
            return { x: w * 0.5, y: h - WALL_THICKNESS_PERC * h - margin };
        case "LEFT":
            return { x: WALL_THICKNESS_PERC * w + margin, y: h * 0.5 };
        case "RIGHT":
            return { x: w - WALL_THICKNESS_PERC * w - margin, y: h * 0.5 };
        default:
            return { x: w * 0.5, y: h * 0.5 };
    }
}

function getEntryPositionForDirection(dir) {
    const { w, h } = getRoomDimensions();
    const margin = 40;

    switch (dir) {
        case "UP":
            return { x: w * 0.5, y: h - WALL_THICKNESS_PERC * h - margin };
        case "DOWN":
            return { x: w * 0.5, y: WALL_THICKNESS_PERC * h + margin };
        case "LEFT":
            return { x: w - WALL_THICKNESS_PERC * w - margin, y: h * 0.5 };
        case "RIGHT":
            return { x: WALL_THICKNESS_PERC * w + margin, y: h * 0.5 };
        default:
            return { x: w * 0.5, y: h * 0.5 };
    }
}

// =============================
// START ROOM TRANSITION
// =============================

function startRoomTransition(direction, nextGridX, nextGridY) {
    if (playerIsAnimating) return;
    playerSpriteState.animStart = performance.now();

    playerSpriteState.phase = "toExit";
    playerIsAnimating = true;

    if (direction === "UP") playerSpriteState.dir = "up";
    if (direction === "DOWN") playerSpriteState.dir = "down";
    if (direction === "LEFT") playerSpriteState.dir = "left";
    if (direction === "RIGHT") playerSpriteState.dir = "right";

    playerSpriteState.animStart = performance.now();

    playerSpriteState.nextRoom = { x: nextGridX, y: nextGridY, dir: direction };

    const exitPos = getExitPositionForDirection(direction);
    playerSpriteState.targetX = exitPos.x;
    playerSpriteState.targetY = exitPos.y;

    playerSpriteState.lastTimestamp = null;
    playerIsAnimating = true;

    renderPlayerSprite(document.getElementById("game"));
    requestAnimationFrame(animatePlayerSprite);
}

// =============================
// MOVEMENT ANIMATION (SCREEN TRANSITION)
// =============================

function animatePlayerSprite(timestamp) {
    if (!playerIsAnimating) return;

    if (!playerSpriteState.lastTimestamp) {
        playerSpriteState.lastTimestamp = timestamp;
    }

    const dt = (timestamp - playerSpriteState.lastTimestamp) / 1000;
    playerSpriteState.lastTimestamp = timestamp;

    const sprite = document.getElementById("player-sprite");

    const now = performance.now();
    const t = (now - playerSpriteState.animStart) / 1000;

    // Use movement timing for transitions
    const { sx, sy } = getFrameOffset(
        playerSpriteState.dir,
        t,
        "move"
    );
    const scaleX = DISPLAY_W / INNER_W;
    const scaleY = DISPLAY_H / INNER_H;

    if (sprite) {
        sprite.style.backgroundPosition =
            `-${sx * scaleX}px -${sy * scaleY}px`;
    }

    const dx = playerSpriteState.targetX - playerSpriteState.x;
    const dy = playerSpriteState.targetY - playerSpriteState.y;
    const dist = Math.hypot(dx, dy);
    const step = PLAYER_SPEED_PX_PER_SEC * dt;

    if (dist <= step) {
        // Snap to target
        playerSpriteState.x = playerSpriteState.targetX;
        playerSpriteState.y = playerSpriteState.targetY;

        // Reached exit, now change room
        if (playerSpriteState.phase === "toExit") {
            const nr = playerSpriteState.nextRoom;

            currentX = nr.x;
            currentY = nr.y;

            renderRoom();

            const entryPos = getEntryPositionForDirection(nr.dir);
            playerSpriteState.x = entryPos.x;
            playerSpriteState.y = entryPos.y;

            playerSpriteState.phase = "toCenter";

            const dims = getRoomDimensions();
            playerSpriteState.targetX = dims.w * 0.5;
            playerSpriteState.targetY = dims.h * 0.5;

            playerSpriteState.animStart = performance.now();
            playerSpriteState.lastTimestamp = null;

            requestAnimationFrame(animatePlayerSprite);
            return;
        }

        // Reached center, back to idle
        if (playerSpriteState.phase === "toCenter") {
            playerSpriteState.phase = "idle";
            playerIsAnimating = false;
            playerSpriteState.animStart = performance.now();

            renderPlayerSprite(document.getElementById("game"));
            return;
        }

    } else {
        // Move towards target
        const nx = dx / dist;
        const ny = dy / dist;
        playerSpriteState.x += nx * step;
        playerSpriteState.y += ny * step;

        if (playerSpriteState.phase === "move") {
            updateSpriteDirectionFromVector(nx, ny);
        }    
    }

    if (sprite) {
        sprite.style.left = playerSpriteState.x + "px";
        sprite.style.top = playerSpriteState.y + "px";

        if (sprite.parentElement &&
            sprite.parentElement.lastChild !== sprite) {
            sprite.parentElement.appendChild(sprite);
        }
    }

    requestAnimationFrame(animatePlayerSprite);
}

// =============================
// IDLE LOOP
// =============================

function idleLoop() {
    const gameDiv = document.getElementById("game");

    if (!document.getElementById("start-screen")) {
        renderPlayerSprite(gameDiv);
    }

    requestAnimationFrame(idleLoop);
}


function hasArtifactForExit(room) {
    if (!room.dungeonExits || room.dungeonExits.length === 0) return null;

    const exit = room.dungeonExits[0];
    const needed = exit.activationArtifact;

    const hasIt =
        player.inventory.otherItem &&
        player.inventory.otherItem.some(o => o.name === needed);

    return hasIt ? exit : null;
}

function completeGame(exitObj) {
    showPopup("You hold the " + exitObj.activationArtifact + ". The " + exitObj.name + " activates!", true);

    setTimeout(() => {
        showPopup("You escape the Oracle's Dungeon!", true);
        setTimeout(() => location.reload(), 2000);
    }, 1200);
}
