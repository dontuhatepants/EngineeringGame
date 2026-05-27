// Firefighter mechanic — two phases per level:
//   1. DRIVE the fire truck through 3 lanes of traffic to reach the fire.
//   2. SPRAY the burning building until every flame is out.
//
// Controls (touch first):
//   - Drive: tap left/right side of stage to swap lane (truck auto-scrolls up).
//   - Spray: press and drag finger over flames; each flame's fuel drains while
//     the hose is on it. Some levels let flames grow back if you leave them too
//     long — keep moving until they're all out.

import { sfx } from './sound.js';

// =========================================================================
// One-time stylesheet injection
// =========================================================================
(function ensureStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('link[data-firefighter-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles-firefighter.css';
  link.setAttribute('data-firefighter-css', '1');
  document.head.appendChild(link);
})();

// =========================================================================
// LEVEL DATA — 25 levels, each with a drive route and a fire to suppress.
// =========================================================================
//
// drive:
//   distance:  total scrollable length (px). Truck travels from y=distance down
//              to y=0 (rendered top-to-bottom by camera).
//   obstacles: [{ y, lane }, ...]  lane is 0|1|2.
//   speed:     scroll speed (px/sec). Defaults to 220.
//
// spray:
//   flames: [{ x, y, fuel }, ...]  positions are %-of-building (0..100).
//   regrow: 0..1   fraction of max fuel each flame ticks back per second when
//                  not being sprayed (0 = never regrows).
//   floors: 1|2|3  affects building artwork only.
//
// Difficulty progression hand-tuned. obstacle counts and flame counts climb.

export const FIRE_LEVELS = [
  // ---- L1-L5: gentle intro ----
  {
    name: 'First Call',
    drive: { distance: 900, speed: 200, obstacles: [
      { y: 500, lane: 0 },
    ]},
    spray: { floors: 1, regrow: 0, flames: [
      { x: 50, y: 60, fuel: 60 },
    ]},
  },
  {
    name: 'Small Blaze',
    drive: { distance: 1000, speed: 210, obstacles: [
      { y: 400, lane: 2 },
      { y: 700, lane: 0 },
    ]},
    spray: { floors: 1, regrow: 0, flames: [
      { x: 35, y: 60, fuel: 60 },
      { x: 65, y: 60, fuel: 60 },
    ]},
  },
  {
    name: 'Side Street',
    drive: { distance: 1100, speed: 220, obstacles: [
      { y: 350, lane: 1 },
      { y: 650, lane: 0 },
      { y: 900, lane: 2 },
    ]},
    spray: { floors: 1, regrow: 0, flames: [
      { x: 30, y: 60, fuel: 70 },
      { x: 50, y: 60, fuel: 70 },
      { x: 70, y: 60, fuel: 70 },
    ]},
  },
  {
    name: 'Two Cars',
    drive: { distance: 1200, speed: 220, obstacles: [
      { y: 300, lane: 0 },
      { y: 550, lane: 2 },
      { y: 850, lane: 1 },
    ]},
    spray: { floors: 1, regrow: 0, flames: [
      { x: 25, y: 60, fuel: 80 },
      { x: 50, y: 60, fuel: 80 },
      { x: 75, y: 60, fuel: 80 },
    ]},
  },
  {
    name: 'Kitchen Fire',
    drive: { distance: 1200, speed: 230, obstacles: [
      { y: 350, lane: 1 },
      { y: 600, lane: 0 },
      { y: 900, lane: 2 },
    ]},
    spray: { floors: 1, regrow: 0, flames: [
      { x: 25, y: 55, fuel: 80 },
      { x: 40, y: 65, fuel: 80 },
      { x: 60, y: 65, fuel: 80 },
      { x: 75, y: 55, fuel: 80 },
    ]},
  },

  // ---- L6-L10: faster, more dodging, first re-ignite ----
  {
    name: 'Rush Hour',
    drive: { distance: 1400, speed: 250, obstacles: [
      { y: 300, lane: 0 }, { y: 550, lane: 2 },
      { y: 800, lane: 1 }, { y: 1050, lane: 0 },
    ]},
    spray: { floors: 2, regrow: 0, flames: [
      { x: 30, y: 55, fuel: 80 },
      { x: 50, y: 55, fuel: 80 },
      { x: 70, y: 55, fuel: 80 },
      { x: 50, y: 80, fuel: 80 },
    ]},
  },
  {
    name: 'Shop Front',
    drive: { distance: 1400, speed: 250, obstacles: [
      { y: 280, lane: 1 }, { y: 520, lane: 0 },
      { y: 780, lane: 2 }, { y: 1050, lane: 1 },
    ]},
    spray: { floors: 2, regrow: 0.05, flames: [
      { x: 25, y: 55, fuel: 80 },
      { x: 50, y: 55, fuel: 80 },
      { x: 75, y: 55, fuel: 80 },
    ]},
  },
  {
    name: 'Apartment Block',
    drive: { distance: 1500, speed: 260, obstacles: [
      { y: 280, lane: 2 }, { y: 520, lane: 0 }, { y: 760, lane: 1 },
      { y: 1000, lane: 2 }, { y: 1250, lane: 0 },
    ]},
    spray: { floors: 2, regrow: 0.05, flames: [
      { x: 25, y: 55, fuel: 80 },
      { x: 50, y: 55, fuel: 80 },
      { x: 75, y: 55, fuel: 80 },
      { x: 35, y: 80, fuel: 80 },
      { x: 65, y: 80, fuel: 80 },
    ]},
  },
  {
    name: 'Garage Inferno',
    drive: { distance: 1600, speed: 260, obstacles: [
      { y: 300, lane: 0 }, { y: 500, lane: 1 }, { y: 750, lane: 2 },
      { y: 1000, lane: 0 }, { y: 1300, lane: 1 },
    ]},
    spray: { floors: 2, regrow: 0.08, flames: [
      { x: 30, y: 55, fuel: 90 },
      { x: 50, y: 55, fuel: 90 },
      { x: 70, y: 55, fuel: 90 },
      { x: 50, y: 80, fuel: 90 },
    ]},
  },
  {
    name: 'Office Block',
    drive: { distance: 1700, speed: 270, obstacles: [
      { y: 280, lane: 1 }, { y: 480, lane: 2 }, { y: 720, lane: 0 },
      { y: 970, lane: 1 }, { y: 1250, lane: 2 }, { y: 1480, lane: 0 },
    ]},
    spray: { floors: 2, regrow: 0.08, flames: [
      { x: 25, y: 55, fuel: 90 },
      { x: 50, y: 55, fuel: 90 },
      { x: 75, y: 55, fuel: 90 },
      { x: 35, y: 80, fuel: 90 },
      { x: 65, y: 80, fuel: 90 },
    ]},
  },

  // ---- L11-L15: dense traffic, re-ignites get stronger ----
  {
    name: 'Highway',
    drive: { distance: 1800, speed: 290, obstacles: [
      { y: 280, lane: 0 }, { y: 480, lane: 1 }, { y: 700, lane: 2 },
      { y: 950, lane: 0 }, { y: 1180, lane: 1 }, { y: 1400, lane: 2 },
    ]},
    spray: { floors: 2, regrow: 0.1, flames: [
      { x: 25, y: 55, fuel: 90 }, { x: 50, y: 55, fuel: 90 }, { x: 75, y: 55, fuel: 90 },
      { x: 35, y: 80, fuel: 90 }, { x: 65, y: 80, fuel: 90 },
    ]},
  },
  {
    name: 'Warehouse',
    drive: { distance: 1800, speed: 290, obstacles: [
      { y: 280, lane: 2 }, { y: 480, lane: 0 }, { y: 700, lane: 1 },
      { y: 920, lane: 2 }, { y: 1140, lane: 0 }, { y: 1400, lane: 1 },
    ]},
    spray: { floors: 2, regrow: 0.1, flames: [
      { x: 22, y: 55, fuel: 100 }, { x: 40, y: 55, fuel: 100 },
      { x: 60, y: 55, fuel: 100 }, { x: 78, y: 55, fuel: 100 },
      { x: 35, y: 80, fuel: 100 }, { x: 65, y: 80, fuel: 100 },
    ]},
  },
  {
    name: 'Downtown',
    drive: { distance: 1900, speed: 300, obstacles: [
      { y: 280, lane: 1 }, { y: 460, lane: 2 }, { y: 680, lane: 0 },
      { y: 900, lane: 1 }, { y: 1120, lane: 2 }, { y: 1340, lane: 0 },
      { y: 1560, lane: 1 },
    ]},
    spray: { floors: 3, regrow: 0.1, flames: [
      { x: 30, y: 50, fuel: 100 }, { x: 50, y: 50, fuel: 100 }, { x: 70, y: 50, fuel: 100 },
      { x: 35, y: 73, fuel: 100 }, { x: 65, y: 73, fuel: 100 },
    ]},
  },
  {
    name: 'School Wing',
    drive: { distance: 2000, speed: 300, obstacles: [
      { y: 260, lane: 0 }, { y: 440, lane: 1 }, { y: 620, lane: 2 },
      { y: 820, lane: 0 }, { y: 1040, lane: 2 }, { y: 1260, lane: 1 },
      { y: 1500, lane: 0 },
    ]},
    spray: { floors: 3, regrow: 0.12, flames: [
      { x: 25, y: 50, fuel: 100 }, { x: 50, y: 50, fuel: 100 }, { x: 75, y: 50, fuel: 100 },
      { x: 35, y: 73, fuel: 100 }, { x: 65, y: 73, fuel: 100 },
      { x: 50, y: 88, fuel: 100 },
    ]},
  },
  {
    name: 'Stadium',
    drive: { distance: 2100, speed: 310, obstacles: [
      { y: 260, lane: 1 }, { y: 440, lane: 0 }, { y: 620, lane: 2 },
      { y: 820, lane: 1 }, { y: 1020, lane: 0 }, { y: 1220, lane: 2 },
      { y: 1440, lane: 1 }, { y: 1680, lane: 0 },
    ]},
    spray: { floors: 3, regrow: 0.12, flames: [
      { x: 22, y: 50, fuel: 110 }, { x: 40, y: 50, fuel: 110 },
      { x: 60, y: 50, fuel: 110 }, { x: 78, y: 50, fuel: 110 },
      { x: 35, y: 73, fuel: 110 }, { x: 65, y: 73, fuel: 110 },
    ]},
  },

  // ---- L16-L20: heavy traffic + lots of flames ----
  {
    name: 'Old Mill',
    drive: { distance: 2200, speed: 320, obstacles: [
      { y: 240, lane: 0 }, { y: 420, lane: 1 }, { y: 600, lane: 2 },
      { y: 800, lane: 0 }, { y: 1000, lane: 1 }, { y: 1200, lane: 2 },
      { y: 1400, lane: 0 }, { y: 1620, lane: 1 }, { y: 1840, lane: 2 },
    ]},
    spray: { floors: 3, regrow: 0.14, flames: [
      { x: 25, y: 50, fuel: 110 }, { x: 50, y: 50, fuel: 110 }, { x: 75, y: 50, fuel: 110 },
      { x: 35, y: 73, fuel: 110 }, { x: 65, y: 73, fuel: 110 },
      { x: 50, y: 88, fuel: 110 },
    ]},
  },
  {
    name: 'Hospital Wing',
    drive: { distance: 2300, speed: 320, obstacles: [
      { y: 240, lane: 2 }, { y: 420, lane: 1 }, { y: 600, lane: 0 },
      { y: 780, lane: 2 }, { y: 960, lane: 1 }, { y: 1140, lane: 0 },
      { y: 1340, lane: 2 }, { y: 1540, lane: 1 }, { y: 1760, lane: 0 },
      { y: 1980, lane: 2 },
    ]},
    spray: { floors: 3, regrow: 0.14, flames: [
      { x: 22, y: 50, fuel: 110 }, { x: 40, y: 50, fuel: 110 },
      { x: 60, y: 50, fuel: 110 }, { x: 78, y: 50, fuel: 110 },
      { x: 30, y: 73, fuel: 110 }, { x: 50, y: 73, fuel: 110 }, { x: 70, y: 73, fuel: 110 },
      { x: 50, y: 88, fuel: 110 },
    ]},
  },
  {
    name: 'Theatre',
    drive: { distance: 2400, speed: 330, obstacles: [
      { y: 240, lane: 0 }, { y: 400, lane: 1 }, { y: 560, lane: 2 },
      { y: 740, lane: 0 }, { y: 920, lane: 1 }, { y: 1100, lane: 2 },
      { y: 1280, lane: 0 }, { y: 1480, lane: 1 }, { y: 1680, lane: 2 },
      { y: 1900, lane: 0 }, { y: 2100, lane: 1 },
    ]},
    spray: { floors: 3, regrow: 0.16, flames: [
      { x: 22, y: 50, fuel: 120 }, { x: 40, y: 50, fuel: 120 },
      { x: 60, y: 50, fuel: 120 }, { x: 78, y: 50, fuel: 120 },
      { x: 30, y: 73, fuel: 120 }, { x: 50, y: 73, fuel: 120 }, { x: 70, y: 73, fuel: 120 },
      { x: 35, y: 88, fuel: 120 }, { x: 65, y: 88, fuel: 120 },
    ]},
  },
  {
    name: 'Train Station',
    drive: { distance: 2500, speed: 340, obstacles: [
      { y: 240, lane: 1 }, { y: 400, lane: 2 }, { y: 560, lane: 0 },
      { y: 720, lane: 1 }, { y: 880, lane: 2 }, { y: 1060, lane: 0 },
      { y: 1240, lane: 1 }, { y: 1420, lane: 2 }, { y: 1600, lane: 0 },
      { y: 1800, lane: 1 }, { y: 2000, lane: 2 }, { y: 2200, lane: 0 },
    ]},
    spray: { floors: 3, regrow: 0.16, flames: [
      { x: 20, y: 50, fuel: 120 }, { x: 38, y: 50, fuel: 120 },
      { x: 62, y: 50, fuel: 120 }, { x: 80, y: 50, fuel: 120 },
      { x: 30, y: 73, fuel: 120 }, { x: 50, y: 73, fuel: 120 }, { x: 70, y: 73, fuel: 120 },
      { x: 35, y: 88, fuel: 120 }, { x: 65, y: 88, fuel: 120 },
    ]},
  },
  {
    name: 'Library',
    drive: { distance: 2600, speed: 340, obstacles: [
      { y: 240, lane: 0 }, { y: 380, lane: 1 }, { y: 540, lane: 2 },
      { y: 700, lane: 0 }, { y: 860, lane: 1 }, { y: 1020, lane: 2 },
      { y: 1180, lane: 0 }, { y: 1360, lane: 1 }, { y: 1540, lane: 2 },
      { y: 1720, lane: 0 }, { y: 1920, lane: 1 }, { y: 2120, lane: 2 },
      { y: 2320, lane: 0 },
    ]},
    spray: { floors: 3, regrow: 0.18, flames: [
      { x: 20, y: 50, fuel: 130 }, { x: 38, y: 50, fuel: 130 },
      { x: 62, y: 50, fuel: 130 }, { x: 80, y: 50, fuel: 130 },
      { x: 25, y: 73, fuel: 130 }, { x: 45, y: 73, fuel: 130 },
      { x: 55, y: 73, fuel: 130 }, { x: 75, y: 73, fuel: 130 },
      { x: 35, y: 88, fuel: 130 }, { x: 65, y: 88, fuel: 130 },
    ]},
  },

  // ---- L21-L25: ultimate firefighter ----
  {
    name: 'Factory',
    drive: { distance: 2700, speed: 360, obstacles: [
      { y: 220, lane: 2 }, { y: 380, lane: 1 }, { y: 540, lane: 0 },
      { y: 700, lane: 2 }, { y: 860, lane: 1 }, { y: 1020, lane: 0 },
      { y: 1180, lane: 2 }, { y: 1340, lane: 1 }, { y: 1500, lane: 0 },
      { y: 1680, lane: 2 }, { y: 1860, lane: 1 }, { y: 2040, lane: 0 },
      { y: 2220, lane: 2 }, { y: 2400, lane: 1 },
    ]},
    spray: { floors: 3, regrow: 0.2, flames: [
      { x: 18, y: 50, fuel: 130 }, { x: 36, y: 50, fuel: 130 },
      { x: 54, y: 50, fuel: 130 }, { x: 72, y: 50, fuel: 130 }, { x: 88, y: 50, fuel: 130 },
      { x: 25, y: 73, fuel: 130 }, { x: 50, y: 73, fuel: 130 }, { x: 75, y: 73, fuel: 130 },
      { x: 35, y: 88, fuel: 130 }, { x: 65, y: 88, fuel: 130 },
    ]},
  },
  {
    name: 'Cathedral',
    drive: { distance: 2800, speed: 370, obstacles: [
      { y: 220, lane: 0 }, { y: 380, lane: 1 }, { y: 540, lane: 2 },
      { y: 680, lane: 0 }, { y: 820, lane: 1 }, { y: 980, lane: 2 },
      { y: 1140, lane: 0 }, { y: 1300, lane: 1 }, { y: 1460, lane: 2 },
      { y: 1640, lane: 0 }, { y: 1820, lane: 1 }, { y: 2000, lane: 2 },
      { y: 2180, lane: 0 }, { y: 2360, lane: 1 }, { y: 2540, lane: 2 },
    ]},
    spray: { floors: 3, regrow: 0.2, flames: [
      { x: 18, y: 50, fuel: 140 }, { x: 36, y: 50, fuel: 140 },
      { x: 54, y: 50, fuel: 140 }, { x: 72, y: 50, fuel: 140 }, { x: 88, y: 50, fuel: 140 },
      { x: 25, y: 73, fuel: 140 }, { x: 50, y: 73, fuel: 140 }, { x: 75, y: 73, fuel: 140 },
      { x: 30, y: 88, fuel: 140 }, { x: 50, y: 88, fuel: 140 }, { x: 70, y: 88, fuel: 140 },
    ]},
  },
  {
    name: 'High Rise',
    drive: { distance: 2900, speed: 380, obstacles: [
      { y: 220, lane: 1 }, { y: 360, lane: 2 }, { y: 500, lane: 0 },
      { y: 660, lane: 1 }, { y: 820, lane: 2 }, { y: 980, lane: 0 },
      { y: 1140, lane: 1 }, { y: 1300, lane: 2 }, { y: 1460, lane: 0 },
      { y: 1640, lane: 1 }, { y: 1820, lane: 2 }, { y: 2000, lane: 0 },
      { y: 2180, lane: 1 }, { y: 2360, lane: 2 }, { y: 2540, lane: 0 },
      { y: 2720, lane: 1 },
    ]},
    spray: { floors: 3, regrow: 0.22, flames: [
      { x: 18, y: 50, fuel: 140 }, { x: 36, y: 50, fuel: 140 },
      { x: 54, y: 50, fuel: 140 }, { x: 72, y: 50, fuel: 140 }, { x: 88, y: 50, fuel: 140 },
      { x: 22, y: 73, fuel: 140 }, { x: 42, y: 73, fuel: 140 },
      { x: 58, y: 73, fuel: 140 }, { x: 78, y: 73, fuel: 140 },
      { x: 30, y: 88, fuel: 140 }, { x: 50, y: 88, fuel: 140 }, { x: 70, y: 88, fuel: 140 },
    ]},
  },
  {
    name: 'Refinery',
    drive: { distance: 3000, speed: 390, obstacles: [
      { y: 220, lane: 0 }, { y: 360, lane: 1 }, { y: 500, lane: 2 },
      { y: 640, lane: 0 }, { y: 800, lane: 1 }, { y: 960, lane: 2 },
      { y: 1120, lane: 0 }, { y: 1280, lane: 1 }, { y: 1440, lane: 2 },
      { y: 1600, lane: 0 }, { y: 1780, lane: 1 }, { y: 1960, lane: 2 },
      { y: 2140, lane: 0 }, { y: 2320, lane: 1 }, { y: 2500, lane: 2 },
      { y: 2680, lane: 0 }, { y: 2860, lane: 1 },
    ]},
    spray: { floors: 3, regrow: 0.24, flames: [
      { x: 16, y: 50, fuel: 150 }, { x: 34, y: 50, fuel: 150 },
      { x: 50, y: 50, fuel: 150 }, { x: 66, y: 50, fuel: 150 }, { x: 84, y: 50, fuel: 150 },
      { x: 22, y: 73, fuel: 150 }, { x: 42, y: 73, fuel: 150 },
      { x: 58, y: 73, fuel: 150 }, { x: 78, y: 73, fuel: 150 },
      { x: 25, y: 88, fuel: 150 }, { x: 50, y: 88, fuel: 150 }, { x: 75, y: 88, fuel: 150 },
    ]},
  },
  {
    name: 'City Aflame',
    drive: { distance: 3200, speed: 400, obstacles: [
      { y: 220, lane: 1 }, { y: 360, lane: 0 }, { y: 500, lane: 2 },
      { y: 640, lane: 1 }, { y: 780, lane: 0 }, { y: 920, lane: 2 },
      { y: 1080, lane: 1 }, { y: 1240, lane: 0 }, { y: 1400, lane: 2 },
      { y: 1560, lane: 1 }, { y: 1720, lane: 0 }, { y: 1880, lane: 2 },
      { y: 2060, lane: 1 }, { y: 2240, lane: 0 }, { y: 2420, lane: 2 },
      { y: 2600, lane: 1 }, { y: 2780, lane: 0 }, { y: 2960, lane: 2 },
    ]},
    spray: { floors: 3, regrow: 0.28, flames: [
      { x: 14, y: 50, fuel: 160 }, { x: 30, y: 50, fuel: 160 },
      { x: 46, y: 50, fuel: 160 }, { x: 62, y: 50, fuel: 160 },
      { x: 78, y: 50, fuel: 160 }, { x: 90, y: 50, fuel: 160 },
      { x: 22, y: 73, fuel: 160 }, { x: 42, y: 73, fuel: 160 },
      { x: 58, y: 73, fuel: 160 }, { x: 78, y: 73, fuel: 160 },
      { x: 25, y: 88, fuel: 160 }, { x: 45, y: 88, fuel: 160 },
      { x: 55, y: 88, fuel: 160 }, { x: 75, y: 88, fuel: 160 },
    ]},
  },
];

// =========================================================================
// SVG building blocks
// =========================================================================

function truckSvg() {
  return `
    <svg viewBox="0 0 80 120" width="80" height="120">
      <!-- ladder on top -->
      <rect x="14" y="8" width="52" height="6" fill="#888" stroke="#333" stroke-width="1.5"/>
      <line x1="22" y1="8" x2="22" y2="14" stroke="#333" stroke-width="1"/>
      <line x1="32" y1="8" x2="32" y2="14" stroke="#333" stroke-width="1"/>
      <line x1="42" y1="8" x2="42" y2="14" stroke="#333" stroke-width="1"/>
      <line x1="52" y1="8" x2="52" y2="14" stroke="#333" stroke-width="1"/>
      <line x1="62" y1="8" x2="62" y2="14" stroke="#333" stroke-width="1"/>
      <!-- cab -->
      <rect x="12" y="14" width="56" height="28" rx="4" fill="#d32020" stroke="#5a1010" stroke-width="2"/>
      <!-- windshield -->
      <rect x="18" y="20" width="44" height="16" rx="2" fill="#9fcfe0" stroke="#1f5a70" stroke-width="1.5"/>
      <!-- body -->
      <rect x="10" y="42" width="60" height="58" rx="4" fill="#d32020" stroke="#5a1010" stroke-width="2"/>
      <!-- stripes -->
      <rect x="10" y="62" width="60" height="4" fill="#ffd966"/>
      <rect x="10" y="74" width="60" height="4" fill="#ffd966"/>
      <!-- side ladder rungs -->
      <rect x="14" y="84" width="52" height="3" fill="#888"/>
      <rect x="14" y="92" width="52" height="3" fill="#888"/>
      <!-- wheels -->
      <circle cx="18" cy="100" r="8" fill="#222" stroke="#000" stroke-width="2"/>
      <circle cx="18" cy="100" r="3" fill="#888"/>
      <circle cx="62" cy="100" r="8" fill="#222" stroke="#000" stroke-width="2"/>
      <circle cx="62" cy="100" r="3" fill="#888"/>
      <!-- siren on top of cab -->
      <rect x="34" y="4" width="12" height="6" rx="1" fill="#3aa3ff" stroke="#1f5d99" stroke-width="1"/>
      <circle cx="40" cy="3" r="2" fill="#fff58a"/>
    </svg>
  `;
}

function carSvg(color) {
  return `
    <svg viewBox="0 0 70 100" width="70" height="100">
      <!-- body -->
      <rect x="8" y="10" width="54" height="80" rx="6" fill="${color}" stroke="#222" stroke-width="2"/>
      <!-- windshield -->
      <rect x="14" y="18" width="42" height="22" rx="3" fill="#9fcfe0" stroke="#1f5a70" stroke-width="1.5"/>
      <!-- rear window -->
      <rect x="14" y="58" width="42" height="22" rx="3" fill="#9fcfe0" stroke="#1f5a70" stroke-width="1.5"/>
      <!-- door strip -->
      <line x1="8" y1="48" x2="62" y2="48" stroke="#222" stroke-width="2"/>
      <!-- wheels -->
      <rect x="2" y="20" width="8" height="14" rx="2" fill="#222"/>
      <rect x="60" y="20" width="8" height="14" rx="2" fill="#222"/>
      <rect x="2" y="66" width="8" height="14" rx="2" fill="#222"/>
      <rect x="60" y="66" width="8" height="14" rx="2" fill="#222"/>
    </svg>
  `;
}

function coneSvg() {
  return `
    <svg viewBox="0 0 60 80" width="60" height="80">
      <polygon points="30,8 50,68 10,68" fill="#ff8a30" stroke="#5a3010" stroke-width="2"/>
      <rect x="6" y="68" width="48" height="8" rx="1" fill="#3a3a3a" stroke="#000" stroke-width="1.5"/>
      <rect x="14" y="32" width="32" height="6" fill="#fff"/>
      <rect x="18" y="48" width="24" height="6" fill="#fff"/>
    </svg>
  `;
}

function firefighterSvg() {
  // Two legs are addressable from CSS (.ff-leg-l / .ff-leg-r) so we can pump
  // them with a keyframe animation. transform-origin is set at the hip.
  return `
    <svg viewBox="0 0 80 140" width="80" height="140" overflow="visible">
      <!-- back leg -->
      <g class="ff-leg ff-leg-l">
        <rect x="24" y="78" width="12" height="34" rx="2" fill="#2a3850" stroke="#101828" stroke-width="2"/>
        <rect x="22" y="108" width="16" height="10" rx="2" fill="#1a1208" stroke="#000" stroke-width="2"/>
      </g>
      <!-- front leg -->
      <g class="ff-leg ff-leg-r">
        <rect x="44" y="78" width="12" height="34" rx="2" fill="#2a3850" stroke="#101828" stroke-width="2"/>
        <rect x="42" y="108" width="16" height="10" rx="2" fill="#1a1208" stroke="#000" stroke-width="2"/>
      </g>
      <!-- jacket body -->
      <rect x="18" y="38" width="44" height="44" rx="4" fill="#d32020" stroke="#5a1010" stroke-width="2"/>
      <!-- reflective stripes -->
      <rect x="18" y="52" width="44" height="4" fill="#ffd966"/>
      <rect x="18" y="64" width="44" height="4" fill="#ffd966"/>
      <!-- arms -->
      <rect x="8" y="42" width="12" height="30" rx="3" fill="#d32020" stroke="#5a1010" stroke-width="2"/>
      <rect x="60" y="42" width="12" height="30" rx="3" fill="#d32020" stroke="#5a1010" stroke-width="2"/>
      <!-- hands holding the hose nozzle -->
      <circle cx="14" cy="76" r="5" fill="#f0c090" stroke="#5a3010" stroke-width="2"/>
      <circle cx="66" cy="76" r="5" fill="#f0c090" stroke="#5a3010" stroke-width="2"/>
      <!-- hose nozzle (sits between hands, points right by default) -->
      <rect x="60" y="72" width="22" height="8" rx="2" fill="#bbb" stroke="#333" stroke-width="2"/>
      <rect x="78" y="70" width="6" height="12" rx="1" fill="#888" stroke="#333" stroke-width="2"/>
      <!-- head -->
      <circle cx="40" cy="26" r="12" fill="#f0c090" stroke="#5a3010" stroke-width="2"/>
      <!-- mustache so it reads as a goofy fireman -->
      <rect x="32" y="30" width="16" height="3" rx="1.5" fill="#3a2410"/>
      <!-- helmet -->
      <path d="M 24 22 Q 24 10 40 10 Q 56 10 56 22 L 58 26 L 22 26 Z"
            fill="#ffd400" stroke="#7a5a00" stroke-width="2"/>
      <!-- helmet badge -->
      <circle cx="40" cy="18" r="3" fill="#d32020" stroke="#5a1010" stroke-width="1"/>
      <!-- helmet brim -->
      <ellipse cx="40" cy="26" rx="20" ry="3" fill="#d3a000" stroke="#7a5a00" stroke-width="2"/>
    </svg>
  `;
}

function parkedTruckSvg() {
  // Smaller, side-on truck that sits behind the firefighter.
  return `
    <svg viewBox="0 0 140 90" width="140" height="90">
      <!-- body -->
      <rect x="6" y="32" width="100" height="38" rx="3" fill="#d32020" stroke="#5a1010" stroke-width="2"/>
      <!-- stripes -->
      <rect x="6" y="42" width="100" height="3" fill="#ffd966"/>
      <rect x="6" y="56" width="100" height="3" fill="#ffd966"/>
      <!-- cab -->
      <rect x="106" y="38" width="28" height="32" rx="3" fill="#d32020" stroke="#5a1010" stroke-width="2"/>
      <rect x="110" y="42" width="20" height="14" fill="#9fcfe0" stroke="#1f5a70" stroke-width="1.5"/>
      <!-- siren -->
      <rect x="116" y="32" width="10" height="5" rx="1" fill="#3aa3ff" stroke="#1f5d99" stroke-width="1"/>
      <!-- ladder on top -->
      <rect x="10" y="24" width="96" height="6" fill="#888" stroke="#333" stroke-width="1.5"/>
      <line x1="20" y1="24" x2="20" y2="30" stroke="#333" stroke-width="1"/>
      <line x1="34" y1="24" x2="34" y2="30" stroke="#333" stroke-width="1"/>
      <line x1="48" y1="24" x2="48" y2="30" stroke="#333" stroke-width="1"/>
      <line x1="62" y1="24" x2="62" y2="30" stroke="#333" stroke-width="1"/>
      <line x1="76" y1="24" x2="76" y2="30" stroke="#333" stroke-width="1"/>
      <line x1="90" y1="24" x2="90" y2="30" stroke="#333" stroke-width="1"/>
      <!-- wheels -->
      <circle cx="26" cy="74" r="10" fill="#222" stroke="#000" stroke-width="2"/>
      <circle cx="26" cy="74" r="4" fill="#888"/>
      <circle cx="118" cy="74" r="10" fill="#222" stroke="#000" stroke-width="2"/>
      <circle cx="118" cy="74" r="4" fill="#888"/>
    </svg>
  `;
}

function buildingSvg(floors) {
  const totalH = floors === 1 ? 200 : floors === 2 ? 280 : 360;
  const baseY = 360 - totalH;
  let windows = '';
  if (floors >= 1) {
    // ground floor: door + 2 small windows
    const y = 360 - 60;
    windows += `<rect x="46" y="${y - 30}" width="28" height="50" rx="2" fill="#3a2410" stroke="#1a0a04" stroke-width="2"/>`;
    windows += `<rect x="14" y="${y - 30}" width="20" height="22" fill="#88c8e8" stroke="#3a4756" stroke-width="2"/>`;
    windows += `<rect x="86" y="${y - 30}" width="20" height="22" fill="#88c8e8" stroke="#3a4756" stroke-width="2"/>`;
  }
  if (floors >= 2) {
    const y = baseY + 30;
    for (let i = 0; i < 4; i++) {
      windows += `<rect x="${10 + i * 26}" y="${y}" width="20" height="22" fill="#88c8e8" stroke="#3a4756" stroke-width="2"/>`;
    }
  }
  if (floors >= 3) {
    const y = baseY + 30 + 50;
    for (let i = 0; i < 4; i++) {
      windows += `<rect x="${10 + i * 26}" y="${y}" width="20" height="22" fill="#88c8e8" stroke="#3a4756" stroke-width="2"/>`;
    }
  }
  return `
    <svg viewBox="0 0 120 360" width="100%" height="100%" preserveAspectRatio="none">
      <!-- main body -->
      <rect x="4" y="${baseY}" width="112" height="${totalH}" fill="#a07a4a" stroke="#3a2410" stroke-width="3"/>
      <!-- roof -->
      <polygon points="0,${baseY} 60,${baseY - 18} 120,${baseY}" fill="#5a3210" stroke="#1a0a04" stroke-width="2"/>
      <!-- windows / door -->
      ${windows}
    </svg>
  `;
}

function flameSvg(intensity) {
  // intensity: 0..1, scales size + adds glow.
  const scale = 0.5 + intensity * 0.5;
  return `
    <svg viewBox="0 0 60 80" width="100%" height="100%" style="transform: scale(${scale}); transform-origin: 50% 100%;">
      <defs>
        <radialGradient id="fg" cx="50%" cy="60%">
          <stop offset="0%" stop-color="#ffe080"/>
          <stop offset="50%" stop-color="#ff8830"/>
          <stop offset="100%" stop-color="#d83008"/>
        </radialGradient>
      </defs>
      <path d="M 30 78 C 4 70 6 48 18 36 C 18 50 26 46 24 30 C 36 38 36 22 28 8 C 50 22 56 50 50 64 C 48 72 40 78 30 78 Z"
            fill="url(#fg)" stroke="#7a1808" stroke-width="2"/>
      <path d="M 30 70 C 20 64 22 52 28 46 C 28 54 34 52 32 42 C 38 48 42 56 38 62 C 36 66 32 70 30 70 Z"
            fill="#ffe080" opacity="0.8"/>
    </svg>
  `;
}

// =========================================================================
// Render entry point
// =========================================================================

export function renderFireLevel(container, levelIndex, opts) {
  const level = FIRE_LEVELS[levelIndex];
  if (!level) {
    container.innerHTML = '<p style="padding:20px;">Level not found.</p>';
    return;
  }

  container.innerHTML = `
    <div class="topbar">
      <button class="back-btn" data-act="back">‹</button>
      <h1>${level.name}</h1>
      <div class="spacer"></div>
    </div>
    <div class="ff-game">
      <div class="ff-stage" id="ff-stage"></div>
    </div>
  `;

  const stage = container.querySelector('#ff-stage');
  container.querySelector('[data-act="back"]').addEventListener('click', () => {
    cleanup();
    if (opts.onBack) opts.onBack();
  });

  // ---- shared cleanup/cancellation ----
  let cancelled = false;
  let raf = 0;
  function cleanup() {
    cancelled = true;
    if (raf) cancelAnimationFrame(raf);
    if (typeof window !== 'undefined') window.removeEventListener('resize', onResize);
  }
  function onResize() { /* CSS handles scaling, nothing to do */ }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize);
  }

  // ====== PHASE 1: DRIVE ======
  startDrive();

  function startDrive() {
    if (cancelled) return;
    const drive = level.drive;
    const speed = drive.speed || 220;
    const distance = drive.distance;

    stage.innerHTML = `
      <div class="ff-phase-banner">DRIVE TO THE FIRE</div>
      <div class="ff-road">
        <div class="ff-road-bg"></div>
        <div class="ff-road-world" id="ff-road-world"></div>
        <div class="ff-truck" id="ff-truck">${truckSvg()}</div>
        <div class="ff-progress"><div class="ff-progress-fill" id="ff-progress-fill"></div></div>
        ${levelIndex === 0 ? '<div class="ff-touch-hint">Tap left or right to swap lanes</div>' : ''}
      </div>
    `;

    const world = stage.querySelector('#ff-road-world');
    const truckEl = stage.querySelector('#ff-truck');
    const progressFill = stage.querySelector('#ff-progress-fill');

    // Build obstacles in the world. The world is a tall strip; we render the
    // visible window by translating it as the truck progresses.
    const STAGE_VH = 540;    // logical height of visible stage region
    const ROAD_W = 360;      // logical road width
    const LANE_X = [60, 180, 300]; // center x for each of 3 lanes (in road coords)

    world.style.height = (distance + STAGE_VH) + 'px';

    const obstacleEls = [];
    const carColors = ['#3a8030', '#3aa3ff', '#ffd966', '#a040c0', '#e07020'];
    drive.obstacles.forEach((o, i) => {
      const el = document.createElement('div');
      el.className = 'ff-obstacle';
      // Decorate obstacles with variety; use cone every 3rd one for visual interest.
      const useCone = (i % 4) === 3;
      el.innerHTML = useCone ? coneSvg() : carSvg(carColors[i % carColors.length]);
      el.dataset.lane = o.lane;
      el.dataset.y = o.y;
      world.appendChild(el);
      obstacleEls.push({ el, lane: o.lane, y: o.y, isCone: useCone });
    });

    // State
    let lane = 1;            // current lane (0,1,2) — truck starts middle
    let progress = 0;        // 0..distance traveled
    let crashed = false;
    let phaseDone = false;
    let crashFlashEl = null;

    // Position truck initially
    function placeTruck() {
      // Truck shown at fixed screen-y near bottom (e.g., 75% from top).
      // X is determined by lane.
      const xPct = (LANE_X[lane] / ROAD_W) * 100;
      truckEl.style.left = `calc(${xPct}% - 40px)`;
    }
    placeTruck();

    // Tap handling
    function onTap(e) {
      if (crashed || phaseDone) return;
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0]?.clientX)) - rect.left;
      const isLeft = x < rect.width / 2;
      if (isLeft && lane > 0) {
        lane--;
        sfx.click();
        placeTruck();
      } else if (!isLeft && lane < 2) {
        lane++;
        sfx.click();
        placeTruck();
      }
    }
    stage.addEventListener('pointerdown', onTap);

    // Layout the obstacles in the world
    function layoutObstacles() {
      obstacleEls.forEach(o => {
        const xPct = (LANE_X[o.lane] / ROAD_W) * 100;
        const offsetX = o.isCone ? 30 : 35;
        o.el.style.left = `calc(${xPct}% - ${offsetX}px)`;
        // y in world coords: 0 = start (bottom of visible at start); distance = end.
        // We render world such that y=0 is near the bottom of the world strip,
        // and the truck "moves up" by translating world DOWN.
        // World height = distance + STAGE_VH; obstacle screen pos = (distance + STAGE_VH - 100) - y.
        const yPx = (distance + STAGE_VH - 120) - o.y;
        o.el.style.top = yPx + 'px';
      });
    }
    layoutObstacles();

    // Animation
    let lastT = performance.now();
    function step(now) {
      if (cancelled || phaseDone) return;
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      if (!crashed) {
        progress += speed * dt;
        if (progress >= distance) {
          progress = distance;
          phaseDone = true;
          // Smooth out to spray phase
          setTimeout(() => transitionToSpray(), 800);
        }
      }

      // Move world: translate world so that the section corresponding to
      // `progress` aligns with truck's screen y.
      // World total height = distance + STAGE_VH.
      // We want bottom of world to start at (STAGE_VH - 120) initially (so
      // y=0 obstacles sit just above the truck). As progress grows we translate
      // world down so higher-y obstacles come into view.
      const translateY = progress;
      world.style.transform = `translateY(${translateY}px)`;

      // Progress bar
      progressFill.style.width = ((progress / distance) * 100) + '%';

      // Collision check: the truck occupies a fixed screen y. Find obstacles
      // whose world-y is within [progress - 30, progress + 60] AND share the lane.
      if (!crashed) {
        for (const o of obstacleEls) {
          if (o.lane !== lane) continue;
          // Truck's effective world-y = progress (truck is at fixed screen pos,
          // world translates by progress, so the world point currently aligned
          // with the truck is at y == progress).
          if (Math.abs(o.y - progress) < 50) {
            crashed = true;
            sfx.buzz();
            crashFlashEl = document.createElement('div');
            crashFlashEl.className = 'ff-crash-flash';
            stage.appendChild(crashFlashEl);
            setTimeout(() => {
              if (crashFlashEl) crashFlashEl.remove();
              if (cancelled) return;
              // Stop this drive instance's loop before spawning a fresh one,
              // otherwise old step() callbacks would race against the new one.
              phaseDone = true;
              if (raf) cancelAnimationFrame(raf);
              stage.removeEventListener('pointerdown', onTap);
              startDrive();
            }, 700);
            break;
          }
        }
      }

      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);

    function transitionToSpray() {
      stage.removeEventListener('pointerdown', onTap);
      // Brief transition: arrived banner
      const arrived = document.createElement('div');
      arrived.className = 'ff-arrived';
      arrived.textContent = 'ARRIVED!';
      stage.appendChild(arrived);
      sfx.snap();
      setTimeout(() => {
        if (cancelled) return;
        startSpray();
      }, 900);
    }
  }

  // ====== PHASE 2: SPRAY ======
  function startSpray() {
    if (cancelled) return;
    const spray = level.spray;

    stage.innerHTML = `
      <div class="ff-phase-banner">PUT OUT THE FIRE</div>
      <div class="ff-spray-scene" id="ff-spray-scene">
        <div class="ff-sky"></div>
        <div class="ff-spray-building" id="ff-spray-building"></div>
        <div class="ff-spray-ground"></div>
        <div class="ff-parked-truck">${parkedTruckSvg()}</div>
        <div class="ff-firefighter" id="ff-firefighter">${firefighterSvg()}</div>
        <div class="ff-flames" id="ff-flames"></div>
        <div class="ff-hose-jet" id="ff-hose-jet"></div>
        ${levelIndex === 0 ? '<div class="ff-touch-hint">Drag the firefighter to move. Tap flames to spray.</div>' : ''}
      </div>
    `;

    const scene = stage.querySelector('#ff-spray-scene');
    const buildingHost = stage.querySelector('#ff-spray-building');
    const flamesHost = stage.querySelector('#ff-flames');
    const hoseJet = stage.querySelector('#ff-hose-jet');
    const fighterEl = stage.querySelector('#ff-firefighter');

    // Render building artwork
    buildingHost.innerHTML = buildingSvg(spray.floors || 1);

    // Build flame state
    const flames = spray.flames.map(f => ({
      ...f,
      maxFuel: f.fuel,
      out: false,
      el: null,
    }));

    // Render flames as elements positioned via % within the building host.
    flames.forEach((f, i) => {
      const el = document.createElement('div');
      el.className = 'ff-flame';
      el.style.left = f.x + '%';
      el.style.top = f.y + '%';
      el.innerHTML = flameSvg(1);
      el.dataset.idx = i;
      flamesHost.appendChild(el);
      f.el = el;
    });

    // ---- Firefighter position (px from scene's left edge) ----
    // He stands on the ground, in front of the truck initially.
    let ffXPx = 0;
    let ffWalking = false;
    function placeFighter() {
      const rect = scene.getBoundingClientRect();
      // Clamp him to stay on the ground inside the scene.
      const minX = rect.width * 0.04;
      const maxX = rect.width * 0.94;
      ffXPx = Math.max(minX, Math.min(maxX, ffXPx));
      fighterEl.style.left = ffXPx + 'px';
    }
    // Init at left side (in front of truck).
    requestAnimationFrame(() => {
      const rect = scene.getBoundingClientRect();
      ffXPx = rect.width * 0.18;
      placeFighter();
    });

    // Hose: only reaches flames within RANGE pixels of the firefighter's nozzle.
    // RANGE is computed as a fraction of scene width so it scales responsively.
    function getRangePx() {
      const rect = scene.getBoundingClientRect();
      return rect.width * 0.34;
    }
    // Where the nozzle sits in scene-relative px (right hand of fighter).
    function nozzlePos() {
      const rect = scene.getBoundingClientRect();
      // Fighter SVG is 80 wide; nozzle is at x≈82 relative to SVG. Fighter
      // element's left is the SVG's left, so nozzle ≈ ffXPx + 64 px in scene.
      // Hand height: ~70% down the fighter SVG (which is 140 tall) plus ground
      // offset. We anchor the SVG bottom roughly at `groundY`.
      const groundY = rect.height * 0.82;  // matches CSS ground top
      return { x: ffXPx + 60, y: groundY - 60 };
    }

    // ---- Pointer modes: 'walk' = dragging firefighter, 'spray' = aiming hose
    let mode = null;
    let sprayPx = 0;
    let sprayPy = 0;
    let won = false;
    let lastT = performance.now();

    function hitFighter(e) {
      const r = fighterEl.getBoundingClientRect();
      // Generous hit box (kid-friendly): pad 12px each side.
      const px = e.clientX;
      const py = e.clientY;
      return px >= r.left - 12 && px <= r.right + 12
          && py >= r.top - 12 && py <= r.bottom + 12;
    }

    function pointerDown(e) {
      if (won) return;
      e.preventDefault();
      if (hitFighter(e)) {
        mode = 'walk';
        ffWalking = true;
        fighterEl.classList.add('walking');
        updateFighterFromEvent(e);
      } else {
        mode = 'spray';
        updateSprayFromEvent(e);
        sfx.flow();
      }
    }
    function pointerMove(e) {
      if (!mode || won) return;
      e.preventDefault();
      if (mode === 'walk') updateFighterFromEvent(e);
      else updateSprayFromEvent(e);
    }
    function pointerUp() {
      if (mode === 'walk') {
        ffWalking = false;
        fighterEl.classList.remove('walking');
      }
      mode = null;
      hoseJet.style.opacity = '0';
    }

    function updateFighterFromEvent(e) {
      const rect = scene.getBoundingClientRect();
      const targetX = e.clientX - rect.left;
      // Center the fighter under the finger (subtract half the SVG width = 40)
      ffXPx = targetX - 40;
      placeFighter();
    }
    function updateSprayFromEvent(e) {
      const rect = scene.getBoundingClientRect();
      sprayPx = e.clientX - rect.left;
      sprayPy = e.clientY - rect.top;
      // Draw the jet from the nozzle out toward the finger — but cap at range.
      const noz = nozzlePos();
      const dx = sprayPx - noz.x;
      const dy = sprayPy - noz.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const range = getRangePx();
      const drawLen = Math.min(len, range);
      const ang = Math.atan2(dy, dx) * 180 / Math.PI;
      hoseJet.style.opacity = '1';
      hoseJet.style.width = drawLen + 'px';
      hoseJet.style.left = noz.x + 'px';
      hoseJet.style.top = noz.y + 'px';
      hoseJet.style.transform = `rotate(${ang}deg)`;
    }

    scene.addEventListener('pointerdown', pointerDown);
    scene.addEventListener('pointermove', pointerMove);
    scene.addEventListener('pointerup', pointerUp);
    scene.addEventListener('pointercancel', pointerUp);
    scene.addEventListener('pointerleave', pointerUp);

    // Main loop
    function step(now) {
      if (cancelled || won) return;
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      // Find which flame (if any) the hose is currently extinguishing.
      let hitIdx = -1;
      if (mode === 'spray') {
        const range = getRangePx();
        const noz = nozzlePos();
        const hostRect = flamesHost.getBoundingClientRect();
        const sceneRect = scene.getBoundingClientRect();
        // Convert flame %-coords to scene-px to compare against finger + range.
        let bestScore = Infinity;
        for (let i = 0; i < flames.length; i++) {
          if (flames[i].out) continue;
          // Flame center in scene px:
          const flameX = (hostRect.left - sceneRect.left) + (flames[i].x / 100) * hostRect.width;
          const flameY = (hostRect.top - sceneRect.top) + (flames[i].y / 100) * hostRect.height;
          // Range check: distance from firefighter nozzle to flame.
          const rdx = flameX - noz.x;
          const rdy = flameY - noz.y;
          const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
          if (rDist > range) continue;
          // Aim check: how close finger is pointing to this flame.
          const adx = flameX - sprayPx;
          const ady = flameY - sprayPy;
          const aDist = Math.sqrt(adx * adx + ady * ady);
          if (aDist > 60) continue;   // 60px aim tolerance
          if (aDist < bestScore) { bestScore = aDist; hitIdx = i; }
        }
      }

      // Update each flame
      let allOut = true;
      for (let i = 0; i < flames.length; i++) {
        const f = flames[i];
        if (f.out) continue;
        if (i === hitIdx) {
          f.fuel -= 60 * dt;
        } else if (spray.regrow > 0) {
          f.fuel = Math.min(f.maxFuel, f.fuel + spray.regrow * f.maxFuel * dt);
        }
        if (f.fuel <= 0) {
          f.fuel = 0;
          f.out = true;
          f.el.classList.add('ff-flame-out');
          sfx.toggle();
          f.el.innerHTML = '<div class="ff-smoke">💨</div>';
          setTimeout(() => { if (f.el) f.el.style.display = 'none'; }, 600);
        } else {
          const intensity = f.fuel / f.maxFuel;
          f.el.querySelector('svg').style.transform =
            `scale(${0.5 + intensity * 0.5})`;
          allOut = false;
        }
      }

      if (allOut) {
        won = true;
        win();
      } else {
        raf = requestAnimationFrame(step);
      }
    }
    raf = requestAnimationFrame(step);
  }

  // ====== WIN ======
  function win() {
    sfx.win();
    // Stars burst
    const rect = stage.getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('div');
      s.className = 'star-burst';
      s.textContent = '⭐';
      const angle = (Math.PI * 2 * i) / 14;
      const dist = 120 + Math.random() * 80;
      s.style.setProperty('--end', `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`);
      s.style.left = (rect.width / 2) + 'px';
      s.style.top = (rect.height / 2) + 'px';
      stage.appendChild(s);
      setTimeout(() => s.remove(), 1400);
    }
    if (opts.onComplete) opts.onComplete(levelIndex);
    setTimeout(showWinOverlay, 1200);
  }

  function showWinOverlay() {
    if (cancelled) return;
    const overlay = document.createElement('div');
    overlay.className = 'win-overlay';
    const hasNext = levelIndex + 1 < FIRE_LEVELS.length;
    overlay.innerHTML = `
      <div class="win-title">FIXED!</div>
      <div class="win-buttons">
        <button class="big-btn secondary" data-act="levels">Pick Job</button>
        ${hasNext ? '<button class="big-btn" data-act="next">Next ›</button>' : ''}
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      const act = e.target.dataset.act;
      cleanup();
      if (act === 'next' && opts.onNext) opts.onNext(levelIndex + 1);
      else if (act === 'levels' && opts.onBack) opts.onBack();
    });
    container.appendChild(overlay);
  }
}
