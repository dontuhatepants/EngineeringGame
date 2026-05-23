// Robot mechanic: drag parts from the tray onto matching slots on the robot.
//
// Each part has a `type` (head/body/arms/legs/antenna/eyes plus mech upgrades).
// Slots accept a part only if its type matches. Wrong drops snap the part back
// to its tray spot.
//
// Levels 1-5 are the friendly "wake up" intro. Levels 6-25 progressively
// transform the friendly robot into a giant anime-style mech.

import { sfx } from './sound.js';

// ----- Shared part definitions (SVG + intrinsic size in px) -----
const PART_DEFS = {
  // ===== Original friendly-robot parts (L1-L5) =====
  head: {
    w: 100, h: 80,
    svg: `
      <rect x="5" y="5" width="90" height="70" rx="10" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="18" y="22" width="64" height="22" rx="3" fill="#1a2230"/>
      <rect x="34" y="56" width="32" height="6" rx="2" fill="#3a4756"/>
      <rect x="20" y="68" width="6" height="6" fill="#3a4756"/>
      <rect x="74" y="68" width="6" height="6" fill="#3a4756"/>
    `,
  },
  body: {
    w: 130, h: 120,
    svg: `
      <rect x="5" y="5" width="120" height="110" rx="10" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <circle cx="65" cy="55" r="22" fill="#ffd966" stroke="#7a5a1f" stroke-width="3"/>
      <circle cx="65" cy="55" r="11" fill="#ff8855"/>
      <rect x="28" y="92" width="22" height="10" rx="2" fill="#3a4756"/>
      <rect x="80" y="92" width="22" height="10" rx="2" fill="#3a4756"/>
    `,
  },
  arms: {
    w: 220, h: 70,
    svg: `
      <!-- left arm -->
      <rect x="5" y="22" width="60" height="24" rx="10" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="3" y="14" width="22" height="40" rx="6" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <!-- right arm -->
      <rect x="155" y="22" width="60" height="24" rx="10" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="195" y="14" width="22" height="40" rx="6" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
    `,
  },
  legs: {
    w: 130, h: 110,
    svg: `
      <rect x="28" y="5" width="22" height="80" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="80" y="5" width="22" height="80" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="18" y="80" width="42" height="22" rx="4" fill="#3a4756"/>
      <rect x="70" y="80" width="42" height="22" rx="4" fill="#3a4756"/>
    `,
  },
  antenna: {
    w: 30, h: 50,
    svg: `
      <rect x="13" y="18" width="4" height="32" fill="#3a4756"/>
      <circle cx="15" cy="12" r="10" fill="#d33" stroke="#3a4756" stroke-width="3"/>
      <circle cx="12" cy="9" r="3" fill="#ff8a8a"/>
    `,
  },
  eyes: {
    w: 70, h: 28,
    svg: `
      <circle cx="15" cy="14" r="10" fill="#fff" stroke="#3a4756" stroke-width="3"/>
      <circle cx="55" cy="14" r="10" fill="#fff" stroke="#3a4756" stroke-width="3"/>
      <circle cx="16" cy="14" r="4" fill="#1a2230"/>
      <circle cx="56" cy="14" r="4" fill="#1a2230"/>
    `,
  },

  // ===== L6-L10 Armor phase =====
  shoulderPads: {
    w: 200, h: 50,
    svg: `
      <!-- left pad -->
      <path d="M5 40 Q5 8 40 8 L70 8 Q80 8 80 20 L80 40 Z"
            fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="20" y="20" width="40" height="6" rx="2" fill="#3a4756"/>
      <!-- right pad -->
      <path d="M195 40 Q195 8 160 8 L130 8 Q120 8 120 20 L120 40 Z"
            fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="140" y="20" width="40" height="6" rx="2" fill="#3a4756"/>
    `,
  },
  chestPlate: {
    w: 110, h: 80,
    svg: `
      <path d="M10 5 L100 5 L95 70 Q55 78 15 70 Z"
            fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <line x1="55" y1="10" x2="55" y2="68" stroke="#3a4756" stroke-width="3"/>
      <rect x="25" y="20" width="20" height="8" rx="2" fill="#3aa3ff"/>
      <rect x="65" y="20" width="20" height="8" rx="2" fill="#3aa3ff"/>
      <rect x="25" y="40" width="20" height="6" rx="2" fill="#3a4756"/>
      <rect x="65" y="40" width="20" height="6" rx="2" fill="#3a4756"/>
    `,
  },
  visor: {
    w: 90, h: 24,
    svg: `
      <path d="M5 18 L8 5 L82 5 L85 18 Z"
            fill="#3aa3ff" stroke="#3a4756" stroke-width="4"/>
      <rect x="12" y="9" width="22" height="4" rx="1" fill="#ffffff" opacity="0.7"/>
      <rect x="56" y="9" width="22" height="4" rx="1" fill="#ffffff" opacity="0.7"/>
    `,
  },
  kneepads: {
    w: 130, h: 40,
    svg: `
      <!-- left knee -->
      <path d="M20 35 Q20 5 38 5 Q56 5 56 35 Z"
            fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <circle cx="38" cy="22" r="5" fill="#3a4756"/>
      <!-- right knee -->
      <path d="M74 35 Q74 5 92 5 Q110 5 110 35 Z"
            fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <circle cx="92" cy="22" r="5" fill="#3a4756"/>
    `,
  },
  gauntlets: {
    w: 220, h: 50,
    svg: `
      <!-- left gauntlet -->
      <rect x="3" y="6" width="34" height="40" rx="6" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="8" y="14" width="24" height="4" rx="1" fill="#3a4756"/>
      <rect x="8" y="24" width="24" height="4" rx="1" fill="#3a4756"/>
      <rect x="8" y="34" width="24" height="4" rx="1" fill="#3a4756"/>
      <!-- right gauntlet -->
      <rect x="183" y="6" width="34" height="40" rx="6" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="188" y="14" width="24" height="4" rx="1" fill="#3a4756"/>
      <rect x="188" y="24" width="24" height="4" rx="1" fill="#3a4756"/>
      <rect x="188" y="34" width="24" height="4" rx="1" fill="#3a4756"/>
    `,
  },

  // ===== L11-L15 Weapons & gadgets =====
  jetThrusters: {
    w: 140, h: 80,
    svg: `
      <!-- left thruster -->
      <rect x="5" y="10" width="40" height="55" rx="8" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="12" y="18" width="26" height="6" rx="2" fill="#3a4756"/>
      <circle cx="25" cy="50" r="8" fill="#ff8855" stroke="#3a4756" stroke-width="3"/>
      <circle cx="25" cy="50" r="4" fill="#ffd966"/>
      <!-- right thruster -->
      <rect x="95" y="10" width="40" height="55" rx="8" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="102" y="18" width="26" height="6" rx="2" fill="#3a4756"/>
      <circle cx="115" cy="50" r="8" fill="#ff8855" stroke="#3a4756" stroke-width="3"/>
      <circle cx="115" cy="50" r="4" fill="#ffd966"/>
    `,
  },
  handCannon: {
    w: 70, h: 50,
    svg: `
      <rect x="5" y="14" width="50" height="22" rx="6" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="48" y="10" width="18" height="30" rx="3" fill="#3a4756" stroke="#3a4756" stroke-width="2"/>
      <circle cx="57" cy="25" r="6" fill="#d33" stroke="#3a4756" stroke-width="2"/>
      <rect x="14" y="20" width="20" height="4" rx="1" fill="#3a4756"/>
      <rect x="14" y="28" width="20" height="3" rx="1" fill="#3a4756"/>
    `,
  },
  shoulderCannon: {
    w: 60, h: 60,
    svg: `
      <rect x="8" y="20" width="32" height="30" rx="6" fill="#bbc4d0" stroke="#3a4756" stroke-width="4"/>
      <rect x="20" y="5" width="22" height="30" rx="4" fill="#3a4756" stroke="#3a4756" stroke-width="2"/>
      <circle cx="31" cy="12" r="5" fill="#d33" stroke="#1a2230" stroke-width="2"/>
      <rect x="12" y="30" width="22" height="5" rx="1" fill="#3a4756"/>
      <rect x="12" y="40" width="22" height="5" rx="1" fill="#3a4756"/>
    `,
  },
  tallAntenna: {
    w: 60, h: 90,
    svg: `
      <rect x="27" y="40" width="6" height="48" fill="#3a4756"/>
      <path d="M30 5 L18 32 L42 32 Z" fill="#d33" stroke="#3a4756" stroke-width="3"/>
      <rect x="14" y="32" width="32" height="8" rx="2" fill="#3a4756"/>
      <circle cx="30" cy="18" r="3" fill="#ffd966"/>
    `,
  },
  chestCore: {
    w: 60, h: 60,
    svg: `
      <circle cx="30" cy="30" r="26" fill="#3a4756" stroke="#1a2230" stroke-width="3"/>
      <circle cx="30" cy="30" r="20" fill="#ffd966" stroke="#7a5a1f" stroke-width="3"/>
      <circle cx="30" cy="30" r="12" fill="#ff8855"/>
      <circle cx="30" cy="30" r="5" fill="#ffffff"/>
    `,
  },

  // ===== L16-L20 Scale up =====
  bigTorso: {
    w: 180, h: 160,
    svg: `
      <path d="M10 10 L170 10 L160 140 Q90 156 20 140 Z"
            fill="#bbc4d0" stroke="#3a4756" stroke-width="5"/>
      <line x1="90" y1="14" x2="90" y2="148" stroke="#3a4756" stroke-width="3"/>
      <rect x="20" y="20" width="50" height="10" rx="2" fill="#3a4756"/>
      <rect x="110" y="20" width="50" height="10" rx="2" fill="#3a4756"/>
      <circle cx="90" cy="78" r="28" fill="#ffd966" stroke="#7a5a1f" stroke-width="4"/>
      <circle cx="90" cy="78" r="15" fill="#ff8855"/>
      <circle cx="90" cy="78" r="6" fill="#ffffff"/>
      <rect x="22" y="118" width="40" height="14" rx="3" fill="#3a4756"/>
      <rect x="118" y="118" width="40" height="14" rx="3" fill="#3a4756"/>
    `,
  },
  bigLegs: {
    w: 170, h: 170,
    svg: `
      <!-- left leg -->
      <rect x="22" y="5" width="38" height="120" rx="6" fill="#bbc4d0" stroke="#3a4756" stroke-width="5"/>
      <rect x="18" y="60" width="46" height="14" rx="3" fill="#3a4756"/>
      <circle cx="41" cy="100" r="10" fill="#3a4756"/>
      <!-- right leg -->
      <rect x="110" y="5" width="38" height="120" rx="6" fill="#bbc4d0" stroke="#3a4756" stroke-width="5"/>
      <rect x="106" y="60" width="46" height="14" rx="3" fill="#3a4756"/>
      <circle cx="129" cy="100" r="10" fill="#3a4756"/>
    `,
  },
  mechFeet: {
    w: 180, h: 50,
    svg: `
      <!-- left foot -->
      <path d="M5 40 L5 18 Q5 8 18 8 L60 8 Q72 8 78 20 L78 40 Z"
            fill="#3a4756" stroke="#1a2230" stroke-width="4"/>
      <rect x="14" y="20" width="56" height="6" rx="2" fill="#bbc4d0"/>
      <rect x="18" y="32" width="14" height="6" rx="1" fill="#bbc4d0"/>
      <rect x="50" y="32" width="14" height="6" rx="1" fill="#bbc4d0"/>
      <!-- right foot -->
      <path d="M102 40 L102 20 Q108 8 120 8 L162 8 Q175 8 175 18 L175 40 Z"
            fill="#3a4756" stroke="#1a2230" stroke-width="4"/>
      <rect x="110" y="20" width="56" height="6" rx="2" fill="#bbc4d0"/>
      <rect x="116" y="32" width="14" height="6" rx="1" fill="#bbc4d0"/>
      <rect x="148" y="32" width="14" height="6" rx="1" fill="#bbc4d0"/>
    `,
  },
  bulkyShoulders: {
    w: 260, h: 80,
    svg: `
      <!-- left bulky shoulder -->
      <path d="M5 70 L5 30 Q5 5 40 5 L80 5 Q92 5 92 22 L92 70 Z"
            fill="#bbc4d0" stroke="#3a4756" stroke-width="5"/>
      <rect x="18" y="22" width="60" height="8" rx="2" fill="#3a4756"/>
      <rect x="18" y="38" width="60" height="6" rx="2" fill="#3a4756"/>
      <circle cx="48" cy="56" r="6" fill="#d33" stroke="#3a4756" stroke-width="2"/>
      <!-- right bulky shoulder -->
      <path d="M255 70 L255 30 Q255 5 220 5 L180 5 Q168 5 168 22 L168 70 Z"
            fill="#bbc4d0" stroke="#3a4756" stroke-width="5"/>
      <rect x="182" y="22" width="60" height="8" rx="2" fill="#3a4756"/>
      <rect x="182" y="38" width="60" height="6" rx="2" fill="#3a4756"/>
      <circle cx="212" cy="56" r="6" fill="#d33" stroke="#3a4756" stroke-width="2"/>
    `,
  },

  // ===== L21-L25 Mech finale =====
  dualCannons: {
    w: 300, h: 70,
    svg: `
      <!-- left dual cannon -->
      <rect x="5" y="18" width="80" height="18" rx="4" fill="#3a4756" stroke="#1a2230" stroke-width="3"/>
      <rect x="5" y="38" width="80" height="18" rx="4" fill="#3a4756" stroke="#1a2230" stroke-width="3"/>
      <circle cx="82" cy="27" r="7" fill="#d33" stroke="#1a2230" stroke-width="2"/>
      <circle cx="82" cy="47" r="7" fill="#d33" stroke="#1a2230" stroke-width="2"/>
      <rect x="10" y="10" width="20" height="50" rx="3" fill="#bbc4d0" stroke="#3a4756" stroke-width="3"/>
      <!-- right dual cannon -->
      <rect x="215" y="18" width="80" height="18" rx="4" fill="#3a4756" stroke="#1a2230" stroke-width="3"/>
      <rect x="215" y="38" width="80" height="18" rx="4" fill="#3a4756" stroke="#1a2230" stroke-width="3"/>
      <circle cx="218" cy="27" r="7" fill="#d33" stroke="#1a2230" stroke-width="2"/>
      <circle cx="218" cy="47" r="7" fill="#d33" stroke="#1a2230" stroke-width="2"/>
      <rect x="270" y="10" width="20" height="50" rx="3" fill="#bbc4d0" stroke="#3a4756" stroke-width="3"/>
    `,
  },
  energySword: {
    w: 60, h: 180,
    svg: `
      <rect x="22" y="130" width="16" height="42" rx="3" fill="#3a4756" stroke="#1a2230" stroke-width="3"/>
      <rect x="14" y="120" width="32" height="14" rx="3" fill="#bbc4d0" stroke="#3a4756" stroke-width="3"/>
      <path d="M24 120 L30 8 L36 120 Z" fill="#3aa3ff" stroke="#ffffff" stroke-width="3"/>
      <path d="M28 115 L30 20 L32 115 Z" fill="#ffffff" opacity="0.8"/>
    `,
  },
  energyWings: {
    w: 320, h: 200,
    svg: `
      <!-- left wing -->
      <path d="M150 30 Q60 20 10 90 Q40 110 90 100 Q120 95 150 80 Z"
            fill="#3aa3ff" stroke="#ffffff" stroke-width="4" opacity="0.85"/>
      <path d="M150 80 Q70 90 20 150 Q60 160 100 140 Q130 130 150 110 Z"
            fill="#3aa3ff" stroke="#ffffff" stroke-width="4" opacity="0.85"/>
      <!-- jetpack core -->
      <rect x="140" y="40" width="40" height="120" rx="8" fill="#bbc4d0" stroke="#3a4756" stroke-width="5"/>
      <circle cx="160" cy="80" r="10" fill="#ffd966" stroke="#7a5a1f" stroke-width="3"/>
      <circle cx="160" cy="80" r="5" fill="#ff8855"/>
      <rect x="148" y="115" width="24" height="40" rx="3" fill="#3a4756"/>
      <!-- right wing -->
      <path d="M170 30 Q260 20 310 90 Q280 110 230 100 Q200 95 170 80 Z"
            fill="#3aa3ff" stroke="#ffffff" stroke-width="4" opacity="0.85"/>
      <path d="M170 80 Q250 90 300 150 Q260 160 220 140 Q190 130 170 110 Z"
            fill="#3aa3ff" stroke="#ffffff" stroke-width="4" opacity="0.85"/>
    `,
  },
  headCrest: {
    w: 140, h: 70,
    svg: `
      <path d="M70 65 L20 5 L34 30 L52 12 L60 38 L70 8 L80 38 L88 12 L106 30 L120 5 Z"
            fill="#ffd966" stroke="#3a4756" stroke-width="4"/>
      <path d="M55 50 L70 20 L85 50 Z" fill="#d33" stroke="#3a4756" stroke-width="3"/>
    `,
  },
  ultraCore: {
    w: 90, h: 90,
    svg: `
      <circle cx="45" cy="45" r="42" fill="#3a4756" stroke="#1a2230" stroke-width="4"/>
      <circle cx="45" cy="45" r="34" fill="#ffd966" stroke="#7a5a1f" stroke-width="3"/>
      <circle cx="45" cy="45" r="24" fill="#ff8855"/>
      <circle cx="45" cy="45" r="14" fill="#ffffff"/>
      <path d="M45 8 L48 38 L78 45 L48 52 L45 82 L42 52 L12 45 L42 38 Z"
            fill="#ffffff" opacity="0.7"/>
    `,
  },
};

// Stack order (higher number = drawn on top).
const Z_ORDER = {
  // base body
  legs: 1,
  bigLegs: 1,
  mechFeet: 2,
  arms: 2,
  gauntlets: 3,
  body: 3,
  bigTorso: 3,
  chestPlate: 4,
  chestCore: 5,
  ultraCore: 5,
  kneepads: 4,
  shoulderPads: 5,
  bulkyShoulders: 5,
  shoulderCannon: 6,
  handCannon: 6,
  head: 7,
  visor: 8,
  eyes: 9,
  antenna: 10,
  tallAntenna: 10,
  headCrest: 11,
  // back-mounted (drawn behind body via negative-ish, but our renderer just stacks
  // by z; we keep these high but their slot positions are mostly behind the torso
  // visually — use lower z so torso draws over them).
  jetThrusters: 0,
  energyWings: 0,
  dualCannons: 6,
  energySword: 12,
};

// Slot positions per level frame. Coordinates are relative to top-left of the
// per-level frame. Most levels reuse the original 320x400 layout; scale-up
// levels (L16+) use a bigger frame and a recentered layout.
//
// Each slot lookup goes: level.slotPos?.[type] ?? SLOT_POS_DEFAULT[type]
const SLOT_POS_DEFAULT = {
  head:    { x: 110, y: 50 },
  body:    { x: 95,  y: 130 },
  arms:    { x: 50,  y: 170 },
  legs:    { x: 95,  y: 260 },
  antenna: { x: 145, y: 5   },
  eyes:    { x: 125, y: 70  },
  // armor + weapons (on standard 320x400 frame)
  shoulderPads:   { x: 60,  y: 150 },
  chestPlate:     { x: 105, y: 150 },
  visor:          { x: 115, y: 70  },
  kneepads:       { x: 95,  y: 270 },
  gauntlets:      { x: 50,  y: 195 },
  jetThrusters:   { x: 90,  y: 140 },
  handCannon:     { x: 215, y: 180 },
  shoulderCannon: { x: 35,  y: 130 },
  tallAntenna:    { x: 130, y: -30 },
  chestCore:      { x: 130, y: 165 },
};

// Slot positions for the bigger scale-up frames (L16-L25, frame 460x520).
const SLOT_POS_BIG = {
  head:           { x: 180, y: 30 },
  eyes:           { x: 195, y: 50 },
  antenna:        { x: 215, y: -10 },
  tallAntenna:    { x: 200, y: -50 },
  visor:          { x: 185, y: 50 },
  headCrest:      { x: 160, y: -30 },
  bigTorso:       { x: 140, y: 110 },
  body:           { x: 165, y: 130 },
  chestPlate:     { x: 175, y: 140 },
  chestCore:      { x: 200, y: 155 },
  ultraCore:      { x: 185, y: 140 },
  bulkyShoulders: { x: 100, y: 110 },
  shoulderPads:   { x: 130, y: 110 },
  shoulderCannon: { x: 90,  y: 90 },
  arms:           { x: 120, y: 170 },
  gauntlets:      { x: 120, y: 220 },
  handCannon:     { x: 305, y: 200 },
  bigLegs:        { x: 145, y: 280 },
  legs:           { x: 165, y: 290 },
  kneepads:       { x: 165, y: 320 },
  mechFeet:       { x: 140, y: 440 },
  jetThrusters:   { x: 160, y: 120 },
  energyWings:    { x: 70,  y: 100 },
  dualCannons:    { x: 80,  y: 100 },
  energySword:    { x: 380, y: 130 },
};

export const ROBOT_LEVELS = [
  // L1-L5 originals (default 320x400 frame)
  { name: 'Wake Up',    parts: ['head', 'body'] },
  { name: 'Stand Tall', parts: ['head', 'body', 'legs'] },
  { name: 'Arm Up',     parts: ['head', 'body', 'arms', 'legs'] },
  { name: 'Eye See You',parts: ['head', 'body', 'arms', 'legs', 'eyes'] },
  { name: 'Full Build', parts: ['head', 'body', 'arms', 'legs', 'eyes', 'antenna'] },

  // L6-L10 Armor phase (same frame size, friendly robot gets armored)
  { name: 'Shoulder Pads',
    parts: ['head', 'body', 'arms', 'legs', 'eyes', 'antenna', 'shoulderPads'] },
  { name: 'Chest Plate',
    parts: ['head', 'body', 'arms', 'legs', 'eyes', 'antenna', 'shoulderPads', 'chestPlate'] },
  { name: 'Visor Up',
    parts: ['head', 'body', 'arms', 'legs', 'antenna', 'shoulderPads', 'chestPlate', 'visor'] },
  { name: 'Knee Guards',
    parts: ['head', 'body', 'arms', 'legs', 'antenna', 'shoulderPads', 'chestPlate', 'visor', 'kneepads'] },
  { name: 'Power Gauntlets',
    parts: ['head', 'body', 'arms', 'legs', 'antenna', 'shoulderPads', 'chestPlate', 'visor', 'kneepads', 'gauntlets'] },

  // L11-L15 Weapons & gadgets (still standard frame)
  { name: 'Jet Pack',
    parts: ['head', 'body', 'arms', 'legs', 'antenna', 'shoulderPads', 'chestPlate', 'visor', 'gauntlets', 'jetThrusters'] },
  { name: 'Hand Cannon',
    parts: ['head', 'body', 'arms', 'legs', 'antenna', 'shoulderPads', 'chestPlate', 'visor', 'gauntlets', 'jetThrusters', 'handCannon'] },
  { name: 'Shoulder Cannon',
    parts: ['head', 'body', 'arms', 'legs', 'shoulderPads', 'chestPlate', 'visor', 'gauntlets', 'jetThrusters', 'handCannon', 'shoulderCannon'] },
  { name: 'Tall Crest',
    parts: ['head', 'body', 'arms', 'legs', 'shoulderPads', 'chestPlate', 'visor', 'gauntlets', 'jetThrusters', 'handCannon', 'shoulderCannon', 'tallAntenna'] },
  { name: 'Glowing Core',
    parts: ['head', 'body', 'arms', 'legs', 'shoulderPads', 'visor', 'gauntlets', 'jetThrusters', 'handCannon', 'shoulderCannon', 'tallAntenna', 'chestCore'] },

  // L16-L20 Scale up (bigger frame!)
  { name: 'Giant Mode', frameW: 460, frameH: 520, slotPos: SLOT_POS_BIG,
    parts: ['head', 'bigTorso', 'arms', 'legs', 'visor', 'shoulderPads', 'gauntlets', 'jetThrusters', 'handCannon', 'tallAntenna', 'chestCore'] },
  { name: 'Mech Legs', frameW: 460, frameH: 520, slotPos: SLOT_POS_BIG,
    parts: ['head', 'bigTorso', 'arms', 'bigLegs', 'visor', 'shoulderPads', 'gauntlets', 'jetThrusters', 'handCannon', 'tallAntenna', 'chestCore'] },
  { name: 'Mech Feet', frameW: 460, frameH: 520, slotPos: SLOT_POS_BIG,
    parts: ['head', 'bigTorso', 'arms', 'bigLegs', 'mechFeet', 'visor', 'shoulderPads', 'gauntlets', 'jetThrusters', 'handCannon', 'tallAntenna', 'chestCore'] },
  { name: 'Big Shoulders', frameW: 460, frameH: 520, slotPos: SLOT_POS_BIG,
    parts: ['head', 'bigTorso', 'arms', 'bigLegs', 'mechFeet', 'visor', 'bulkyShoulders', 'gauntlets', 'jetThrusters', 'handCannon', 'tallAntenna', 'chestCore'] },
  { name: 'Power Up', frameW: 460, frameH: 520, slotPos: SLOT_POS_BIG,
    parts: ['head', 'bigTorso', 'arms', 'bigLegs', 'mechFeet', 'visor', 'bulkyShoulders', 'gauntlets', 'jetThrusters', 'handCannon', 'shoulderCannon', 'tallAntenna', 'chestCore'] },

  // L21-L25 Mech finale
  { name: 'Twin Cannons', frameW: 480, frameH: 540, slotPos: SLOT_POS_BIG,
    parts: ['head', 'bigTorso', 'arms', 'bigLegs', 'mechFeet', 'visor', 'bulkyShoulders', 'gauntlets', 'jetThrusters', 'tallAntenna', 'chestCore', 'dualCannons'] },
  { name: 'Energy Sword', frameW: 480, frameH: 540, slotPos: SLOT_POS_BIG,
    parts: ['head', 'bigTorso', 'arms', 'bigLegs', 'mechFeet', 'visor', 'bulkyShoulders', 'gauntlets', 'jetThrusters', 'tallAntenna', 'chestCore', 'dualCannons', 'energySword'] },
  { name: 'Wings of Light', frameW: 500, frameH: 560, slotPos: SLOT_POS_BIG,
    parts: ['head', 'bigTorso', 'arms', 'bigLegs', 'mechFeet', 'visor', 'bulkyShoulders', 'gauntlets', 'tallAntenna', 'chestCore', 'dualCannons', 'energySword', 'energyWings'] },
  { name: 'Samurai Crest', frameW: 500, frameH: 560, slotPos: SLOT_POS_BIG,
    parts: ['head', 'bigTorso', 'arms', 'bigLegs', 'mechFeet', 'visor', 'bulkyShoulders', 'gauntlets', 'chestCore', 'dualCannons', 'energySword', 'energyWings', 'headCrest'] },
  { name: 'MECH READY', frameW: 500, frameH: 560, slotPos: SLOT_POS_BIG,
    parts: ['head', 'bigTorso', 'arms', 'bigLegs', 'mechFeet', 'visor', 'bulkyShoulders', 'gauntlets', 'dualCannons', 'energySword', 'energyWings', 'headCrest', 'ultraCore'] },
];

// Backward-compatible defaults (kept as module-level constants for the original
// 320x400 layout; per-level overrides are read off the level object).
const FRAME_W = 320, FRAME_H = 400;

function getFrameSize(level) {
  return {
    w: level.frameW ?? FRAME_W,
    h: level.frameH ?? FRAME_H,
  };
}

function getSlotPos(level, type) {
  const map = level.slotPos ?? SLOT_POS_DEFAULT;
  return map[type] ?? SLOT_POS_DEFAULT[type];
}

function partSvgEl(type, opts = {}) {
  const def = PART_DEFS[type];
  const isOutline = !!opts.outline;
  const inner = isOutline
    ? def.svg.replace(/fill="[^"]*"/g, 'fill="none"')
             .replace(/stroke="[^"]*"/g, 'stroke="#5a6878"')
             .replace(/stroke-width="\d+"/g, 'stroke-width="3" stroke-dasharray="6 4"')
    : def.svg;
  return `
    <svg viewBox="0 0 ${def.w} ${def.h}" width="${def.w}" height="${def.h}"
         style="display:block;pointer-events:none;">
      ${inner}
    </svg>
  `;
}

// Shuffle helper (Fisher-Yates)
function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function renderRobotLevel(container, levelIndex, opts) {
  const level = ROBOT_LEVELS[levelIndex];
  if (!level) return;
  const partTypes = level.parts;
  const { w: frameW, h: frameH } = getFrameSize(level);

  container.innerHTML = `
    <div class="topbar">
      <button class="back-btn" data-act="back">‹</button>
      <h1>${level.name}</h1>
      <div class="spacer"></div>
    </div>
    <div class="robot-stage">
      <div class="robot-frame" id="robot-frame"
           style="width:${frameW}px;height:${frameH}px;"></div>
      <p class="hint">Drag the parts onto the robot</p>
      <div class="parts-tray" id="parts-tray"></div>
    </div>
  `;

  const frame = container.querySelector('#robot-frame');
  const tray = container.querySelector('#parts-tray');

  // ----- Slots (dashed outlines on the frame) -----
  const slotEls = {};
  for (const type of partTypes) {
    const def = PART_DEFS[type];
    const pos = getSlotPos(level, type);
    const slot = document.createElement('div');
    slot.className = 'robot-slot';
    slot.dataset.type = type;
    slot.style.left = pos.x + 'px';
    slot.style.top  = pos.y + 'px';
    slot.style.width = def.w + 'px';
    slot.style.height = def.h + 'px';
    slot.style.zIndex = Z_ORDER[type] ?? 5;
    slot.innerHTML = partSvgEl(type, { outline: true });
    frame.appendChild(slot);
    slotEls[type] = slot;
  }

  // ----- Parts (in tray, draggable) -----
  const partEls = [];
  const trayPartTypes = shuffled(partTypes);
  trayPartTypes.forEach((type) => {
    const def = PART_DEFS[type];
    const part = document.createElement('div');
    part.className = 'robot-part';
    part.dataset.type = type;
    part.style.width = def.w + 'px';
    part.style.height = def.h + 'px';
    part.innerHTML = partSvgEl(type);
    tray.appendChild(part);
    partEls.push(part);
    setupDrag(part);
  });

  let placedCount = 0;
  let won = false;

  function setupDrag(part) {
    let dragging = false;
    let pointerId = null;
    let offsetX = 0, offsetY = 0;
    let homeRect = null;

    part.addEventListener('pointerdown', (e) => {
      if (part.classList.contains('placed') || won) return;
      e.preventDefault();
      dragging = true;
      pointerId = e.pointerId;
      part.setPointerCapture(e.pointerId);
      const rect = part.getBoundingClientRect();
      homeRect = rect;
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      // Lift the part into a fixed-position layer
      document.body.appendChild(part);
      part.style.position = 'fixed';
      part.style.left = rect.left + 'px';
      part.style.top = rect.top + 'px';
      part.style.zIndex = '9999';
      part.style.transition = 'none';
      part.classList.add('dragging');
      sfx.pickup();
    });

    part.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      part.style.left = (e.clientX - offsetX) + 'px';
      part.style.top  = (e.clientY - offsetY) + 'px';
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      part.releasePointerCapture(pointerId);
      part.classList.remove('dragging');
      const cx = e.clientX, cy = e.clientY;
      // Check if dropped on the matching slot
      const slot = slotEls[part.dataset.type];
      let snapped = false;
      if (slot && !slot.classList.contains('filled')) {
        const sr = slot.getBoundingClientRect();
        // Allow some slack — treat the slot as filled if pointer is within an expanded rect
        const pad = 30;
        if (cx >= sr.left - pad && cx <= sr.right + pad &&
            cy >= sr.top  - pad && cy <= sr.bottom + pad) {
          // Animate to slot position in viewport coords first…
          part.style.transition = 'left 0.18s ease, top 0.18s ease';
          part.style.left = sr.left + 'px';
          part.style.top  = sr.top + 'px';
          slot.classList.add('filled');
          part.classList.add('placed');
          snapped = true;
          sfx.snap();
          placedCount++;
          // …then re-parent into the frame so the bob animation carries the parts.
          setTimeout(() => {
            const pos = getSlotPos(level, part.dataset.type);
            frame.appendChild(part);
            part.style.position = 'absolute';
            part.style.left = pos.x + 'px';
            part.style.top  = pos.y + 'px';
            part.style.zIndex = (Z_ORDER[part.dataset.type] ?? 5) + 10;
            part.style.transition = '';
          }, 200);
          if (placedCount === partTypes.length) {
            won = true;
            setTimeout(onWin, 450);
          }
        }
      }
      if (!snapped) {
        // Snap back to tray home position
        part.style.transition = 'left 0.22s ease, top 0.22s ease';
        part.style.left = homeRect.left + 'px';
        part.style.top  = homeRect.top + 'px';
        sfx.reject();
        // After transition, re-parent back into tray
        setTimeout(() => {
          if (!part.classList.contains('placed')) {
            tray.appendChild(part);
            part.style.position = '';
            part.style.left = '';
            part.style.top = '';
            part.style.transition = '';
            part.style.zIndex = '';
          }
        }, 240);
      }
    }
    part.addEventListener('pointerup', endDrag);
    part.addEventListener('pointercancel', endDrag);
  }

  function onWin() {
    sfx.win();
    // Animate the robot
    frame.classList.add('robot-alive');
    // Star burst
    const rect = frame.getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('div');
      s.className = 'star-burst';
      s.textContent = '⭐';
      const angle = (Math.PI * 2 * i) / 14;
      const dist = 120 + Math.random() * 80;
      s.style.setProperty('--end', `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`);
      s.style.left = (rect.left + rect.width / 2) + 'px';
      s.style.top = (rect.top + rect.height / 2) + 'px';
      s.style.position = 'fixed';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1400);
    }
    opts.onComplete(levelIndex);
    setTimeout(() => showWinOverlay(), 1500);
  }

  function showWinOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'win-overlay';
    const hasNext = levelIndex + 1 < ROBOT_LEVELS.length;
    overlay.innerHTML = `
      <div class="win-title">FIXED!</div>
      <div class="win-buttons">
        <button class="big-btn secondary" data-act="levels">Pick Job</button>
        ${hasNext ? '<button class="big-btn" data-act="next">Next ›</button>' : ''}
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      const act = e.target.dataset.act;
      if (act === 'next') opts.onNext(levelIndex + 1);
      else if (act === 'levels') opts.onBack();
    });
    container.appendChild(overlay);
  }

  container.querySelector('[data-act="back"]').addEventListener('click', opts.onBack);
}
