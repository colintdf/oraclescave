// ============================================
// PROCEDURAL ROOM DESCRIPTION SYSTEM
// ============================================
// This module exports:
// - initRoomDescription(room)
// - buildDynamicRoomDescription(room)
// - descriptionPhrases (optional external use)
// ============================================


/* ---------------------------------------------------------
   MASTER PHRASE SETS
--------------------------------------------------------- */

const descriptionPhrases = {

    /* -----------------------------------------
       GENERAL ATMOSPHERE
    ----------------------------------------- */
    atmosphere: [
        "The air hangs still and heavy.",
        "A faint vibration moves through the stone.",
        "A cool draft slides across the floor.",
        "Dust drifts in narrow beams of light.",
        "Echoes rise and fall in uneven rhythm.",
        "Moist air clings to your skin.",
        "The chamber feels tense and watchful.",
        "A muffled silence blankets the room.",
        "Dry air scratches at your throat.",
        "A low tremor hums beneath the ground.",
        "The shadows feel slow and deliberate.",
        "A passing chill brushes past your shoulders.",
        "Your footsteps sound sharper than expected.",
        "The temperature drops the deeper you stand.",
        "Everything feels strangely motionless.",
        "The stale air tastes faintly metallic.",
        "A thick quiet fills every corner.",
        "A steady pulse of warmth radiates from unseen vents.",
        "The breeze smells faintly of minerals.",
        "A whisper of cold sweeps across the floor.",
        "Your ears pop from subtle pressure changes.",
        "The atmosphere grows heavier toward the center.",
        "Fatigue creeps in from the stale air.",
        "Soft vibrations tickle the edges of your boots.",
        "Air currents twist unpredictably at your ankles.",
        "You inhale the scent of old stone.",
        "A strange warmth clings to your back.",
        "A heavy stillness presses against your ears.",
        "The air carries hints of damp clay.",
        "Something unseen shifts the airflow.",
        "A sluggish breeze curls around the cave walls.",
        "A subtle charge tickles your fingertips.",
        "Distant pressure presses gently against your head.",
        "A strange density fills the space.",
        "A quiet crackle moves through the chamber.",
        "You sense movement in the stillness.",
        "Something faint taps rhythmically beneath the floor.",
        "Static prickles briefly along your skin.",
        "An eerie calm settles over the stone."
    ],

    /* -----------------------------------------
       FLOOR DETAILS
    ----------------------------------------- */
    floor: [
        "The floor breaks into uneven stone plates.",
        "Loose gravel shifts under each step.",
        "A thin layer of grit covers the ground.",
        "Moisture gathers in shallow dips.",
        "Soft dust blankets the floor.",
        "Cracked stone spreads across the chamber.",
        "A scattering of pebbles marks old movement.",
        "Patches of moss cling weakly to fractured tiles.",
        "Deep scratches cut jagged lines across the floor.",
        "Tiny pools glisten in scattered pockets.",
        "The footing dips unpredictably underfoot.",
        "A slick film coats several patches of rock.",
        "Sharp fragments crunch beneath your boots.",
        "Dust mounds rise around fallen debris.",
        "The ground slopes gently toward one corner.",
        "Small stones roll freely when nudged.",
        "Stubborn mud crusts in odd channels.",
        "Chalky residue smears as you walk.",
        "Pebbles scatter with each movement.",
        "Warm patches alternate with cold ones.",
        "Ancient boot prints are barely visible.",
        "The floor feels strangely springy.",
        "Dirt lines form faint rings around the edges.",
        "Pitted marks cover wide areas of stone.",
        "Unstable ridges threaten your balance.",
        "Shallow impressions hint at heavy traffic.",
        "Loose shale shifts unpredictably.",
        "Clumps of dried clay anchor stray stones.",
        "Faint drag marks cross the chamber.",
        "The surface feels coarser than expected.",
        "The ground feels oddly polished.",
        "Rugged stones jut up at odd angles.",
        "Grooves carved by water cut across the ground.",
        "Clusters of rubble collect in calm pockets.",
        "Hard-packed soil layers certain areas.",
        "Granular sand crunches beneath each step.",
        "Fissures trace a branching pattern underfoot.",
        "Your footsteps kick up pale dust clouds.",
        "Small ridges run like ribs along the chamber floor.",
        "An uneven crust covers the surface."
    ],


    /* -----------------------------------------
       CEILING
    ----------------------------------------- */
    ceiling: [
        "The ceiling arches low with sharp stalactites.",
        "Grooves stretch overhead like old scars.",
        "Mineral veins shimmer faintly above.",
        "Water drips at irregular intervals.",
        "The upper rock vanishes into shadow.",
        "The roof seems warped by long stress.",
        "Small cracks spread outward like roots.",
        "Jagged peaks shimmer with dampness.",
        "Thick clusters of stone teeth loom overhead.",
        "Long fractures cut the ceiling from end to end.",
        "Moisture beads along thin ridges.",
        "Shadowed recesses conceal potential movement.",
        "Patches of mineral crust sparkle faintly.",
        "Delicate stone curtains hang from the roof.",
        "A faint mist clings close to the ceiling.",
        "Dark stains mark long-forgotten leaks.",
        "Old soot marks cluster near the corners.",
        "The ceiling dips dangerously low in some areas.",
        "Broad arches swell upward in uneven domes.",
        "A faint breeze swirls close to the higher stone.",
        "Hollow pockets echo faintly overhead.",
        "Hairline fractures branch downward.",
        "Smooth patches break up jagged areas.",
        "A soft glimmer dances along mineral streaks.",
        "The ceiling rises high, swallowing torchlight.",
        "Crumbled debris suggests recent instability.",
        "Thin dangling roots thread through small cracks.",
        "Pebble-sized stones occasionally fall loose.",
        "Streaks of residue trail the contours above.",
        "The roof curves in irregular undulations.",
        "Thin stone needles jut down unevenly.",
        "Misted droplets form along faint ridges.",
        "Shadows warp strangely across dips.",
        "Faint discoloration paints pale streaks.",
        "The ceiling feels oppressively close.",
        "A cavity above channels faint echoes.",
        "Mineral buildup forms odd geometric patterns.",
        "Small pits dot the ceiling surface.",
        "Clusters of stalactites merge like frozen waves."
    ],


    /* -----------------------------------------
       ENEMY FEATURES
    ----------------------------------------- */
    enemyFeatures: [
        "Scrapes on the walls show where something has paced.",
        "Fresh gouges cut across the stone.",
        "A stale smell hangs around scattered debris.",
        "Cracked stones mark violent impacts.",
        "A trail of disturbed dust leads toward the creature.",
        "Claw marks cover patches of the floor.",
        "The chamber feels charged by its presence.",
        "The ground bears signs of frantic struggle.",
        "Dark smears stain the lower rocks.",
        "Deep claw trenches slice through the dust.",
        "A harsh musk taints the air.",
        "Shredded scraps lie in a loose circle.",
        "Footprints overlap in chaotic patterns.",
        "Broken fragments suggest violent thrashing.",
        "A faint growl echoes against the walls.",
        "A distant scrape hints at movement.",
        "Several stones appear freshly overturned.",
        "The air tightens as if something watches.",
        "Heat radiates from disturbed patches of dirt.",
        "The scent of fur hangs faintly in the room."
    ],


    /* -----------------------------------------
       WEAPON FEATURES
    ----------------------------------------- */
    weaponFeatures: [
        "A glint of metal catches your eye.",
        "Rubble has shifted to reveal a forgotten tool.",
        "Dust rings mark where a heavy object once rested.",
        "A scattering of debris surrounds a dropped weapon.",
        "A beam of light reflects off polished metal.",
        "Old scratches show where the weapon scraped the ground.",
        "Stone chips reveal where it landed.",
        "Deep scuffs mark the path it was dragged along.",
        "Something metallic peeks from beneath fallen rock.",
        "The air smells faintly of iron near the object.",
        "Small fractures surround the impact point.",
        "A patch of cleared dust suggests recent movement.",
        "The weapon rests awkwardly against a stone rise.",
        "Loose grit is pushed aside in a circular pattern.",
        "The handle bears the marks of long use.",
        "Metal dust sparkles faintly in the air."
    ],


    /* -----------------------------------------
       FOOD FEATURES
    ----------------------------------------- */
    foodFeatures: [
        "Someone left supplies stacked against the wall.",
        "A faint herbal smell rises from nearby rations.",
        "Crumbs lie scattered across a flat rock.",
        "A simple bundle of food rests near the edge.",
        "Signs of a recent camp linger here.",
        "The air carries a mild sweetness.",
        "A rustle of wrapping hints at stored provisions.",
        "Dried leaves from past meals gather in corners.",
        "A faint yeasty scent hangs in the air.",
        "Loose grains spill from a torn pouch.",
        "A woven bag sits half-open on the floor.",
        "A soft rustling sound hints at small creatures.",
        "Scarred marks show where someone prepared food.",
        "Moist crumbs dot the surrounding stone.",
        "A small cloth bundle lies neatly folded."
    ],


    /* -----------------------------------------
       HEALTH / HERBS
    ----------------------------------------- */
    healthFeatures: [
        "A small pile of herbs sits neatly near the wall.",
        "Dried leaves and bandages lie folded on a ledge.",
        "A faint medicinal scent drifts around the chamber.",
        "Someone arranged healing supplies with care.",
        "Old poultice jars rest in a shallow alcove.",
        "The setup suggests this room was used for rest.",
        "Powdery residue clings to the stone nearby.",
        "Herbal bundles hang from a slender hook.",
        "A tiny mortar sits beside crushed leaves.",
        "A roll of clean cloth rests untouched.",
        "Fragments of dried bark scatter nearby.",
        "A crisp scent sharpens the air here.",
        "Oil stains tint the ground faintly green.",
        "A failed mixture has hardened into brittle flakes."
    ],


    /* -----------------------------------------
       SHIELD FEATURES
    ----------------------------------------- */
    shieldFeatures: [
        "A rounded object leans against a broken stone.",
        "Scratch marks suggest a shield was dragged here.",
        "Metallic tones reflect faintly from the wall.",
        "Its surface carries dents from previous battles.",
        "Dust patterns circle around the shield.",
        "The object hums faintly in the still air.",
        "Its edges shimmer with old enchantment.",
        "Scraped grooves show where it deflected blows.",
        "Shallow impact marks pepper the stone nearby.",
        "It rests as though recently placed.",
        "The handle is worn but sturdy.",
        "Small cracks radiate from where it hit the floor.",
        "A dull glow outlines the shield’s contour."
    ],


    /* -----------------------------------------
       MISC ITEMS
    ----------------------------------------- */
    otherItemFeatures: [
        "A curious object sits half-buried in dust.",
        "Strange shapes lie scattered near a small alcove.",
        "A faint glow highlights an unusual trinket.",
        "Fragments reflect oddly off a mysterious item.",
        "The object seems intentionally placed.",
        "Soft dust curves around its outline.",
        "Its presence feels out of place here.",
        "A tiny sparkle flickers when you move.",
        "The item clicks softly if nudged.",
        "An unfamiliar scent hovers around it.",
        "A warped shadow stretches from the object's form.",
        "Subtle markings cover its surface.",
        "Threads of faint color shimmer across it."
    ],


    /* -----------------------------------------
       BOSS ROOMS
    ----------------------------------------- */
    bossFeatures: [
        "Strange carvings spiral along the walls.",
        "The air tightens around the chamber’s center.",
        "Scorched stone circles the guardian's resting place.",
        "Symbols pulse softly from the floor.",
        "Debris has been swept outward from the relic.",
        "A sense of dread radiates from the central space.",
        "Ancient markings hint at forgotten rituals.",
        "The walls rise in unnatural symmetry.",
        "A hum of power thickens the air.",
        "Fragments of old symbols litter the floor.",
        "Rings of energy distort the dust below.",
        "A distant pulse echoes through the chamber."
    ],


    /* -----------------------------------------
       EXIT ROOMS
    ----------------------------------------- */
    exitFeatures: [
        "A carved archway hums with quiet energy.",
        "An unnatural doorway frames the far wall.",
        "Faded markings point toward the exit device.",
        "A cold draft slips through a sealed gate.",
        "The ground rises toward an engraved frame.",
        "A narrow seam of light surrounds the gateway.",
        "The air stirs as if urging you onward.",
        "Slender grooves lead to a hidden mechanism.",
        "Soft blue light leaks through small cracks.",
        "A faint hum steadies near the doorframe.",
        "Symbols etched above pulse gently.",
        "Warm air seeps through the divider.",
        "The threshold vibrates under your hand."
    ],


    /* -----------------------------------------
       AMBIENT SOUND
    ----------------------------------------- */
    ambientSounds: [
        "Pebbles click softly in the distance.",
        "A hollow wind whistles through unseen cracks.",
        "Soft tapping repeats behind the walls.",
        "Shifting rock groans through the chamber.",
        "Water trickles from somewhere beyond sight.",
        "Muffled echoes make the space feel alive.",
        "Light percussion echoes across the stone.",
        "A distant thump rolls through the cave.",
        "A faint whistle loops like a breath.",
        "Drips fall in slow, steady rhythm.",
        "A quiet rumble vibrates below.",
        "Whispers of air curl through fractures.",
        "Stone chips skitter lightly in the dark.",
        "A wavering moan rides on a draft."
    ]
};



/* ---------------------------------------------------------
   UTILITY
--------------------------------------------------------- */

function pick(arr, index) {
    if (!arr.length) return "";
    return arr[index % arr.length];
}


/* ---------------------------------------------------------
   CREATE OR LOAD ROOM FLAVOUR
--------------------------------------------------------- */

function initRoomDescription(room) {
    if (!room.descriptionFlavor) {
        room.descriptionFlavor = {
            atmosphereIndex: Math.floor(Math.random() * descriptionPhrases.atmosphere.length),
            floorIndex: Math.floor(Math.random() * descriptionPhrases.floor.length),
            ceilingIndex: Math.floor(Math.random() * descriptionPhrases.ceiling.length),
            ambientIndex: Math.floor(Math.random() * descriptionPhrases.ambientSounds.length)
        };
    }
}


/* ---------------------------------------------------------
   NEW: PRIORITY-BASED SINGLE FEATURE SELECTION (OPTION A)
--------------------------------------------------------- */

function getDynamicFeature(room) {
    // Priority 1: Enemy
    if (room.enemy) {
        return pick(descriptionPhrases.enemyFeatures, room.x + room.y);
    }

    // Priority 2: Weapon
    if (room.weapon) {
        return pick(descriptionPhrases.weaponFeatures, room.x + room.y);
    }

    // Priority 3: Food
    if (room.food) {
        return pick(descriptionPhrases.foodFeatures, room.x + room.y);
    }

    // Priority 4: Health
    if (room.health) {
        return pick(descriptionPhrases.healthFeatures, room.x + room.y);
    }

    // Priority 5: Shield
    if (room.shield) {
        return pick(descriptionPhrases.shieldFeatures, room.x + room.y);
    }

    // Priority 6: Other misc items
    if (room.otherItem) {
        return pick(descriptionPhrases.otherItemFeatures, room.x + room.y);
    }

    // Priority 7: Boss room
    if (room.isBoss) {
        return pick(descriptionPhrases.bossFeatures, room.x + room.y);
    }

    // Priority 8: Dungeon exit
    if (room.dungeonExits && room.dungeonExits.length > 0) {
        return pick(descriptionPhrases.exitFeatures, room.x + room.y);
    }

    // Nothing relevant
    return "";
}


/* ---------------------------------------------------------
   FINAL DESCRIPTION BUILDER
--------------------------------------------------------- */

function buildDynamicRoomDescription(room) {
    initRoomDescription(room);

    const f = room.descriptionFlavor;

    const parts = [
        pick(descriptionPhrases.atmosphere, f.atmosphereIndex),
        pick(descriptionPhrases.floor, f.floorIndex),
        pick(descriptionPhrases.ceiling, f.ceilingIndex),
        getDynamicFeature(room),
        pick(descriptionPhrases.ambientSounds, f.ambientIndex)
    ].filter(Boolean);

    return parts.join(" ");
}


// Exports if required:
// export { buildDynamicRoomDescription, initRoomDescription, descriptionPhrases };
