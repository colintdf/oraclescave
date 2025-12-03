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
// DEBUG
// =============================

function dbgState(label) {
    return false;
    console.log(
        `%c[DBG] ${label} | phase=${playerSpriteState.phase} idleAnimating=${playerSpriteState.idleAnimating} anim=${playerIsAnimating} dir=${playerSpriteState.dir}`,
        "color:#0af"
    );
}

function dbgIdleCheck() {
    return false;
    const now = performance.now();
    const diff = nextIdleAt - now;
    console.log(
        `%c[IDLE-DBG] now=${now.toFixed(0)} nextIdleAt=${nextIdleAt.toFixed(0)} Δ=${diff.toFixed(0)}ms phase=${playerSpriteState.phase} idleAnimating=${playerSpriteState.idleAnimating}`,
        "color:#fa0"
    );
}

// =============================
// PLAYER STATE
// =============================

var playerSpriteState = {
    x: 0,
    y: 0,
    dir: "down",
    phase: "idle",
    targetX: 0,
    targetY: 0,
    nextRoom: null,
    lastTimestamp: null,
    initialised: false,
    animStart: performance.now(),
    idleAnimating: false
};

var playerIsAnimating = false;

var nextIdleAt = performance.now() + 2000;
const IDLE_TRIGGER_MIN = 2000;
const IDLE_TRIGGER_MAX = 5000;

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
   // console.log("[DBG] Enemy present?", present);
    return present;
}

// =============================
// FRAME OFFSET
// =============================

function getFrameOffset(dirKey, phaseTime, phase) {
    const row = DIR_TO_ROW[dirKey];
    let framesThisDir = (phase === "idle" ? IDLE_FRAMES[dirKey] : FRAMES_PER_DIR);
    let fps = (phase === "idle" ? IDLE_FPS : MOVE_FPS);
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
// ONE-SHOT IDLE ANIMATION
// =============================

function runIdleAnimationOnce() {
   // console.log("%c[IDLE] Triggered!", "color:yellow");
    dbgState("Idle animation starting");

    const sprite = document.getElementById("player-sprite");
    if (!sprite) return;

    playerSpriteState.idleAnimating = true;
    playerSpriteState.animStart = performance.now();

    if (isEnemyPresent()) {
        playerSpriteState.dir = "left";
    } else {
        const dirs = ["down", "left", "right", "up"];
        playerSpriteState.dir = dirs[Math.floor(Math.random() * dirs.length)];
    }

    const start = performance.now();

    function step(now) {
        const t = (now - start) / 1000;
        const total = IDLE_FRAMES[playerSpriteState.dir];
        const frame = Math.floor(t * IDLE_FPS);

        if (frame >= total) {
            playerSpriteState.idleAnimating = false;
            playerSpriteState.animStart = performance.now();
            return;
        }

        const { sx, sy } = getFrameOffset(playerSpriteState.dir, t, "idle");
        const scaleX = DISPLAY_W / INNER_W;
        const scaleY = DISPLAY_H / INNER_H;

        sprite.style.backgroundPosition =
            `-${sx * scaleX}px -${sy * scaleY}px`;

        requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

// =============================
// RENDER
// =============================

function renderPlayerSprite(gameDiv) {
    if (!gameDiv) return;

    const { w, h } = getRoomDimensions();

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
        sprite.style.zIndex = "9999";
        sprite.style.backgroundRepeat = "no-repeat";
        sprite.dataset.sheet = "";
        gameDiv.appendChild(sprite);
    }

    dbgIdleCheck();

    if (!playerIsAnimating &&
        playerSpriteState.phase === "idle" &&
        isEnemyPresent()) {
        playerSpriteState.dir = "left";
    }

    let sheet, cols, rows;

    if (playerSpriteState.phase === "idle") {
        sheet = PLAYER_SPRITE_SHEET_IDLE;
        cols = IDLE_TOTAL_COLS;
        rows = IDLE_ROWS;
    } else {
        sheet = PLAYER_SPRITE_SHEET_MOVE;
        cols = FRAMES_PER_DIR;
        rows = 4;
    }

    const img = (playerSpriteState.phase === "idle")
        ? spriteSheets.idle
        : spriteSheets.move;

    const scaleX = DISPLAY_W / INNER_W;
    const scaleY = DISPLAY_H / INNER_H;

    // FIX #1: Apply background-size BEFORE changing the image
    sprite.style.backgroundSize =
        `${cols * FRAME_W * scaleX}px ${rows * FRAME_H * scaleY}px`;

    // FIX #2: Only change background-image when it actually changed
    if (sprite.dataset.sheet !== img.src) {
        sprite.dataset.sheet = img.src;
        sprite.style.backgroundImage = `url(${img.src})`;
    }

    sprite.style.left = playerSpriteState.x + "px";
    sprite.style.top = playerSpriteState.y + "px";

    const now = performance.now();
    const t = (now - playerSpriteState.animStart) / 1000;

    if (!playerSpriteState.idleAnimating) {
        const { sx, sy } = getFrameOffset(
            playerSpriteState.dir,
            playerSpriteState.phase === "idle" ? 0 : t,
            playerSpriteState.phase
        );

        sprite.style.backgroundPosition = `-${sx * scaleX}px -${sy * scaleY}px`;
    }

    const readyForIdle =
        !playerIsAnimating &&
        playerSpriteState.phase === "idle" &&
        !playerSpriteState.idleAnimating &&
        now >= nextIdleAt;

    if (readyForIdle) {
        runIdleAnimationOnce();
        nextIdleAt =
            now + IDLE_TRIGGER_MIN +
            Math.random() * (IDLE_TRIGGER_MAX - IDLE_TRIGGER_MIN);
    }
}

// =============================
// EXIT / ENTRY POSITIONS
// =============================

function getExitPositionForDirection(dir) {
    const { w, h } = getRoomDimensions();
    const margin = 40;

    switch (dir) {
        case "UP": return { x: w * 0.5, y: WALL_THICKNESS_PERC * h + margin };
        case "DOWN": return { x: w * 0.5, y: h - WALL_THICKNESS_PERC * h - margin };
        case "LEFT": return { x: WALL_THICKNESS_PERC * w + margin, y: h * 0.5 };
        case "RIGHT": return { x: w - WALL_THICKNESS_PERC * w - margin, y: h * 0.5 };
        default: return { x: w * 0.5, y: h * 0.5 };
    }
}

function getEntryPositionForDirection(dir) {
    const { w, h } = getRoomDimensions();
    const margin = 40;

    switch (dir) {
        case "UP": return { x: w * 0.5, y: h - WALL_THICKNESS_PERC * h - margin };
        case "DOWN": return { x: w * 0.5, y: WALL_THICKNESS_PERC * h + margin };
        case "LEFT": return { x: w - WALL_THICKNESS_PERC * w - margin, y: h * 0.5 };
        case "RIGHT": return { x: WALL_THICKNESS_PERC * w + margin, y: h * 0.5 };
        default: return { x: w * 0.5, y: h * 0.5 };
    }
}

// =============================
// START ROOM TRANSITION
// =============================

function startRoomTransition(direction, nextGridX, nextGridY) {
    if (playerIsAnimating) return;

    playerSpriteState.phase = "toExit";

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
// MOVEMENT ANIMATION
// =============================

function animatePlayerSprite(timestamp) {
    if (!playerIsAnimating) return;

    if (!playerSpriteState.lastTimestamp)
        playerSpriteState.lastTimestamp = timestamp;

    const dt = (timestamp - playerSpriteState.lastTimestamp) / 1000;
    playerSpriteState.lastTimestamp = timestamp;

    const sprite = document.getElementById("player-sprite");

    const now = performance.now();
    const t = (now - playerSpriteState.animStart) / 1000;

    const { sx, sy } = getFrameOffset(playerSpriteState.dir, t, playerSpriteState.phase);
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
        playerSpriteState.x = playerSpriteState.targetX;
        playerSpriteState.y = playerSpriteState.targetY;

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

        if (playerSpriteState.phase === "toCenter") {
            playerSpriteState.phase = "idle";
            playerIsAnimating = false;
            playerSpriteState.animStart = performance.now();

            nextIdleAt = performance.now() +
                IDLE_TRIGGER_MIN +
                Math.random() * (IDLE_TRIGGER_MAX - IDLE_TRIGGER_MIN);

            renderPlayerSprite(document.getElementById("game"));
            return;
        }

    } else {
        const nx = dx / dist;
        const ny = dy / dist;
        playerSpriteState.x += nx * step;
        playerSpriteState.y += ny * step;

        updateSpriteDirectionFromVector(nx, ny);
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
