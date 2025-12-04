// =====================
// FULL INPUT.JS (FIXED SHIELD + EXIT RESTORE + ANIMATED MOVEMENT)
// =====================

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
            alert('The ' + currentRoom.enemy + ' wakes up!');
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

        alert('The ' + currentRoom.enemy + ' is blocking the exits!');
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


// =====================
// ATTACK LOGIC (shield + exit restore fix applied)
// =====================

function attackEnemy() {
    let currentRoom = dungeon[getIndex(currentX, currentY)];

    if (!currentRoom.enemy) return;

    currentRoom.enemyStatus = 'furious';

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
            alert('Your ' + player.shield + ' breaks!');
            player.shieldstrength = 0;
            player.shielduses = -1;
            player.shield = 'None';
            player.inventory.shield = [];
        }
    }

    currentRoom.enemyHealth -= playerDamage;
    player.health -= enemyDamage;

    renderRoom(); 

    let descriptionDiv = document.getElementById('description');
    descriptionDiv.textContent =
        `You attack the ${currentRoom.enemy} and deal ${playerDamage} damage. ` +
        `The ${currentRoom.enemy} has ${currentRoom.enemyHealth} health left. ` +
        `The ${currentRoom.enemy} attacks you and deals ${enemyDamage} damage. ` +
        `You have ${player.health} health left.`;

    // Weapon usage + break logic
    if (player.weaponuses > 0 && player.weaponuses !== -1) {
        player.inventory.weapon[0].uses -= 1;
        player.weaponuses -= 1;

        if (player.weaponuses === 0) {
            if (player.weapon == 'Throwing Knives') alert('You are out of knives!');
            else if (player.weapon == 'Crossbow') alert('You are out of bolts!');
            else if (player.weapon == "Asterion's Wrath") alert('Asterions Wrath disintegrates!');
            else alert('Your ' + player.weapon + ' breaks!');

            player.weaponstrength = 10;
            player.weaponuses = -1;
            player.weapon = 'None';
            player.inventory.weapon = [];
        }
    }

    if (player.health <= 0) {
        alert(`You have been defeated by the ${currentRoom.enemy}. Game Over!`);
        location.reload();
        return;
    }

    // ENEMY DEFEATED
    if (currentRoom.enemyHealth <= 0) {
        alert(`You have defeated the ${currentRoom.enemy}.`);

        // >>> Restore exits if enemy blocked them <<<
        if (currentRoom.storedExits) {
            currentRoom.exits = currentRoom.storedExits;
            currentRoom.storedExits = null;
        }

        descriptionDiv.textContent = `You have defeated the ${currentRoom.enemy}.`;

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


// =====================
// KEYBOARD CONTROL HANDLER
// =====================

window.addEventListener('keydown', (e) => {

    if (e.key === 'ArrowUp') movePlayer('UP');
    if (e.key === 'ArrowDown') movePlayer('DOWN');
    if (e.key === 'ArrowLeft') movePlayer('LEFT');
    if (e.key === 'ArrowRight') movePlayer('RIGHT');

    if (e.key === 'a') attackEnemy();

    // REVEAL MAP (Q)
    if (e.key === 'q') {
        dungeon.forEach(r => r.discovered = true);
        renderMiniMap();
        document.querySelectorAll('.mini-room').forEach((roomDiv, index) => {
            roomDiv.addEventListener('click', () => {
                currentX = index % GRID_SIZE;
                currentY = Math.floor(index / GRID_SIZE);
                renderRoom();
            });
        });
    }

    // GIVE (G)
    if (e.key === 'g') {
        let currentRoom = dungeon[getIndex(currentX, currentY)];

        // Oracle gift logic
        if (currentRoom.isBoss && currentRoom.enemy == 'Oracle') {
            if (player.inventory.artifacts.length === 0) {
                return;
            }

            let artifactItems = player.inventory.artifacts.map((item, index) => `${index + 1}. ${item.name}`);
            let itemIndex = prompt(`Select an artifact to give to the Oracle:\n${artifactItems.join('\n')}`);

            if (itemIndex) {
                itemIndex = parseInt(itemIndex) - 1;
                let chosen = player.inventory.artifacts[itemIndex];
                let itemName = chosen.name;

                player.inventory.artifacts.splice(itemIndex, 1);

                const randomArtifact = EXITS.map(exit => exit.activationArtifact)[Math.floor(Math.random() * EXITS.length)];
                player.inventory.artifacts.push({ name: randomArtifact, quantity: 1 });
                player.score += 1000;
                player.percentcomplete += 5;

                alert(`You gave the Oracle the ${itemName}. The Oracle gave you the ${randomArtifact} in return.`);

                currentRoom.enemy = null;
                currentRoom.enemyStatus = null;
                currentRoom.artifact = null;
                currentRoom.isBoss = false;

                renderRoom();
            }

            return;
        }

        // GIVE FOOD TO HUNGRY ENEMY
        if (!currentRoom.enemy || currentRoom.enemyStatus !== 'hungry') return;
        if (player.inventory.food.length === 0) return;

        let foodItems = player.inventory.food.map((i, idx) => `${idx + 1}. ${i.name} (${i.quantity})`);
        let itemIndex = prompt(`Select an item to give to the enemy:\n${foodItems.join('\n')}`);

        if (itemIndex) {
            itemIndex = parseInt(itemIndex) - 1;
            let foodName = player.inventory.food[itemIndex].name;

            // Decrement food
            player.inventory.food[itemIndex].quantity -= 1;
            if (player.inventory.food[itemIndex].quantity <= 0) {
                player.inventory.food.splice(itemIndex, 1);
            }

            currentRoom.enemyStatus = 'curious';
            alert(`You gave the ${currentRoom.enemy} some ${foodName}. It now looks curious.`);
            renderRoom();
        }
    }

    // RUN (R)
    if (e.key === 'r') {
        let currentRoom = dungeon[getIndex(currentX, currentY)];
        if (!currentRoom.enemy) return;

        let exits = currentRoom.storedExits || [];

        if ((currentRoom.enemyStatus === 'hungry' && Math.random() < 0.5)
            || (Math.random() < 0.25 && exits.length > 0)) {

            alert('You manage to escape!');
            const randomDirection = exits[Math.floor(Math.random() * exits.length)];
            currentRoom.exits = currentRoom.storedExits;
            movePlayer(randomDirection);

        } else {
            alert('The enemy catches you and you must fight!');
            attackEnemy();
        }
    }

    // USE ITEM (U)
    if (e.key === 'u') {

        let currentRoom = dungeon[getIndex(currentX, currentY)];

        // Exit usage
        if (currentRoom.dungeonExits && currentRoom.dungeonExits.length > 0) {
            for (let i = 0; i < currentRoom.dungeonExits.length; i++) {
                if (player.inventory.artifacts.find(item => item.name === currentRoom.dungeonExits[i].activationArtifact)) {
                    player.inventory.artifacts = player.inventory.artifacts.filter(item => item.name !== currentRoom.dungeonExits[i].activationArtifact);
                    player.score += 1000;
                    player.percentcomplete += 5;
                    alert(`You used the ${currentRoom.dungeonExits[i].activationArtifact} to activate the ${currentRoom.dungeonExits[i].name} and returned home. You win!`);
                    location.reload();
                    return;
                }
            }
        }

        // Health + food usage
        if (player.inventory.health.length === 0 && player.inventory.food.length === 0) return;

        let healthItems = player.inventory.health.map((item, idx) => `${idx + 1}. ${item.name} (${item.quantity})`);
        let foodItems = player.inventory.food.map((item, idx) => `${idx + healthItems.length + 1}. ${item.name} (${item.quantity})`);
        let all = healthItems.concat(foodItems);

        let itemIndex = prompt(`Select an item to use:\n${all.join('\n')}`);
        if (!itemIndex) return;
        itemIndex = parseInt(itemIndex) - 1;

        let name = all[itemIndex].split(' ')[1];

        let item = FOOD_ITEMS.find(f => f.name === name) || HEALTH_ITEMS.find(h => h.name === name);

        if (item.name === 'potion') {

            // Potion random effects
            for (let i = 0; i < player.inventory.food.length; i++) {
                if (player.inventory.food[i].name === item.name) {
                    player.inventory.food[i].quantity -= 1;
                    if (player.inventory.food[i].quantity <= 0) {
                        player.inventory.food.splice(i, 1);
                    }
                }
            }

            let effect = Math.floor(Math.random() * 3);
            if (effect === 0) {
                let loss = Math.floor(Math.random() * 50) * -1;
                player.health += loss;
                alert(`You drank the potion and lost ${loss} health.`);
                if (player.health <= 0) {
                    alert('You died!');
                    location.reload();
                }
            } else if (effect === 1) {
                player.health += Math.floor(Math.random() * 500);
                if (player.health > player['max-health']) player.health = player['max-health'];
                alert(`You gained health.`);
            } else {
                let randomRoom = Math.floor(Math.random() * TOTAL_SCREENS);
                currentX = randomRoom % GRID_SIZE;
                currentY = Math.floor(randomRoom / GRID_SIZE);
                alert(`You passed out and woke up somewhere else.`);
                renderRoom();
            }

        } else {
            // Health item
            if (player.health === player['max-health']) {
                alert('Full health.');
                return;
            }

            player.health += item.health;
            if (player.health > player['max-health']) player.health = player['max-health'];

            // Remove from inventory
            for (let i = 0; i < player.inventory.health.length; i++) {
                if (player.inventory.health[i].name === name) {
                    player.inventory.health[i].quantity -= 1;
                    if (player.inventory.health[i].quantity <= 0) {
                        player.inventory.health.splice(i, 1);
                    }
                }
            }

            for (let i = 0; i < player.inventory.food.length; i++) {
                if (player.inventory.food[i].name === name) {
                    player.inventory.food[i].quantity -= 1;
                    if (player.inventory.food[i].quantity <= 0) {
                        player.inventory.food.splice(i, 1);
                    }
                }
            }
        }

        renderInventory();
        renderPlayerStatus();
    }

    // =====================
    // PICK UP ITEM (P)
    // =====================
    if (e.key === 'p') {

        let currentRoom = dungeon[getIndex(currentX, currentY)];
        let items = [];

        if (currentRoom.weapon) items.push(currentRoom.weapon);
        if (currentRoom.food) items.push(currentRoom.food);
        if (currentRoom.health) items.push(currentRoom.health);
        if (currentRoom.shield) items.push(currentRoom.shield);
        if (currentRoom.otherItem) items.push(currentRoom.otherItem);

        if (items.length === 0) return;

        let itemIndex = prompt(
            `Select an item to pick up:\n${items.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`
        );
        if (!itemIndex) return;
        itemIndex = parseInt(itemIndex) - 1;

        let selectedItem = items[itemIndex];

        // Enemy reacts BEFORE item pickup
        if (currentRoom.enemy && currentRoom.enemyStatus !== 'furious' && currentRoom.enemyStatus !== 'sleeping') {
            currentRoom.storedExits = currentRoom.exits;
            currentRoom.exits = [];
            currentRoom.enemyStatus = 'furious';
            alert(`The ${currentRoom.enemy} becomes furious and blocks the exits.`);
            renderRoom();
            return;
        }

        if (currentRoom.enemy && currentRoom.enemyStatus === 'sleeping') {
            if (Math.random() < 0.8) {
                alert('The ' + currentRoom.enemy + ' wakes up!');
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

        // Identify item type
        const wasWeapon = (currentRoom.weapon === selectedItem);
        const wasFood = (currentRoom.food === selectedItem);
        const wasHealth = (currentRoom.health === selectedItem);
        const wasShield = (currentRoom.shield === selectedItem);
        const wasOther = (currentRoom.otherItem === selectedItem);


        // ===========================
        // WEAPON PICKUP (unchanged)
        // ===========================
        if (WEAPON_ITEMS.map(w => w.name).includes(selectedItem)) {
            if (player.inventory.weapon.length > 0) {
                let old = player.inventory.weapon[0];
                player.oldWeapon = old.name;
                player.oldWeaponStrength = old.strength;
                player.oldWeaponUses = old.uses;
                player.inventory.weapon = [];
                player.weaponstrength = 10;
                alert(`You drop your ${old.name} and pick up the ${selectedItem}.`);
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
        // SHIELD PICKUP (FULL FIXED)
        // ===========================
        if (SHIELD_ITEMS.map(s => s.name).includes(selectedItem)) {

            // --- CASE 1: Player already has THIS shield ---
            if (player.shield === selectedItem) {

                // remove shield from room, do NOT refresh durability
                currentRoom.shield = null;
                currentRoom.shieldStrength = null;
                currentRoom.shieldUses = null;

                alert(`You already have the ${selectedItem}.`);
                renderRoom();
                return;
            }

            // --- CASE 2: Player is replacing a different shield ---
            if (player.inventory.shield.length > 0) {
                let old = player.inventory.shield[0];
                player.oldShield = old.name;
                player.oldShieldStrength = old.strength;
                player.oldShieldUses = old.uses;
                player.inventory.shield = [];
                alert(`You drop your ${old.name} and pick up the ${selectedItem}.`);
            }

            // Equip new shield
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
        // FOOD / HEALTH PICKUP
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

            alert(`You pick up the ${selectedItem}.`);
        }


        // ===========================
        // OTHER ITEMS (Map etc)
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
                        if (isInBounds(nx,ny)) adj.push(getIndex(nx,ny));
                    }
                }

                let revealList = [];
                while (roomsRevealed-- > 0 && adj.length > 0) {
                    revealList.push(adj.splice(Math.floor(Math.random() * adj.length), 1)[0]);
                }

                revealList.forEach(i => dungeon[i].discovered = true);
                alert('The map reveals some of the surrounding caves.');
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
                // drop the OLD shield into the room
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

        // FINAL RERENDER
        renderPlayerStatus();
        renderInventory();

        // ==========================================
        // REMOVE ITEM FROM ROOM AFTER PICKUP
        // (This keeps descriptions accurate)
        // ==========================================
        if (wasWeapon) {
            currentRoom.weapon = null;
            currentRoom.weaponStrength = null;
            currentRoom.weaponUses = null;
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
            currentRoom.shield = null;
            currentRoom.shieldStrength = null;
            currentRoom.shieldUses = null;
        }

        if (wasOther) {
            currentRoom.otherItem = null;
        }


        renderRoom();
    }

    renderPlayerStatus();
});
