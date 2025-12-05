// =====================
// FULL INPUT.JS (FIXED SHIELD + EXIT RESTORE + ANIMATED MOVEMENT)
// ====// ===========================
// GLOBAL MOVEMENT STATE
// ===========================
window._movementKeys = new Set();
window._lastFrameTime = performance.now();
window._movementActive = false;
const PLAYER_COLLISION_PAD = 40; // pixels: adjust slightly if needed

function isKeyDown(k) {
    return window._movementKeys.has(k);
}

function isPlayerAtExitGap(dir) {
    console.log("Checking exit gap for", dir);
    const { w, h } = getRoomDimensions();
    const px = playerSpriteState.x;
    const py = playerSpriteState.y;

    const gapStart = 0.5 - EXIT_GAP_PERC / 2;
    const gapEnd   = 0.5 + EXIT_GAP_PERC / 2;

    const wallPxY = WALL_THICKNESS_PERC * h;
    const wallPxX = WALL_THICKNESS_PERC * w;

    // Pad the hitbox *inward* to prevent diagonal slipping
    const pad = PLAYER_COLLISION_PAD;

    switch (dir) {
        case 'UP': {
            const xMin = gapStart * w;
            const xMax = gapEnd * w;
            const yMin = 0;
            const yMax = wallPxY + pad;
            console.log(`UP gap box: x[${xMin}-${xMax}] y[${yMin}-${yMax}]`);
            return px >= xMin && px <= xMax && py >= yMin && py <= yMax;
        }

        case 'DOWN': {
            const xMin = gapStart * w;
            const xMax = gapEnd * w;
            const yMin = h - wallPxY - pad;
            const yMax = h;
            console.log(`DOWN gap box: x[${xMin}-${xMax}] y[${yMin}-${yMax}]`);
            return px >= xMin && px <= xMax && py >= yMin && py <= yMax;
        }

        case 'LEFT': {
            const xMin = 0;
            const xMax = wallPxX + pad;
            const yMin = gapStart * h;
            const yMax = gapEnd * h;
            console.log(`LEFT gap box: x[${xMin}-${xMax}] y[${yMin}-${yMax}]`);
            return px >= xMin && px <= xMax && py >= yMin && py <= yMax;
        }

        case 'RIGHT': {
            const xMin = w - wallPxX - pad;
            const xMax = w;
            const yMin = gapStart * h;
            const yMax = gapEnd * h;
            console.log(`RIGHT gap box: x[${xMin}-${xMax}] y[${yMin}-${yMax}]`);
            return px >= xMin && px <= xMax && py >= yMin && py <= yMax;
        }
    }

    return false;
}


// Movement wrapper – original behaviour + animation hook
function movePlayer(direction) {
    // Prevent new moves while animating a transition
    if (typeof playerIsAnimating !== 'undefined' && playerIsAnimating) {
        return;
    }
    if (direction === 'UP') playerSpriteState.dir = 'up';
    if (direction === 'DOWN') playerSpriteState.dir = 'down';
    if (direction === 'LEFT') playerSpriteState.dir = 'left';
    if (direction === 'RIGHT') playerSpriteState.dir = 'right';

    // reset animation timer so first moving frame shows instantly
    playerSpriteState.animStart = performance.now();

    const currentRoom = dungeon[getIndex(currentX, currentY)];

    // Sleeping enemy wake-up check
    if (currentRoom.enemy && currentRoom.enemyStatus === 'sleeping') {
        if (Math.random() < 0.5) {
            showPopup('The ' + currentRoom.enemy + ' wakes up!');
            let newStatus;
            do {
                newStatus = ENEMY_STATUSES[Math.floor(Math.random() * ENEMY_STATUSES.length)];
            } while (newStatus === 'sleeping');

            currentRoom.enemyStatus = newStatus;

            if (newStatus === 'furious' || newStatus === 'hungry') {
                currentRoom.storedExits = currentRoom.exits;
                currentRoom.exits = [];
            }

            renderRoom();
            return;
        }
    }

    // BLOCKING RULE – furious / hungry enemies block exits
    if (currentRoom.enemy &&
        (currentRoom.enemyStatus === 'furious' || currentRoom.enemyStatus === 'hungry')) {

        showPopup('The ' + currentRoom.enemy + ' is blocking the exits!', false);
        return;
    }

    const [dx, dy] = DIRECTIONS[direction];
    const nextX = currentX + dx;
    const nextY = currentY + dy;

    if (currentRoom.exits.includes(direction) && isInBounds(nextX, nextY)) {
        // Smooth transition instead of instant teleport
        if (typeof startRoomTransition === 'function') {
            startRoomTransition(direction, nextX, nextY);
        } else {
            // Fallback: original behaviour if animation is not available
            currentX = nextX;
            currentY = nextY;
            renderRoom();
        }
    }
}

function pickUpItem(forcedItem = null) {


    let currentRoom = dungeon[getIndex(currentX, currentY)];
    let items = [];

    if (currentRoom.weapon) items.push(currentRoom.weapon);
    if (currentRoom.food) items.push(currentRoom.food);
    if (currentRoom.health) items.push(currentRoom.health);
    if (currentRoom.shield) items.push(currentRoom.shield);
    if (currentRoom.otherItem) items.push(currentRoom.otherItem);

    if (items.length === 0) return;

    let selectedItem;

    if (forcedItem) {
        selectedItem = forcedItem;          // direct pickup (mouse click)
    } else {
        // original prompt-based selection
        let itemIndex = prompt(
            `Select an item to pick up:\n${items.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`
        );
        if (!itemIndex) return;
        itemIndex = parseInt(itemIndex) - 1;
        selectedItem = items[itemIndex];
    }

    // Enemy reacts BEFORE item pickup
    if (currentRoom.enemy && currentRoom.enemyStatus !== 'furious' && currentRoom.enemyStatus !== 'sleeping') {
        currentRoom.storedExits = currentRoom.exits;
        currentRoom.exits = [];
        currentRoom.enemyStatus = 'furious';
        showPopup(`The ${currentRoom.enemy} becomes furious and blocks the exits.`);
        renderRoom();
        return;
    }

    if (currentRoom.enemy && currentRoom.enemyStatus === 'sleeping') {
        if (Math.random() < 0.8) {
            showPopup('The ' + currentRoom.enemy + ' wakes up!');
            let newStatus;
            do {
                newStatus = ENEMY_STATUSES[Math.floor(Math.random() * ENEMY_STATUSES.length)];
            } while (newStatus === 'sleeping');

            currentRoom.enemyStatus = newStatus;

            if (newStatus === 'furious' || newStatus === 'hungry') {
                currentRoom.storedExits = currentRoom.exits;
                currentRoom.exits = [];
            }
            
            renderRoom();
            return;
        }
    }

    const wasWeapon = (currentRoom.weapon === selectedItem);
    const wasFood = (currentRoom.food === selectedItem);
    const wasHealth = (currentRoom.health === selectedItem);
    const wasShield = (currentRoom.shield === selectedItem);
    const wasOther = (currentRoom.otherItem === selectedItem);

    // ===========================
    // WEAPON PICKUP
    // ===========================
    if (WEAPON_ITEMS.map(w => w.name).includes(selectedItem)) {

        if (player.inventory.weapon.length > 0) {
            let old = player.inventory.weapon[0];
            player.oldWeapon = old.name;
            player.oldWeaponStrength = old.strength;
            player.oldWeaponUses = old.uses;
            player.inventory.weapon = [];
            player.weaponstrength = 10;
            showPopup(`You drop your ${old.name} and pick up the ${selectedItem}.`);
        }

        player.weaponstrength = currentRoom.weaponStrength;
        player.weaponuses = currentRoom.weaponUses;
        player.weapon = selectedItem;

        player.inventory.weapon.push({
            name: selectedItem,
            strength: currentRoom.weaponStrength,
            uses: currentRoom.weaponUses
        });
    }

    // ===========================
    // SHIELD PICKUP
    // ===========================
    if (SHIELD_ITEMS.map(s => s.name).includes(selectedItem)) {

        if (player.shield === selectedItem) {
            currentRoom.shield = null;
            currentRoom.shieldStrength = null;
            currentRoom.shieldUses = null;
            showPopup(`You already have the ${selectedItem}.`);
           // renderRoom();
            return;
        }

        if (player.inventory.shield.length > 0) {
            let old = player.inventory.shield[0];
            player.oldShield = old.name;
            player.oldShieldStrength = old.strength;
            player.oldShieldUses = old.uses;
            player.inventory.shield = [];
            showPopup(`You drop your ${old.name} and pick up the ${selectedItem}.`);
        }

        player.shieldstrength = currentRoom.shieldStrength;
        player.shielduses = currentRoom.shieldUses;
        player.shield = selectedItem;

        player.inventory.shield.push({
            name: selectedItem,
            strength: player.shieldstrength,
            uses: player.shielduses
        });
    }

    // ===========================
    // FOOD + HEALTH PICKUP
    // ===========================
    if (FOOD_ITEMS.map(f => f.name).includes(selectedItem) ||
        HEALTH_ITEMS.map(h => h.name).includes(selectedItem)) {

        let inv =
            player.inventory.food.find(i => i.name === selectedItem) ||
            player.inventory.health.find(i => i.name === selectedItem);

        if (inv) {
            inv.quantity += 1;
        } else {
            player.inventory.food.push({ name: selectedItem, quantity: 1 });
        }

      //  alert(`You pick up the ${selectedItem}.`);
    }

    // ===========================
    // OTHER ITEMS (Map, etc)
    // ===========================
    if (OTHER_ITEMS.map(o => o.name).includes(selectedItem)) {

        if (selectedItem === 'Map') {
            let roomsRevealed = Math.floor(Math.random() * 10) + 1;
            let adj = [];

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    let nx = currentX + dx;
                    let ny = currentY + dy;
                    if (isInBounds(nx, ny)) adj.push(getIndex(nx, ny));
                }
            }

            let revealList = [];
            while (roomsRevealed-- > 0 && adj.length > 0) {
                revealList.push(adj.splice(Math.floor(Math.random() * adj.length), 1)[0]);
            }

            revealList.forEach(i => dungeon[i].discovered = true);
            showPopup('The map reveals some of the surrounding caves.');
            renderMiniMap();
        }
    }

    // ===========================
    // REMOVE ITEM FROM ROOM
    // ===========================
    if (wasWeapon) {
        if (player.oldWeapon) {
            currentRoom.weapon = player.oldWeapon;
            currentRoom.weaponStrength = player.oldWeaponStrength;
            currentRoom.weaponUses = player.oldWeaponUses;
            player.oldWeapon = null;
            player.oldWeaponStrength = null;
            player.oldWeaponUses = null;
        } else {
            currentRoom.weapon = null;
            currentRoom.weaponStrength = null;
            currentRoom.weaponUses = null;
        }
    }

    if (wasFood) {
        currentRoom.food = null;
        currentRoom.foodHealth = null;
    }

    if (wasHealth) {
        currentRoom.health = null;
        currentRoom.healthValue = null;
    }

    if (wasShield) {
        if (player.oldShield) {
            currentRoom.shield = player.oldShield;
            currentRoom.shieldStrength = player.oldShieldStrength;
            currentRoom.shieldUses = player.oldShieldUses;
            player.oldShield = null;
            player.oldShieldStrength = null;
            player.oldShieldUses = null;
        } else {
            currentRoom.shield = null;
            currentRoom.shieldStrength = null;
            currentRoom.shieldUses = null;
        }
    }

    if (wasOther) {
        currentRoom.otherItem = null;
    }
    
    collectAudio.play();

    renderPlayerStatus();
    renderInventory();
    renderRoom();
}



// =====================
// ATTACK LOGIC (shield + exit restore fix applied)
// =====================

function attackEnemy() {
    let currentRoom = dungeon[getIndex(currentX, currentY)];

    if (!currentRoom.enemy) return;

    currentRoom.enemyStatus = 'furious';
    if (currentRoom.exits.length > 0) {
        currentRoom.storedExits = currentRoom.exits;
        currentRoom.exits = [];
    }


    let playerDamage = Math.floor(Math.random() * player.weaponstrength);
    playerDamage = Math.floor(playerDamage * DIFFICULTY_MULTIPLIERS[player.difficulty].strength);

    let enemyDamage = Math.floor(Math.random() * currentRoom.enemyStrength);

    if (currentRoom.enemyStatus === 'sleeping') enemyDamage = Math.floor(enemyDamage * 0.5);
    if (currentRoom.enemyStatus === 'furious') enemyDamage = Math.floor(enemyDamage * 1.5);

    // SHIELD DAMAGE REDUCTION + INVENTORY SYNC FIX
    if (player.shieldstrength > 0) {
        let shieldBlock = Math.floor(Math.random() * player.shieldstrength);
        enemyDamage -= shieldBlock;
        if (enemyDamage < 0) enemyDamage = 0;

        player.shielduses -= 1;

        // >>> SYNC INVENTORY shield durability (critical fix) <<<
        if (player.inventory.shield.length > 0) {
            player.inventory.shield[0].uses = player.shielduses;
        }

        if (player.shielduses === 0) {
            showPopup('Your ' + player.shield + ' breaks!');
            player.shieldstrength = 0;
            player.shielduses = -1;
            player.shield = 'None';
            player.inventory.shield = [];
        }
    }

    currentRoom.enemyHealth -= playerDamage;
    player.health -= enemyDamage;

    renderRoom(); 
    let msg =
        `You attack the ${currentRoom.enemy} and deal ${playerDamage} damage. ` +
        `The ${currentRoom.enemy} has ${currentRoom.enemyHealth} health left. ` +
        `The ${currentRoom.enemy} attacks you and deals ${enemyDamage} damage. ` +
        `You have ${player.health} health left.`;
    showPopup(msg);

    // Weapon usage + break logic
    if (player.weaponuses > 0 && player.weaponuses !== -1) {
        player.inventory.weapon[0].uses -= 1;
        player.weaponuses -= 1;

        if (player.weaponuses === 0) {
            if (player.weapon == 'Throwing Knives') showPopup('You are out of knives!');
            else if (player.weapon == 'Crossbow') showPopup('You are out of bolts!');
            else if (player.weapon == "Asterion's Wrath") showPopup('Asterions Wrath disintegrates!');
            else showPopup('Your ' + player.weapon + ' breaks!');

            player.weaponstrength = 10;
            player.weaponuses = -1;
            player.weapon = 'None';
            player.inventory.weapon = [];
        }
    }

    if (player.health <= 0) {
        showPopup(`You have been defeated by the ${currentRoom.enemy}. Game Over!`, true);
        location.reload();
        return;
    }

    // ENEMY DEFEATED
    if (currentRoom.enemyHealth <= 0) {
        showPopup(`You have defeated the ${currentRoom.enemy}.`);

        // >>> Restore exits if enemy blocked them <<<
        if (currentRoom.storedExits) {
            currentRoom.exits = currentRoom.storedExits;
            currentRoom.storedExits = null;
        }

       // descriptionDiv.textContent = `You have defeated the ${currentRoom.enemy}.`;

        currentRoom.enemy = null;
        currentRoom.enemyHealth = null;
        currentRoom.enemyStrength = null;
        currentRoom.enemyStatus = null;

        // Boss logic
        if (currentRoom.isBoss) {
            player.percentcomplete += 15;

            currentRoom.isBoss = false;

            player.inventory.artifacts.push({ name: currentRoom.artifact, quantity: 1 });

            dungeon.forEach(room => {
                if (room.enemy) room.enemyStatus = 'furious';
            });

            if (currentRoom.artifact === 'All Seeing Eye') {
                dungeon.forEach(room => room.discovered = true);
            }

            if (currentRoom.artifact === 'Sword of Power') {
                player.weaponstrength = 500;
                player.weaponuses = 10000;
                player.weapon = 'Sword of Power';
            }

            if (currentRoom.artifact === 'Shield of Ages') {
                player.shieldstrength = 500;
                player.shielduses = 10000;
                player.shield = 'Shield of Ages';

                // Sync inventory
                player.inventory.shield = [{
                    name: 'Shield of Ages',
                    strength: 500,
                    uses: 10000
                }];
            }

            if (currentRoom.artifact === 'Amulet of Souls') {
                player.health = 1000;
                player['max-health'] = 1000;
            }

            player.score += 1000;
            currentRoom.artifact = null;

        } else {
            player.percentcomplete += 10 / gameStatus.totalEnemies;
        }

        player.score += currentRoom.enemyScore;

        renderRoom();
    }
}


window.addEventListener("keydown", (e) => {
    window._movementKeys.add(e.key);

    // Start movement loop if not running
    if (!window._movementActive) {
        window._movementActive = true;
        requestAnimationFrame(movementLoop);
    }

    if (e.key === "f" || e.key === "F") attackEnemy();
    if (e.key === "p" || e.key === "P") pickUpItem();

    if (e.key === "u" || e.key === "U") {
        const room = dungeon[getIndex(currentX, currentY)];
        const exitObj = hasArtifactForExit(room);

        if (exitObj) {
            completeGame(exitObj);
            return;
        }

    // No artefact for this exit, fall through silently
}

   
});


window.addEventListener("keyup", (e) => {
    window._movementKeys.delete(e.key);

    // Stop when no keys pressed
    if (window._movementKeys.size === 0) {
      //  window._movementActive = false;
    }
});

function movementLoop(now) {
   // console.log("Movement loop tick at", now);

    if (!window._movementActive) return;

    const room = dungeon[getIndex(currentX, currentY)];
    const enemyBlocking = room.enemy &&
        (room.enemyStatus === 'furious' || room.enemyStatus === 'hungry');

    // SAFETY: If animation is stuck but we are NOT transitioning, reset it
    if (enemyBlocking && playerIsAnimating && playerSpriteState.phase === "toExit") {
        console.warn("Blocked transition cleaned up");
        playerIsAnimating = false;
        playerSpriteState.phase = "idle";
    }

    // ============================================================
    // FIX: NEVER STOP THE MOVEMENT LOOP
    // Old code incorrectly did:
    //   window._movementActive = false;
    //   window._movementKeys.clear();
    //   return;
    //
    // New behaviour: If we are in a transition animation,
    // movement keys are ignored but the loop continues running.
    // ============================================================
    let ignoreInput = false;
    if (playerIsAnimating && 
        (playerSpriteState.phase === "toExit" || playerSpriteState.phase === "toCenter")) {
        ignoreInput = true;
    }

    let dt = (now - window._lastFrameTime) / 1000;
    window._lastFrameTime = now;
    if (dt > 0.05) dt = 0.05;

    // ------------------------------------------------------------
    // Movement vector
    // ------------------------------------------------------------
    let dx = 0, dy = 0;

    if (!ignoreInput) {
        const up    = isKeyDown("ArrowUp") || isKeyDown("w") || isKeyDown("W");
        const down  = isKeyDown("ArrowDown") || isKeyDown("s") || isKeyDown("S");
        const left  = isKeyDown("ArrowLeft") || isKeyDown("a") || isKeyDown("A");
        const right = isKeyDown("ArrowRight") || isKeyDown("d") || isKeyDown("D");

        dx = (right ? 1 : 0) - (left ? 1 : 0);
        dy = (down ? 1 : 0) - (up ? 1 : 0);
    }

    // ------------------------------------------------------------
    // BLOCK EXIT movement only when moving TOWARD gap
    // ------------------------------------------------------------
    if (room.enemy &&
    (room.enemyStatus === 'furious' || room.enemyStatus === 'hungry')) {

    // Determine ALL attempted directions, not just one
    const dirs = [];

    if (dy < 0) dirs.push('UP');
    if (dy > 0) dirs.push('DOWN');
    if (dx < 0) dirs.push('LEFT');
    if (dx > 0) dirs.push('RIGHT');

    // Check each movement component
    for (const d of dirs) {
        const hasExit = (room.exits && room.exits.includes(d)) ||
                (room.storedExits && room.storedExits.includes(d));
        if (!hasExit) continue;

        // Detect if THIS component is pushing toward the exit gap
        const movingToward =
            (d === 'UP'    && dy < 0) ||
            (d === 'DOWN'  && dy > 0) ||
            (d === 'LEFT'  && dx < 0) ||
            (d === 'RIGHT' && dx > 0);



        if (movingToward && isPlayerAtExitGap(d)) {
            showPopup('The ' + room.enemy + ' is blocking the exits!', false);

            // Stop animation so sprite doesn't run-on-the-spot
            playerSpriteState.phase = "idle";
            playerIsAnimating = false;

            // IMPORTANT: Do NOT stop the loop, only this movement frame
            requestAnimationFrame(movementLoop);
            return;
        }
    }
}


    // ------------------------------------------------------------
    // Animation state
    // ------------------------------------------------------------
    if (!playerIsAnimating) {
        if (dx !== 0 || dy !== 0) {
            if (playerSpriteState.phase !== "move") {
                playerSpriteState.phase = "move";
                playerSpriteState.animStart = performance.now();
            }
        } else {
            if (playerSpriteState.phase !== "idle") {
                playerSpriteState.phase = "idle";
                playerSpriteState.animStart = performance.now();
            }
        }
    }

    // ------------------------------------------------------------
    // Movement
    // ------------------------------------------------------------
    if (dx !== 0 || dy !== 0) {
        tryFreeMove(dx, dy, dt);
    } else {
        if (playerSpriteState.phase !== "idle") {
            playerSpriteState.phase = "idle";
            playerSpriteState.animStart = 0;
            playerSpriteState.frame = 0;
            renderPlayerSprite(document.getElementById("game"));
        }
    }

    requestAnimationFrame(movementLoop);
}


// ===========================
// POINT-IN-POLYGON TEST
// ===========================
function pointInPoly(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x, yi = poly[i].y;
        const xj = poly[j].x, yj = poly[j].y;

        const intersect =
            ((yi > py) !== (yj > py)) &&
            (px < (xj - xi) * (py - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }
    return inside;
}

// ===========================
// WALL COLLISION CHECK
// ===========================
function checkCollisions(x, y) {
    const room = dungeon[getIndex(currentX, currentY)];
    if (!room.appearance || !room.appearance.walls) return false;

    const { w, h } = getRoomDimensions();

    // Player feet coordinates must be normalized to 0–1 for polygon checking
    const px = x / w;
    const py = y / h;

    for (const dir of ["UP", "DOWN", "LEFT", "RIGHT"]) {
        const segments = room.appearance.walls[dir];
        if (!segments) continue;

        for (const poly of segments) {
            if (pointInPoly(px, py, poly)) {
                return true; // collision
            }
        }
    }
    return false;
}



document.getElementById("game").addEventListener("click", (e) => {
    const game = e.currentTarget;
    const rect = game.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const w = rect.width;
    const h = rect.height;

    const margin = 60; // click zone thickness near edges
    const room = dungeon[getIndex(currentX, currentY)];

    // Check UP
    if (y < margin && room.exits.includes("UP")) {
        movePlayer("UP");
        return;
    }

    // Check DOWN
    if (y > h - margin && room.exits.includes("DOWN")) {
        movePlayer("DOWN");
        return;
    }

    // Check LEFT
    if (x < margin && room.exits.includes("LEFT")) {
        movePlayer("LEFT");
        return;
    }

    // Check RIGHT
    if (x > w - margin && room.exits.includes("RIGHT")) {
        movePlayer("RIGHT");
        return;
    }
});

let tooltipLocked = false;


const gameEl = document.getElementById("game");
const tooltip = document.getElementById("exit-tooltip");

gameEl.addEventListener("mousemove", (e) => {
        if (tooltipLocked) return;

    const rect = gameEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const w = rect.width;
    const h = rect.height;

    const margin = 60;   // same margin you used for gap-click
    const room = dungeon[getIndex(currentX, currentY)];

    let dir = null;

    // Detect UP
    if (y < margin && room.exits.includes("UP")) dir = "UP";

    // Detect DOWN
    else if (y > h - margin && room.exits.includes("DOWN")) dir = "DOWN";

    // Detect LEFT
    else if (x < margin && room.exits.includes("LEFT")) dir = "LEFT";

    // Detect RIGHT
    else if (x > w - margin && room.exits.includes("RIGHT")) dir = "RIGHT";

    if (dir) {
        // Change pointer
        gameEl.style.cursor = "pointer";

        // Tooltip text
        tooltip.textContent = `Exit ${dir}`;

        // Position slightly offset from mouse
        tooltip.style.left = (e.clientX + 12) + "px";
        tooltip.style.top  = (e.clientY + 12) + "px";

        tooltip.style.opacity = 1;
    } else {
        // Reset cursor + tooltip
        gameEl.style.cursor = "default";
        tooltip.style.opacity = 0;
    }
});


// ===========================
// NEW SMOOTH MOVEMENT
// ===========================
function tryFreeMove(dx, dy, dt) {
    // Normalize
    const len = Math.hypot(dx, dy);
    if (len > 0) {
        dx /= len;
        dy /= len;
    }

    const speed = PLAYER_SPEED_PX_PER_SEC * dt;  // from player.js  :contentReference[oaicite:3]{index=3}

    const nextX = playerSpriteState.x + dx * speed;
    const nextY = playerSpriteState.y + dy * speed;


    if (isCollidingWithEnemyFeet(nextX, nextY)) {
        return;
    }


    // Set movement animation
    playerSpriteState.phase = "move";
    updateSpriteDirectionFromVector(dx, dy);

    const room = dungeon[getIndex(currentX, currentY)];

    // Exit gap percentage from render.js  :contentReference[oaicite:4]{index=4}
    const { w, h } = getRoomDimensions();
    const gap = EXIT_GAP_PERC;
    

    // EXIT CHECK (only allow transitions through gap)
    // TOP
    if (nextY < h * WALL_THICKNESS_PERC) {
        if (room.exits.includes("UP")) {
            const cx = nextX / w;
            if (cx > 0.5 - gap/2 && cx < 0.5 + gap/2) {
                return attemptScreenExit("UP");
            }
        }
    }

    // DOWN
    if (nextY > h * (1 - WALL_THICKNESS_PERC)) {
        if (room.exits.includes("DOWN")) {
            const cx = nextX / w;
            if (cx > 0.5 - gap/2 && cx < 0.5 + gap/2) {
                return attemptScreenExit("DOWN");
            }
        }
    }

    // LEFT
    if (nextX < w * WALL_THICKNESS_PERC) {
        if (room.exits.includes("LEFT")) {
            const cy = nextY / h;
            if (cy > 0.5 - gap/2 && cy < 0.5 + gap/2) {
                return attemptScreenExit("LEFT");
            }
        }
    }

    // RIGHT
    if (nextX > w * (1 - WALL_THICKNESS_PERC)) {
        if (room.exits.includes("RIGHT")) {
            const cy = nextY / h;
            if (cy > 0.5 - gap/2 && cy < 0.5 + gap/2) {
                return attemptScreenExit("RIGHT");
            }
        }
    }


    

    // WALL COLLISION
    if (checkCollisions(nextX, nextY)) {
        return; // blocked
    }

    // ALLOW MOVEMENT
    playerSpriteState.x = nextX;
    playerSpriteState.y = nextY;

    // Auto-pickup any item you walk over
    autoPickupAtCurrentPosition();


    renderPlayerSprite(document.getElementById("game"));
}


function isCollidingWithEnemyFeet(nextX, nextY) {
    const game = document.getElementById('game');
    if (!game) return false;

    const enemyEls = game.querySelectorAll('.sprite-wrapper.enemy');
    if (!enemyEls.length) return false;

    const gameRect = game.getBoundingClientRect();

    for (const el of enemyEls) {
        const rect = el.getBoundingClientRect();

        // Enemy rect in game coordinates
        const left   = rect.left - gameRect.left;
        const top    = rect.top  - gameRect.top;
        const right  = left + rect.width;
        const bottom = top  + rect.height;

        // Bottom 20px collision band
        const bandTop    = bottom - 40;
        const bandBottom = bottom - 20;

        const insideX = nextX >= left && nextX <= right;
        const insideY = nextY >= bandTop && nextY <= bandBottom;

        if (insideX && insideY) {
            return true;
        }
    }

    return false;
}


// =====================
// EXIT TO NEXT SCREEN
// =====================
function attemptScreenExit(direction) {
    const room = dungeon[getIndex(currentX, currentY)];
    if (!room.exits.includes(direction)) return;

    const [dx, dy] = DIRECTIONS[direction];
    const targetX = currentX + dx;
    const targetY = currentY + dy;

    if (!isInBounds(targetX, targetY)) return;

    currentX = targetX;
    currentY = targetY;

    // Place player at visual entry position for new screen
    const entry = getEntryPositionForDirection(direction);
    playerSpriteState.x = entry.x;
    playerSpriteState.y = entry.y;

    renderRoom();
}

function autoPickupAtCurrentPosition() {
    const room = dungeon[getIndex(currentX, currentY)];
    if (!room.appearance || !room.appearance.objectPositions) return;

    const { w, h } = getRoomDimensions();
    const px = playerSpriteState.x;
    const py = playerSpriteState.y;

    const pickupRadius = 40;

    const types = [
        { key: 'weapon',    name: room.weapon },
        { key: 'shield',    name: room.shield },
        { key: 'food',      name: room.food },
        { key: 'health',    name: room.health },
        { key: 'otherItem', name: room.otherItem }
    ];

    for (const entry of types) {
        if (!entry.name) continue;

        const pos = room.appearance.objectPositions[entry.key];
        if (!pos) continue;

        const ix = pos.x * w;
        const iy = pos.y * h;

        const hitX = Math.abs(px - ix) <= pickupRadius;
        const hitY = Math.abs(py - iy) <= pickupRadius;

        if (!hitX || !hitY) continue;

        // If this is a weapon, apply strength comparison BEFORE pickup
        if (entry.key === 'weapon') {
            if (!isBetterWeapon(entry.name, room)) return;
        }

        // If this is a shield, apply strength comparison BEFORE pickup
        if (entry.key === 'shield') {
            if (!isBetterShield(entry.name, room)) return;
        }

        // For everything else OR if better -> do the usual pickup
        pickUpItem(entry.name);
    }
}


function isBetterWeapon(itemName, room) {
    const def = WEAPON_ITEMS.find(w => w.name === itemName);
    if (!def) return true; // Unknown? Let pickup happen.

    const candidateStrength = room.weaponStrength ?? def.strength;
    const candidateUses = room.weaponUses ?? def.uses;

    const currentStrength = player.weaponstrength || 10;
    const currentUsesRaw  = player.weaponuses ?? -1;
    const candidateUsesRaw = candidateUses ?? -1;

    const normCurrent   = currentUsesRaw   === -1 ? Number.MAX_SAFE_INTEGER : currentUsesRaw;
    const normCandidate = candidateUsesRaw === -1 ? Number.MAX_SAFE_INTEGER : candidateUsesRaw;

    return (
        candidateStrength > currentStrength ||
        (candidateStrength === currentStrength && normCandidate > normCurrent)
    );
}


function isBetterShield(itemName, room) {
    const def = SHIELD_ITEMS.find(s => s.name === itemName);
    if (!def) return true;

    const candidateStrength = room.shieldStrength ?? def.strength;
    const candidateUses = room.shieldUses ?? def.uses;

    const currentStrength = player.shieldstrength || 0;
    const currentUsesRaw  = player.shielduses ?? -1;
    const candidateUsesRaw = candidateUses ?? -1;

    const normCurrent   = currentUsesRaw   === -1 ? Number.MAX_SAFE_INTEGER : currentUsesRaw;
    const normCandidate = candidateUsesRaw === -1 ? Number.MAX_SAFE_INTEGER : candidateUsesRaw;

    return (
        candidateStrength > currentStrength ||
        (candidateStrength === currentStrength && normCandidate > normCurrent)
    );
}
