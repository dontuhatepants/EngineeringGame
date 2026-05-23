// Level data for the Pipes mechanic.
//
// Grid is rows x cols, stored as flat array length rows*cols (row-major).
// Each cell is one of:
//   null                                       -> empty (no tile)
//   { k: 'src',  dir: 'N'|'E'|'S'|'W' }        -> source (water exits this side)
//   { k: 'sink', dir: 'N'|'E'|'S'|'W' }        -> tank (water enters this side)
//   { k: 'pipe', s: 'I'|'L', r: 0..3 }         -> rotatable pipe (initial rotation)
//   { k: 'wall' }                              -> blocker
//
// Pipe shapes (openings change with rotation r):
//   I (straight): r=0 W+E, r=1 N+S, r=2 W+E, r=3 N+S
//   L (elbow):    r=0 N+E, r=1 E+S, r=2 S+W, r=3 W+N

export const PIPES_LEVELS = [
  // ----- Level 1: rotate three straights -----
  // Path: src(E) -> I -> I -> I -> sink(W), all on middle row.
  // Solution: every I to r=0 (W+E).
  {
    name: 'First Fix',
    rows: 3, cols: 5,
    tiles: [
      null, null, null, null, null,
      {k:'src',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'sink',dir:'W'},
      null, null, null, null, null,
    ],
  },

  // ----- Level 2: introduce elbows -----
  // Path: src[3,0]N -> L[2,0]S+E -> I[2,1]W+E -> I[2,2]W+E -> L[2,3]W+N -> I[1,3]N+S -> sink[0,3]S
  {
    name: 'Round the Bend',
    rows: 4, cols: 5,
    tiles: [
      null, null, null, {k:'sink',dir:'S'}, null,
      null, null, null, {k:'pipe',s:'I',r:0}, null,
      {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null,
      {k:'src',dir:'N'}, null, null, null, null,
    ],
  },

  // ----- Level 3: detour around a wall -----
  // Path: src[3,0]N -> L[2,0]S+E -> L[2,1]W+N -> L[1,1]S+E -> I[1,2]W+E -> I[1,3]W+E -> L[1,4]W+N -> sink[0,4]S
  // Wall at [2,2] forces the up-and-over detour.
  {
    name: 'Detour',
    rows: 4, cols: 5,
    tiles: [
      null, null, null, null, {k:'sink',dir:'S'},
      null, {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0},
      {k:'pipe',s:'L',r:0}, {k:'pipe',s:'L',r:0}, {k:'wall'}, null, null,
      {k:'src',dir:'N'}, null, null, null, null,
    ],
  },

  // ----- Level 4: zig-zag with more pipes -----
  // src[4,0]N -> L[3,0]S+E -> I[3,1]W+E -> L[3,2]W+N -> I[2,2]N+S -> L[1,2]S+E -> I[1,3]W+E -> L[1,4]W+N -> sink[0,4]S
  {
    name: 'Zig Zag',
    rows: 5, cols: 5,
    tiles: [
      null, null, null, null, {k:'sink',dir:'S'},
      null, null, {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0},
      null, null, {k:'pipe',s:'I',r:0}, null, null,
      {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null, null,
      {k:'src',dir:'N'}, null, null, null, null,
    ],
  },

  // ----- Level 5: big finale (S-shape) -----
  // src[0,0]E -> I[0,1]W+E -> L[0,2]W+S -> I[1,2]N+S -> L[2,2]N+E -> I[2,3]W+E
  //   -> L[2,4]W+S -> I[3,4]N+S -> L[4,4]N+E -> sink[4,5]W
  {
    name: 'The Big Job',
    rows: 5, cols: 6,
    tiles: [
      {k:'src',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null, null, null,
      null, null, {k:'pipe',s:'I',r:0}, null, null, null,
      null, null, {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null,
      null, null, null, null, {k:'pipe',s:'I',r:0}, null,
      null, null, null, null, {k:'pipe',s:'L',r:0}, {k:'sink',dir:'W'},
    ],
  },

  // ----- Level 6: Long Tunnel -----
  // src[1,0]E -> I,I,I,I (all r=0 W+E) -> sink[1,5]W
  {
    name: 'Long Tunnel',
    rows: 3, cols: 6,
    tiles: [
      null, null, null, null, null, null,
      {k:'src',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'sink',dir:'W'},
      null, null, null, null, null, null,
    ],
  },

  // ----- Level 7: Up and Over -----
  // src[3,1]N -> L[2,1] E+S (r=1) -> I[2,2] W+E (r=0) -> L[2,3] W+N (r=3) -> I[1,3] N+S (r=1) -> sink[0,3]S
  {
    name: 'Up and Over',
    rows: 4, cols: 5,
    tiles: [
      null, null, null, {k:'sink',dir:'S'}, null,
      null, null, null, {k:'pipe',s:'I',r:0}, null,
      null, {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null,
      null, {k:'src',dir:'N'}, null, null, null,
    ],
  },

  // ----- Level 8: Side Step -----
  // src[1,0]E -> L[1,1] W+S r=2 -> L[2,1] N+E r=0 -> I[2,2] -> L[2,3] W+N r=3
  //   -> L[1,3] S+E r=1 -> I[1,4] -> sink[1,5]W
  {
    name: 'Side Step',
    rows: 3, cols: 6,
    tiles: [
      null, null, null, null, null, null,
      {k:'src',dir:'E'}, {k:'pipe',s:'L',r:0}, null, {k:'pipe',s:'L',r:3}, {k:'pipe',s:'I',r:1}, {k:'sink',dir:'W'},
      null, {k:'pipe',s:'L',r:2}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null, null,
    ],
  },

  // ----- Level 9: Stairway -----
  // src[4,0]N -> L[3,0] S+E r=1 -> I[3,1] -> L[3,2] W+N r=3 -> I[2,2] -> L[1,2] S+E r=1
  //   -> I[1,3] -> L[1,4] W+N r=3 -> sink[0,4]S
  {
    name: 'Stairway',
    rows: 5, cols: 5,
    tiles: [
      null, null, null, null, {k:'sink',dir:'S'},
      null, null, {k:'pipe',s:'L',r:3}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'L',r:1},
      null, null, {k:'pipe',s:'I',r:0}, null, null,
      {k:'pipe',s:'L',r:3}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null, null,
      {k:'src',dir:'N'}, null, null, null, null,
    ],
  },

  // ----- Level 10: Two Corners -----
  // src[0,0]E -> I,I -> L[0,3] S+W r=2 -> I,I -> L[3,3] N+E r=0 -> I -> sink[3,5]W
  {
    name: 'Two Corners',
    rows: 4, cols: 6,
    tiles: [
      {k:'src',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null, null,
      null, null, null, {k:'pipe',s:'I',r:0}, null, null,
      null, null, null, {k:'pipe',s:'I',r:0}, null, null,
      null, null, null, {k:'pipe',s:'L',r:2}, {k:'pipe',s:'I',r:1}, {k:'sink',dir:'W'},
    ],
  },

  // ----- Level 11: Wall Walk -----
  // src[3,0]N -> L[2,0] S+E r=1 -> I[2,1] -> I[2,2] -> L[2,3] W+N r=3 -> I[1,3] -> L[0,3] S+E r=1
  //   -> I[0,4] -> L[0,5] S+W r=2 -> sink[1,5]N. wall at [1,1].
  {
    name: 'Wall Walk',
    rows: 4, cols: 6,
    tiles: [
      null, null, null, {k:'pipe',s:'L',r:3}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0},
      null, {k:'wall'}, null, {k:'pipe',s:'I',r:0}, null, {k:'sink',dir:'N'},
      {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'L',r:2}, null, null,
      {k:'src',dir:'N'}, null, null, null, null, null,
    ],
  },

  // ----- Level 12: Big Detour -----
  // src[4,0]N -> L[3,0] S+E r=1 -> I[3,1] -> L[3,2] W+N r=3 -> I[2,2] -> L[1,2] S+E r=1
  //   -> I[1,3] -> L[1,4] W+S r=2 -> I[2,4] -> L[3,4] N+E r=0 -> sink[3,5]W. walls [2,3],[3,3].
  {
    name: 'Big Detour',
    rows: 5, cols: 6,
    tiles: [
      null, null, null, null, null, null,
      null, null, {k:'pipe',s:'L',r:3}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null,
      null, null, {k:'pipe',s:'I',r:0}, {k:'wall'}, {k:'pipe',s:'I',r:0}, null,
      {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'L',r:0}, {k:'wall'}, {k:'pipe',s:'L',r:2}, {k:'sink',dir:'W'},
      {k:'src',dir:'N'}, null, null, null, null, null,
    ],
  },

  // ----- Level 13: Spiral In -----
  // src[0,0]E -> I,I,I -> L[0,4] S+W r=2 -> I[1,4] -> I[2,4] -> L[3,4] W+N r=3
  //   -> I[3,3] -> I[3,2] -> L[3,1] W+N r=3 -> L[2,1] S+E r=1 -> sink[2,2]W
  {
    name: 'Spiral In',
    rows: 5, cols: 5,
    tiles: [
      {k:'src',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0},
      null, null, null, null, {k:'pipe',s:'I',r:0},
      null, {k:'pipe',s:'L',r:0}, {k:'sink',dir:'W'}, null, {k:'pipe',s:'I',r:0},
      null, {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0},
      null, null, null, null, null,
    ],
  },

  // ----- Level 14: Crooked Path -----
  // src[2,0]E -> L[2,1] W+N r=3 -> L[1,1] S+E r=1 -> L[1,2] W+N r=3 -> L[0,2] S+E r=1
  //   -> I[0,3] -> I[0,4] -> L[0,5] S+W r=2 -> I[1,5] -> sink[2,5]N. walls [2,2],[2,3],[1,3].
  {
    name: 'Crooked Path',
    rows: 3, cols: 6,
    tiles: [
      null, null, {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'L',r:0},
      null, {k:'pipe',s:'L',r:0}, {k:'pipe',s:'L',r:0}, {k:'wall'}, null, {k:'pipe',s:'I',r:0},
      {k:'src',dir:'E'}, {k:'pipe',s:'L',r:0}, {k:'wall'}, {k:'wall'}, null, {k:'sink',dir:'N'},
    ],
  },

  // ----- Level 15: Maze Bend -----
  // src[3,0]E -> I[3,1] -> I[3,2] -> L[3,3] W+N r=3 -> I[2,3] -> L[1,3] S+W r=2
  //   -> I[1,2] -> L[1,1] N+E r=0 -> L[0,1] S+E r=1 -> I[0,2] -> I[0,3] -> I[0,4] -> sink[0,5]W
  {
    name: 'Maze Bend',
    rows: 4, cols: 6,
    tiles: [
      null, {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'sink',dir:'W'},
      null, {k:'pipe',s:'L',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null, null,
      {k:'wall'}, {k:'wall'}, null, {k:'pipe',s:'I',r:0}, null, null,
      {k:'src',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, {k:'wall'}, {k:'wall'},
    ],
  },

  // ----- Level 16: The Long Way -----
  // src[4,0]N -> L[3,0] S+E r=1 -> I -> I -> L[3,3] W+N r=3 -> I[2,3] -> L[1,3] S+E r=1
  //   -> I[1,4] -> L[1,5] W+N r=3 -> sink[0,5]S. walls [2,0],[2,1],[2,2],[0,0],[0,1],[0,2].
  {
    name: 'The Long Way',
    rows: 5, cols: 6,
    tiles: [
      {k:'wall'}, {k:'wall'}, {k:'wall'}, null, null, {k:'sink',dir:'S'},
      null, null, null, {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0},
      {k:'wall'}, {k:'wall'}, {k:'wall'}, {k:'pipe',s:'I',r:0}, null, null,
      {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'L',r:0}, null, null,
      {k:'src',dir:'N'}, null, null, null, null, null,
    ],
  },

  // ----- Level 17: Around the Block -----
  // src[0,0]E -> I,I,I,I -> L[0,5] S+W r=2 -> I,I,I,I -> L[5,5] W+N r=3 -> I[5,4] -> ... no
  // Simpler: U-shape around center walls.
  // src[0,0]E -> I -> I -> L[0,3] S+W r=2 -> I -> I -> L[3,3] N+E r=0 -> I -> sink[3,5]W
  // walls block direct middle. Decoy pipe at [3,0] reachable via L[2,0].
  // path: [0,0]E -> [0,1]I -> [0,2]I -> [0,3]L S+W -> [1,3]I -> [2,3]I -> [3,3]L N+E -> [3,4]I -> [3,5]sink
  {
    name: 'Around the Block',
    rows: 6, cols: 6,
    tiles: [
      {k:'src',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null, null,
      null, {k:'wall'}, {k:'wall'}, {k:'pipe',s:'I',r:0}, null, null,
      null, {k:'wall'}, {k:'wall'}, {k:'pipe',s:'I',r:0}, null, null,
      null, null, null, {k:'pipe',s:'L',r:2}, {k:'pipe',s:'I',r:1}, {k:'sink',dir:'W'},
      null, null, null, null, null, null,
      null, null, null, null, null, null,
    ],
  },

  // ----- Level 18: Split Decision -----
  // 6x7 with branching. Main path + reachable decoy.
  // src[2,0]E -> I -> L[2,2] W+S r=2 -> I[3,2] -> L[4,2] N+E r=0 -> I -> I -> I -> L[4,6] W+N r=3
  //   -> I[3,6] -> I[2,6] -> sink[1,6]S
  {
    name: 'Split Decision',
    rows: 6, cols: 7,
    tiles: [
      null, null, null, null, null, null, null,
      null, null, null, null, null, null, {k:'sink',dir:'S'},
      {k:'src',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null, null, null, {k:'pipe',s:'I',r:0},
      null, null, {k:'pipe',s:'I',r:0}, null, null, null, {k:'pipe',s:'I',r:0},
      null, null, {k:'pipe',s:'L',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0},
      null, null, null, null, null, null, null,
    ],
  },

  // ----- Level 19: Pipe Tangle -----
  // 5x7 with walls.
  // src[4,0]N -> L[3,0] S+E r=1 -> I -> L[3,2] W+N r=3 -> I -> L[1,2] S+E r=1 -> I -> I -> I
  //   -> L[1,6] S+W r=2 -> I -> sink[3,6]N. walls [2,1],[2,3],[2,5].
  {
    name: 'Pipe Tangle',
    rows: 5, cols: 7,
    tiles: [
      null, null, null, null, null, null, null,
      null, null, {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'L',r:0},
      null, {k:'wall'}, {k:'pipe',s:'I',r:0}, {k:'wall'}, null, {k:'wall'}, {k:'pipe',s:'I',r:0},
      {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'L',r:0}, null, null, null, {k:'sink',dir:'N'},
      {k:'src',dir:'N'}, null, null, null, null, null, null,
    ],
  },

  // ----- Level 20: Big Bend -----
  // 6x7 large detour.
  // src[5,0]N -> L[4,0] S+E r=1 -> I -> I -> L[4,3] W+N r=3 -> I -> L[2,3] S+E r=1 -> I -> I
  //   -> L[2,6] S+W r=2 -> I -> sink[4,6]N. walls [3,1],[3,2],[3,4],[3,5].
  {
    name: 'Big Bend',
    rows: 6, cols: 7,
    tiles: [
      null, null, null, null, null, null, null,
      null, null, null, null, null, null, null,
      null, null, null, {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'L',r:0},
      null, {k:'wall'}, {k:'wall'}, {k:'pipe',s:'I',r:0}, {k:'wall'}, {k:'wall'}, {k:'pipe',s:'I',r:0},
      {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'L',r:0}, null, null, {k:'sink',dir:'N'},
      {k:'src',dir:'N'}, null, null, null, null, null, null,
    ],
  },

  // ----- Level 21: Master Plumber -----
  // 6x7 complex S.
  // src[0,0]E -> I -> I -> L[0,3] S+W r=2 -> I[1,3] -> L[2,3] N+E r=0 -> I -> I -> L[2,6] S+W r=2
  //   -> I[3,6] -> I[4,6] -> L[5,6] W+N r=3 -> I[5,5] -> I[5,4] -> sink[5,3]E
  {
    name: 'Master Plumber',
    rows: 6, cols: 7,
    tiles: [
      {k:'src',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null, null, null,
      null, null, null, {k:'pipe',s:'I',r:0}, null, null, null,
      null, null, null, {k:'pipe',s:'L',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0},
      null, null, null, null, null, null, {k:'pipe',s:'I',r:0},
      null, null, null, null, null, null, {k:'pipe',s:'I',r:0},
      null, null, null, {k:'sink',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0},
    ],
  },

  // ----- Level 22: Crazy Loops -----
  // 6x7. Two big U-turns with walls.
  // src[5,0]N -> L[4,0] S+E r=1 -> I -> I -> L[4,3] W+N r=3 -> I[3,3] -> I[2,3] -> L[1,3] S+E r=1
  //   -> I -> I -> L[1,6] S+W r=2 -> I -> I -> I -> sink[4,6]N. walls block middle.
  {
    name: 'Crazy Loops',
    rows: 6, cols: 7,
    tiles: [
      null, null, null, null, null, null, null,
      null, null, null, {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'L',r:0},
      null, {k:'wall'}, null, {k:'pipe',s:'I',r:0}, null, {k:'wall'}, {k:'pipe',s:'I',r:0},
      null, {k:'wall'}, null, {k:'pipe',s:'I',r:0}, null, {k:'wall'}, {k:'pipe',s:'I',r:0},
      {k:'pipe',s:'L',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'I',r:0}, {k:'pipe',s:'L',r:0}, null, null, {k:'sink',dir:'N'},
      {k:'src',dir:'N'}, null, null, null, null, null, null,
    ],
  },

  // ----- Level 23: The Gauntlet -----
  // 7x6 snake.
  // src[0,0]E -> I -> L[0,2] S+W r=2 -> I[1,2] -> L[2,2] N+E r=0 -> I -> L[2,4] S+W r=2
  //   -> I[3,4] -> L[4,4] N+E r=0 -> I -> ... no, let me make a clean snake to [6,5].
  // src[0,0]E -> I[0,1] -> I[0,2] -> L[0,3] S+W r=2 -> I[1,3] -> L[2,3] N+E r=0 -> I[2,4] -> L[2,5] S+W r=2
  //   -> I[3,5] -> L[4,5] N+E? need to keep going. Let me end at sink[6,5]N.
  // Actually: src[0,0]E -> I -> L[0,2] S+W -> I[1,2] -> I[2,2] -> L[3,2] N+E r=0 -> I -> L[3,4] S+W r=2
  //   -> I[4,4] -> I[5,4] -> L[6,4] N+E r=0 -> sink[6,5]W
  {
    name: 'The Gauntlet',
    rows: 7, cols: 6,
    tiles: [
      {k:'src',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null, null, null,
      null, null, {k:'pipe',s:'I',r:0}, null, null, null,
      null, null, {k:'pipe',s:'I',r:0}, null, null, null,
      null, null, {k:'pipe',s:'L',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null,
      null, null, null, null, {k:'pipe',s:'I',r:0}, null,
      null, null, null, null, {k:'pipe',s:'I',r:0}, null,
      null, null, null, null, {k:'pipe',s:'L',r:1}, {k:'sink',dir:'W'},
    ],
  },

  // ----- Level 24: Industrial Park -----
  // 7x6 snake top-left to bottom-right with walls.
  // src[0,0]E -> I[0,1] -> I[0,2] -> L[0,3] S+W r=2 -> I[1,3] -> L[2,3] N+E r=0 -> I[2,4]
  //   -> L[2,5] S+W r=2 -> I[3,5] -> I[4,5] -> I[5,5] -> L[6,5] W+N r=3 -> I[6,4] -> sink[6,3]E
  {
    name: 'Industrial Park',
    rows: 7, cols: 6,
    tiles: [
      {k:'src',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null, null,
      {k:'wall'}, null, {k:'wall'}, {k:'pipe',s:'I',r:0}, null, null,
      null, null, null, {k:'pipe',s:'L',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0},
      null, {k:'wall'}, null, null, {k:'wall'}, {k:'pipe',s:'I',r:0},
      null, null, null, null, null, {k:'pipe',s:'I',r:0},
      null, null, {k:'wall'}, null, null, {k:'pipe',s:'I',r:0},
      null, null, null, {k:'sink',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0},
    ],
  },

  // ----- Level 25: Grand Finale -----
  // 7x6 long S-snake.
  // src[0,0]E -> I[0,1] -> L[0,2] S+W r=2 -> I[1,2] -> I[2,2] -> L[3,2] N+E r=0 -> I[3,3]
  //   -> L[3,4] S+W r=2 -> I[4,4] -> I[5,4] -> L[6,4] W+N r=3 -> I[6,3] -> I[6,2] -> sink[6,1]E
  {
    name: 'Grand Finale',
    rows: 7, cols: 6,
    tiles: [
      {k:'src',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null, null, null,
      null, {k:'wall'}, {k:'pipe',s:'I',r:0}, null, {k:'wall'}, null,
      null, {k:'wall'}, {k:'pipe',s:'I',r:0}, null, null, null,
      null, null, {k:'pipe',s:'L',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null,
      null, {k:'wall'}, null, null, {k:'pipe',s:'I',r:0}, {k:'wall'},
      null, null, null, null, {k:'pipe',s:'I',r:0}, null,
      null, {k:'sink',dir:'E'}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'I',r:1}, {k:'pipe',s:'L',r:0}, null,
    ],
  },
];
