// Circuits mechanic: tap broken wires to fix, flip switches to close, bulbs light when the loop is complete.
//
// Each level is a series circuit. The bulb(s) light up only when every broken
// wire is fixed and every switch is closed.

import { sfx } from './sound.js';

// Level data. All coords in the SVG viewBox (W x H).
// - wires: { id, path, broken?: bool }   broken wires start broken and need a tap
// - switches: { id, x, y, closed?: bool, orient }   orient: 'h' or 'v' for lever rotation
// - bulbs: { id, x, y }                  rendered with glow when circuit is whole
// - battery: { x, y }                    visual anchor
export const CIRCUIT_LEVELS = [
  // ----- L1: one broken wire -----
  {
    name: 'First Spark',
    width: 340, height: 240,
    battery: { x: 40, y: 180 },
    bulbs: [{ id: 'b1', x: 280, y: 40 }],
    switches: [],
    wires: [
      { id: 'w1', path: 'M 70 195 L 70 60 L 260 60', broken: true,  breakPt: { x: 165, y: 60 } },
      { id: 'w2', path: 'M 300 60 L 320 60 L 320 215 L 30 215 L 30 215' },
      { id: 'w3', path: 'M 30 215 L 30 205' },
    ],
  },

  // ----- L2: one switch -----
  {
    name: 'Flip the Switch',
    width: 340, height: 240,
    battery: { x: 40, y: 180 },
    bulbs: [{ id: 'b1', x: 280, y: 40 }],
    switches: [{ id: 's1', x: 170, y: 60, orient: 'h' }],
    wires: [
      { id: 'w1', path: 'M 70 195 L 70 60 L 152 60' },
      { id: 'w2', path: 'M 188 60 L 260 60' },
      { id: 'w3', path: 'M 300 60 L 320 60 L 320 215 L 30 215 L 30 205' },
    ],
  },

  // ----- L3: two broken wires -----
  {
    name: 'Double Break',
    width: 340, height: 240,
    battery: { x: 40, y: 180 },
    bulbs: [{ id: 'b1', x: 280, y: 40 }],
    switches: [],
    wires: [
      { id: 'w1', path: 'M 70 195 L 70 60 L 260 60', broken: true,  breakPt: { x: 70, y: 130 } },
      { id: 'w2', path: 'M 300 60 L 320 60 L 320 215 L 30 215 L 30 205', broken: true, breakPt: { x: 320, y: 135 } },
    ],
  },

  // ----- L4: 2 bulbs in series + 1 switch -----
  {
    name: 'Two Lights',
    width: 360, height: 260,
    battery: { x: 40, y: 200 },
    bulbs: [
      { id: 'b1', x: 160, y: 50 },
      { id: 'b2', x: 290, y: 50 },
    ],
    switches: [{ id: 's1', x: 230, y: 235, orient: 'h' }],
    wires: [
      { id: 'w1', path: 'M 70 215 L 70 70 L 140 70' },
      { id: 'w2', path: 'M 180 70 L 270 70' },
      { id: 'w3', path: 'M 310 70 L 330 70 L 330 235 L 248 235' },
      { id: 'w4', path: 'M 212 235 L 30 235 L 30 225' },
    ],
  },

  // ----- L5: 2 bulbs + 2 switches + 1 broken wire -----
  {
    name: 'Workshop Job',
    width: 360, height: 280,
    battery: { x: 40, y: 220 },
    bulbs: [
      { id: 'b1', x: 160, y: 50 },
      { id: 'b2', x: 290, y: 50 },
    ],
    switches: [
      { id: 's1', x: 70, y: 70, orient: 'v' },
      { id: 's2', x: 230, y: 255, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 235 L 70 88' },
      { id: 'w2', path: 'M 70 52 L 70 50 L 140 50' },
      { id: 'w3', path: 'M 180 50 L 270 50' },
      { id: 'w4', path: 'M 310 50 L 330 50 L 330 255 L 248 255', broken: true, breakPt: { x: 330, y: 155 } },
      { id: 'w5', path: 'M 212 255 L 30 255 L 30 245' },
    ],
  },

  // ----- L6: 1 bulb, 3 broken wires -----
  {
    name: 'Spark Hunt',
    width: 340, height: 240,
    battery: { x: 40, y: 180 },
    bulbs: [{ id: 'b1', x: 280, y: 60 }],
    switches: [],
    wires: [
      { id: 'w1', path: 'M 70 180 L 70 60 L 258 60', broken: true, breakPt: { x: 160, y: 60 } },
      { id: 'w2', path: 'M 302 60 L 320 60 L 320 215', broken: true, breakPt: { x: 320, y: 135 } },
      { id: 'w3', path: 'M 320 215 L 70 215 L 70 220', broken: true, breakPt: { x: 200, y: 215 } },
    ],
  },

  // ----- L7: 2 switches, 1 bulb -----
  {
    name: 'Two Levers',
    width: 340, height: 240,
    battery: { x: 40, y: 180 },
    bulbs: [{ id: 'b1', x: 300, y: 60 }],
    switches: [
      { id: 's1', x: 140, y: 60, orient: 'h' },
      { id: 's2', x: 230, y: 60, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 180 L 70 60 L 122 60' },
      { id: 'w2', path: 'M 158 60 L 212 60' },
      { id: 'w3', path: 'M 248 60 L 278 60' },
      { id: 'w4', path: 'M 322 60 L 322 215 L 70 215 L 70 220' },
    ],
  },

  // ----- L8: 1 bulb, 1 switch, 2 broken wires -----
  {
    name: 'Up and Down',
    width: 340, height: 260,
    battery: { x: 40, y: 200 },
    bulbs: [{ id: 'b1', x: 170, y: 50 }],
    switches: [{ id: 's1', x: 290, y: 130, orient: 'v' }],
    wires: [
      { id: 'w1', path: 'M 70 200 L 70 50 L 148 50', broken: true, breakPt: { x: 110, y: 50 } },
      { id: 'w2', path: 'M 192 50 L 290 50 L 290 112' },
      { id: 'w3', path: 'M 290 148 L 290 230 L 70 230 L 70 240', broken: true, breakPt: { x: 180, y: 230 } },
    ],
  },

  // ----- L9: 1 bulb, 3 broken wires -----
  {
    name: 'Three Sparks',
    width: 380, height: 240,
    battery: { x: 40, y: 180 },
    bulbs: [{ id: 'b1', x: 320, y: 60 }],
    switches: [],
    wires: [
      { id: 'w1', path: 'M 70 180 L 70 60 L 180 60', broken: true, breakPt: { x: 130, y: 60 } },
      { id: 'w2', path: 'M 180 60 L 298 60', broken: true, breakPt: { x: 240, y: 60 } },
      { id: 'w3', path: 'M 342 60 L 360 60 L 360 215 L 70 215 L 70 220', broken: true, breakPt: { x: 200, y: 215 } },
    ],
  },

  // ----- L10: 2 switches stacked, 1 bulb -----
  {
    name: 'Switch Tower',
    width: 320, height: 300,
    battery: { x: 40, y: 240 },
    bulbs: [{ id: 'b1', x: 220, y: 50 }],
    switches: [
      { id: 's1', x: 70, y: 180, orient: 'v' },
      { id: 's2', x: 70, y: 110, orient: 'v' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 240 L 70 198' },
      { id: 'w2', path: 'M 70 162 L 70 128' },
      { id: 'w3', path: 'M 70 92 L 70 50 L 198 50' },
      { id: 'w4', path: 'M 242 50 L 280 50 L 280 275 L 70 275 L 70 280' },
    ],
  },

  // ----- L11: 2 bulbs in series, 1 switch, 1 broken -----
  {
    name: 'Two in a Row',
    width: 380, height: 240,
    battery: { x: 40, y: 180 },
    bulbs: [
      { id: 'b1', x: 140, y: 60 },
      { id: 'b2', x: 260, y: 60 },
    ],
    switches: [{ id: 's1', x: 200, y: 60, orient: 'h' }],
    wires: [
      { id: 'w1', path: 'M 70 180 L 70 60 L 118 60' },
      { id: 'w2', path: 'M 162 60 L 182 60' },
      { id: 'w3', path: 'M 218 60 L 238 60' },
      { id: 'w4', path: 'M 282 60 L 340 60 L 340 215 L 70 215 L 70 220', broken: true, breakPt: { x: 340, y: 135 } },
    ],
  },

  // ----- L12: 2 bulbs, 2 switches -----
  {
    name: 'Bridge',
    width: 380, height: 260,
    battery: { x: 40, y: 200 },
    bulbs: [
      { id: 'b1', x: 140, y: 70 },
      { id: 'b2', x: 280, y: 70 },
    ],
    switches: [
      { id: 's1', x: 200, y: 70, orient: 'h' },
      { id: 's2', x: 200, y: 235, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 200 L 70 70 L 118 70' },
      { id: 'w2', path: 'M 162 70 L 182 70' },
      { id: 'w3', path: 'M 218 70 L 258 70' },
      { id: 'w4', path: 'M 302 70 L 340 70 L 340 235 L 218 235' },
      { id: 'w5', path: 'M 182 235 L 70 235 L 70 240' },
    ],
  },

  // ----- L13: 2 bulbs, 1 switch, 2 broken -----
  {
    name: 'Crossroads',
    width: 400, height: 260,
    battery: { x: 40, y: 200 },
    bulbs: [
      { id: 'b1', x: 160, y: 60 },
      { id: 'b2', x: 320, y: 60 },
    ],
    switches: [{ id: 's1', x: 240, y: 60, orient: 'h' }],
    wires: [
      { id: 'w1', path: 'M 70 200 L 70 60 L 138 60', broken: true, breakPt: { x: 105, y: 60 } },
      { id: 'w2', path: 'M 182 60 L 222 60' },
      { id: 'w3', path: 'M 258 60 L 298 60' },
      { id: 'w4', path: 'M 342 60 L 370 60 L 370 235 L 70 235 L 70 240', broken: true, breakPt: { x: 370, y: 145 } },
    ],
  },

  // ----- L14: 2 bulbs, 1 switch, 2 broken -----
  {
    name: 'Power Plant',
    width: 380, height: 280,
    battery: { x: 40, y: 220 },
    bulbs: [
      { id: 'b1', x: 170, y: 60 },
      { id: 'b2', x: 300, y: 170 },
    ],
    switches: [{ id: 's1', x: 300, y: 100, orient: 'v' }],
    wires: [
      { id: 'w1', path: 'M 70 220 L 70 60 L 148 60', broken: true, breakPt: { x: 110, y: 60 } },
      { id: 'w2', path: 'M 192 60 L 300 60 L 300 82' },
      { id: 'w3', path: 'M 300 118 L 300 148' },
      { id: 'w4', path: 'M 300 200 L 300 255 L 70 255 L 70 260', broken: true, breakPt: { x: 180, y: 255 } },
    ],
  },

  // ----- L15: 2 bulbs, 2 switches, 1 broken -----
  {
    name: 'Long Run',
    width: 420, height: 260,
    battery: { x: 40, y: 200 },
    bulbs: [
      { id: 'b1', x: 160, y: 70 },
      { id: 'b2', x: 340, y: 70 },
    ],
    switches: [
      { id: 's1', x: 230, y: 70, orient: 'h' },
      { id: 's2', x: 230, y: 235, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 200 L 70 70 L 138 70' },
      { id: 'w2', path: 'M 182 70 L 212 70' },
      { id: 'w3', path: 'M 248 70 L 318 70' },
      { id: 'w4', path: 'M 362 70 L 390 70 L 390 235 L 248 235', broken: true, breakPt: { x: 390, y: 150 } },
      { id: 'w5', path: 'M 212 235 L 70 235 L 70 240' },
    ],
  },

  // ----- L16: 3 bulbs, 2 switches, 1 broken (L-shape) -----
  {
    name: 'Corner Lights',
    width: 380, height: 320,
    battery: { x: 40, y: 260 },
    bulbs: [
      { id: 'b1', x: 160, y: 50 },
      { id: 'b2', x: 300, y: 50 },
      { id: 'b3', x: 300, y: 180 },
    ],
    switches: [
      { id: 's1', x: 230, y: 50, orient: 'h' },
      { id: 's2', x: 160, y: 290, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 260 L 70 50 L 138 50' },
      { id: 'w2', path: 'M 182 50 L 212 50' },
      { id: 'w3', path: 'M 248 50 L 278 50' },
      { id: 'w4', path: 'M 322 50 L 340 50 L 340 180 L 322 180' },
      { id: 'w5', path: 'M 278 180 L 250 180 L 250 290 L 178 290', broken: true, breakPt: { x: 250, y: 240 } },
      { id: 'w6', path: 'M 142 290 L 70 290 L 70 300' },
    ],
  },

  // ----- L17: 3 bulbs, 2 switches, 1 broken (chained) -----
  {
    name: 'Triple Chain',
    width: 400, height: 300,
    battery: { x: 40, y: 240 },
    bulbs: [
      { id: 'b1', x: 140, y: 60 },
      { id: 'b2', x: 260, y: 60 },
      { id: 'b3', x: 140, y: 180 },
    ],
    switches: [
      { id: 's1', x: 200, y: 60, orient: 'h' },
      { id: 's2', x: 200, y: 180, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 240 L 70 60 L 118 60' },
      { id: 'w2', path: 'M 162 60 L 182 60' },
      { id: 'w3', path: 'M 218 60 L 238 60' },
      { id: 'w4', path: 'M 282 60 L 320 60 L 320 180 L 218 180', broken: true, breakPt: { x: 320, y: 120 } },
      { id: 'w5', path: 'M 182 180 L 162 180' },
      { id: 'w6', path: 'M 118 180 L 70 180 L 70 280' },
    ],
  },

  // ----- L18: 3 bulbs, 2 switches, 1 broken (in line) -----
  {
    name: 'Bulb Train',
    width: 420, height: 280,
    battery: { x: 40, y: 220 },
    bulbs: [
      { id: 'b1', x: 220, y: 60 },
      { id: 'b2', x: 90, y: 60 },
      { id: 'b3', x: 350, y: 60 },
    ],
    switches: [
      { id: 's1', x: 160, y: 60, orient: 'h' },
      { id: 's2', x: 280, y: 60, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 220 L 70 60 L 68 60' },
      { id: 'w2', path: 'M 112 60 L 142 60' },
      { id: 'w3', path: 'M 178 60 L 198 60' },
      { id: 'w4', path: 'M 242 60 L 262 60' },
      { id: 'w5', path: 'M 298 60 L 328 60' },
      { id: 'w6', path: 'M 372 60 L 400 60 L 400 255 L 70 255 L 70 260', broken: true, breakPt: { x: 400, y: 155 } },
    ],
  },

  // ----- L19: 2 bulbs, 3 switches (pinwheel) -----
  {
    name: 'Three Levers',
    width: 380, height: 300,
    battery: { x: 40, y: 220 },
    bulbs: [
      { id: 'b1', x: 190, y: 60 },
      { id: 'b2', x: 190, y: 180 },
    ],
    switches: [
      { id: 's1', x: 70, y: 130, orient: 'v' },
      { id: 's2', x: 290, y: 60, orient: 'h' },
      { id: 's3', x: 290, y: 180, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 220 L 70 148' },
      { id: 'w2', path: 'M 70 112 L 70 60 L 168 60' },
      { id: 'w3', path: 'M 212 60 L 272 60' },
      { id: 'w4', path: 'M 308 60 L 340 60 L 340 180 L 308 180' },
      { id: 'w5', path: 'M 272 180 L 212 180' },
      { id: 'w6', path: 'M 168 180 L 70 180 L 70 260' },
    ],
  },

  // ----- L20: 2 bulbs, 2 switches, 2 broken -----
  {
    name: 'Switch Snake',
    width: 400, height: 280,
    battery: { x: 40, y: 220 },
    bulbs: [
      { id: 'b1', x: 200, y: 60 },
      { id: 'b2', x: 200, y: 180 },
    ],
    switches: [
      { id: 's1', x: 110, y: 60, orient: 'h' },
      { id: 's2', x: 300, y: 180, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 220 L 70 60 L 92 60' },
      { id: 'w2', path: 'M 128 60 L 178 60', broken: true, breakPt: { x: 150, y: 60 } },
      { id: 'w3', path: 'M 222 60 L 360 60 L 360 180 L 318 180', broken: true, breakPt: { x: 360, y: 120 } },
      { id: 'w4', path: 'M 282 180 L 222 180' },
      { id: 'w5', path: 'M 178 180 L 70 180 L 70 260' },
    ],
  },

  // ----- L21: 3 bulbs, 2 switches, 2 broken -----
  {
    name: 'Three Bulb Chain',
    width: 420, height: 280,
    battery: { x: 40, y: 220 },
    bulbs: [
      { id: 'b1', x: 140, y: 60 },
      { id: 'b2', x: 260, y: 60 },
      { id: 'b3', x: 380, y: 60 },
    ],
    switches: [
      { id: 's1', x: 200, y: 60, orient: 'h' },
      { id: 's2', x: 320, y: 60, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 220 L 70 60 L 118 60' },
      { id: 'w2', path: 'M 162 60 L 182 60', broken: true, breakPt: { x: 172, y: 60 } },
      { id: 'w3', path: 'M 218 60 L 238 60' },
      { id: 'w4', path: 'M 282 60 L 302 60' },
      { id: 'w5', path: 'M 338 60 L 358 60' },
      { id: 'w6', path: 'M 402 60 L 410 60 L 410 255 L 70 255 L 70 260', broken: true, breakPt: { x: 410, y: 150 } },
    ],
  },

  // ----- L22: 3 bulbs, 3 switches, 1 broken -----
  {
    name: 'Power Grid',
    width: 400, height: 320,
    battery: { x: 40, y: 260 },
    bulbs: [
      { id: 'b1', x: 140, y: 60 },
      { id: 'b2', x: 300, y: 60 },
      { id: 'b3', x: 220, y: 180 },
    ],
    switches: [
      { id: 's1', x: 220, y: 60, orient: 'h' },
      { id: 's2', x: 220, y: 120, orient: 'v' },
      { id: 's3', x: 140, y: 290, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 260 L 70 60 L 118 60' },
      { id: 'w2', path: 'M 162 60 L 202 60' },
      { id: 'w3', path: 'M 238 60 L 278 60' },
      { id: 'w4', path: 'M 322 60 L 360 60 L 360 102 L 220 102' },
      { id: 'w5', path: 'M 220 138 L 220 158' },
      { id: 'w6', path: 'M 220 210 L 220 290 L 158 290', broken: true, breakPt: { x: 220, y: 250 } },
      { id: 'w7', path: 'M 122 290 L 70 290 L 70 300' },
    ],
  },

  // ----- L23: 3 bulbs, 3 switches, 1 broken -----
  {
    name: 'Workshop Floor',
    width: 420, height: 320,
    battery: { x: 40, y: 260 },
    bulbs: [
      { id: 'b1', x: 130, y: 60 },
      { id: 'b2', x: 290, y: 60 },
      { id: 'b3', x: 210, y: 180 },
    ],
    switches: [
      { id: 's1', x: 200, y: 60, orient: 'h' },
      { id: 's2', x: 350, y: 120, orient: 'v' },
      { id: 's3', x: 210, y: 290, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 260 L 70 60 L 108 60' },
      { id: 'w2', path: 'M 152 60 L 182 60' },
      { id: 'w3', path: 'M 218 60 L 268 60' },
      { id: 'w4', path: 'M 312 60 L 350 60 L 350 102' },
      { id: 'w5', path: 'M 350 138 L 350 180 L 232 180', broken: true, breakPt: { x: 290, y: 180 } },
      { id: 'w6', path: 'M 188 180 L 188 290 L 192 290' },
      { id: 'w7', path: 'M 228 290 L 70 290 L 70 300' },
    ],
  },

  // ----- L24: 4 bulbs, 2 switches, 1 broken -----
  {
    name: 'Holiday Lights',
    width: 420, height: 300,
    battery: { x: 40, y: 240 },
    bulbs: [
      { id: 'b1', x: 110, y: 60 },
      { id: 'b2', x: 210, y: 60 },
      { id: 'b3', x: 310, y: 60 },
      { id: 'b4', x: 210, y: 200 },
    ],
    switches: [
      { id: 's1', x: 160, y: 60, orient: 'h' },
      { id: 's2', x: 260, y: 60, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 240 L 70 60 L 88 60' },
      { id: 'w2', path: 'M 132 60 L 142 60' },
      { id: 'w3', path: 'M 178 60 L 188 60' },
      { id: 'w4', path: 'M 232 60 L 242 60' },
      { id: 'w5', path: 'M 278 60 L 288 60' },
      { id: 'w6', path: 'M 332 60 L 380 60 L 380 200 L 232 200', broken: true, breakPt: { x: 380, y: 130 } },
      { id: 'w7', path: 'M 188 200 L 70 200 L 70 280' },
    ],
  },

  // ----- L25: 4 bulbs, 3 switches, 2 broken -----
  {
    name: 'Master Workshop',
    width: 420, height: 320,
    battery: { x: 40, y: 260 },
    bulbs: [
      { id: 'b1', x: 130, y: 60 },
      { id: 'b2', x: 290, y: 60 },
      { id: 'b3', x: 130, y: 180 },
      { id: 'b4', x: 290, y: 180 },
    ],
    switches: [
      { id: 's1', x: 210, y: 60, orient: 'h' },
      { id: 's2', x: 370, y: 120, orient: 'v' },
      { id: 's3', x: 210, y: 180, orient: 'h' },
    ],
    wires: [
      { id: 'w1', path: 'M 70 260 L 70 60 L 108 60' },
      { id: 'w2', path: 'M 152 60 L 192 60', broken: true, breakPt: { x: 170, y: 60 } },
      { id: 'w3', path: 'M 228 60 L 268 60' },
      { id: 'w4', path: 'M 312 60 L 370 60 L 370 102' },
      { id: 'w5', path: 'M 370 138 L 370 180 L 312 180' },
      { id: 'w6', path: 'M 268 180 L 228 180' },
      { id: 'w7', path: 'M 192 180 L 152 180', broken: true, breakPt: { x: 170, y: 180 } },
      { id: 'w8', path: 'M 108 180 L 70 180 L 70 300' },
    ],
  },
];

// ---------- Rendering ----------
function batterySvg(b) {
  // Yellow battery rect with + and - terminals
  return `
    <g class="cmp-battery">
      <rect x="${b.x}" y="${b.y}" width="60" height="40" rx="3" fill="#ffd966" stroke="#7a5a1f" stroke-width="3"/>
      <rect x="${b.x + 60}" y="${b.y + 12}" width="6" height="16" fill="#7a5a1f"/>
      <text x="${b.x + 12}" y="${b.y + 27}" font-family="sans-serif" font-size="20" font-weight="900" fill="#7a5a1f">+</text>
      <text x="${b.x + 38}" y="${b.y + 27}" font-family="sans-serif" font-size="20" font-weight="900" fill="#7a5a1f">−</text>
    </g>
  `;
}

function bulbSvg(b) {
  // Centered at (b.x, b.y); approx 60x70
  return `
    <g class="cmp-bulb" data-bulb="${b.id}">
      <circle cx="${b.x}" cy="${b.y}" r="22" fill="#fff58a" stroke="#7a5a1f" stroke-width="3" class="bulb-glass"/>
      <path d="M ${b.x - 8} ${b.y + 4} Q ${b.x} ${b.y - 8} ${b.x + 8} ${b.y + 4}" fill="none" stroke="#c89a30" stroke-width="2" class="bulb-filament"/>
      <rect x="${b.x - 9}" y="${b.y + 20}" width="18" height="8" fill="#888" stroke="#333" stroke-width="2"/>
      <rect x="${b.x - 7}" y="${b.y + 27}" width="14" height="4" fill="#555"/>
    </g>
  `;
}

function switchSvg(s, closed) {
  // A switch is a base bar with two terminals and a lever.
  // 'h' = horizontal base; lever open angles up-right.
  // 'v' = vertical base; lever open angles up-left.
  const c = closed ? 'closed' : 'open';
  if (s.orient === 'v') {
    return `
      <g class="cmp-switch ${c}" data-id="${s.id}" data-kind="switch">
        <circle cx="${s.x}" cy="${s.y - 18}" r="6" fill="#3a4756" stroke="#1a2230" stroke-width="2"/>
        <circle cx="${s.x}" cy="${s.y + 18}" r="6" fill="#3a4756" stroke="#1a2230" stroke-width="2"/>
        <line class="switch-lever" x1="${s.x}" y1="${s.y - 18}"
              x2="${closed ? s.x : s.x - 18}" y2="${closed ? s.y + 18 : s.y + 6}"
              stroke="#bbc4d0" stroke-width="6" stroke-linecap="round"/>
        <circle cx="${s.x}" cy="${s.y}" r="22" fill="transparent" data-id="${s.id}" data-kind="switch" />
      </g>
    `;
  }
  return `
    <g class="cmp-switch ${c}" data-id="${s.id}" data-kind="switch">
      <circle cx="${s.x - 18}" cy="${s.y}" r="6" fill="#3a4756" stroke="#1a2230" stroke-width="2"/>
      <circle cx="${s.x + 18}" cy="${s.y}" r="6" fill="#3a4756" stroke="#1a2230" stroke-width="2"/>
      <line class="switch-lever" x1="${s.x - 18}" y1="${s.y}"
            x2="${closed ? s.x + 18 : s.x + 6}" y2="${closed ? s.y : s.y - 18}"
            stroke="#bbc4d0" stroke-width="6" stroke-linecap="round"/>
      <circle cx="${s.x}" cy="${s.y}" r="22" fill="transparent" data-id="${s.id}" data-kind="switch" />
    </g>
  `;
}

function wireSvg(w, broken) {
  // Decorative wire (always ok)
  if (!broken) {
    return `
      <path d="${w.path}" fill="none" stroke="#8a2a2a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${w.path}" fill="none" stroke="#d33" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" class="wire-core" data-wire="${w.id}"/>
    `;
  }
  // Broken wire: draw the path but mark the break point.
  // Spark icon at breakPt; clickable. The two ends of the wire are visually frayed.
  const { x, y } = w.breakPt;
  return `
    <g class="wire-broken" data-id="${w.id}" data-kind="wire">
      <path d="${w.path}" fill="none" stroke="#8a2a2a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
      <path d="${w.path}" fill="none" stroke="#d33" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.55" class="wire-core" data-wire="${w.id}"/>
      <!-- jagged spark icon -->
      <circle cx="${x}" cy="${y}" r="20" fill="#fff58a" stroke="#c89a30" stroke-width="3"/>
      <path d="M ${x-6} ${y-10} L ${x+2} ${y-2} L ${x-4} ${y+0} L ${x+6} ${y+10} L ${x-2} ${y+2} L ${x+4} ${y}  Z"
            fill="#ffce3a" stroke="#7a5a1f" stroke-width="2"/>
      <circle cx="${x}" cy="${y}" r="22" fill="transparent" data-id="${w.id}" data-kind="wire" />
    </g>
  `;
}

export function renderCircuitsLevel(container, levelIndex, opts) {
  const level = CIRCUIT_LEVELS[levelIndex];
  if (!level) return;

  // State: for each broken wire, fixed:bool; for each switch, closed:bool.
  const state = {
    wires: {},    // id -> 'fixed' | 'broken'
    switches: {}, // id -> 'open' | 'closed'
  };
  for (const w of level.wires) {
    if (w.broken) state.wires[w.id] = 'broken';
  }
  for (const s of level.switches) {
    state.switches[s.id] = s.closed ? 'closed' : 'open';
  }

  container.innerHTML = `
    <div class="topbar">
      <button class="back-btn" data-act="back">‹</button>
      <h1>${level.name}</h1>
      <div class="spacer"></div>
    </div>
    <div class="circuit-stage">
      <p class="hint">Fix the sparks. Flip the switches. Light the bulb!</p>
      <div class="circuit-wrap">
        <svg class="circuit-board"
             viewBox="0 0 ${level.width} ${level.height}"
             preserveAspectRatio="xMidYMid meet"
             style="max-width:100%;height:auto;"></svg>
      </div>
    </div>
  `;

  const svg = container.querySelector('.circuit-board');

  function renderSvg() {
    let html = '';
    // Wires first (under components)
    for (const w of level.wires) {
      const broken = state.wires[w.id] === 'broken';
      html += wireSvg(w, broken);
    }
    // Battery
    html += batterySvg(level.battery);
    // Switches
    for (const s of level.switches) {
      html += switchSvg(s, state.switches[s.id] === 'closed');
    }
    // Bulbs
    for (const b of level.bulbs) {
      html += bulbSvg(b);
    }
    svg.innerHTML = html;
    // Apply lit class to bulbs if all good
    const lit = isCircuitWhole();
    svg.classList.toggle('lit', lit);
  }

  function isCircuitWhole() {
    return Object.values(state.wires).every(v => v === 'fixed') &&
           Object.values(state.switches).every(v => v === 'closed');
  }

  function isWon() {
    // For this MVP, win when the circuit is whole (all bulbs lit).
    return isCircuitWhole();
  }

  let won = false;
  svg.addEventListener('click', (e) => {
    if (won) return;
    const t = e.target.closest('[data-id]');
    if (!t) return;
    const id = t.dataset.id;
    const kind = t.dataset.kind;
    if (kind === 'wire') {
      if (state.wires[id] === 'broken') {
        state.wires[id] = 'fixed';
        sfx.spark();
      }
    } else if (kind === 'switch') {
      state.switches[id] = state.switches[id] === 'closed' ? 'open' : 'closed';
      sfx.toggle();
    }
    renderSvg();
    if (isWon()) {
      won = true;
      onWin();
    }
  });

  function onWin() {
    sfx.win();
    // Star burst above the board
    const rect = svg.getBoundingClientRect();
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
    setTimeout(() => showWinOverlay(), 1200);
  }

  function showWinOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'win-overlay';
    const hasNext = levelIndex + 1 < CIRCUIT_LEVELS.length;
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
  renderSvg();
}
