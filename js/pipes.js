// Pipes mechanic: render grid, handle rotation taps, compute water flow.

import { PIPES_LEVELS } from './levels.js';
import { sfx } from './sound.js';

const DELTA = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
const OPPOSITE = { N: 'S', E: 'W', S: 'N', W: 'E' };
const DIR_TO_ROT = { E: 0, S: 1, W: 2, N: 3 }; // canonical pipe drawn pointing E

function openingsForTile(tile) {
  if (!tile) return [];
  if (tile.k === 'src' || tile.k === 'sink') return [tile.dir];
  if (tile.k === 'wall') return [];
  if (tile.k === 'pipe') {
    if (tile.s === 'I') return (tile.r % 2 === 0) ? ['W', 'E'] : ['N', 'S'];
    if (tile.s === 'L') {
      const map = [['N','E'], ['E','S'], ['S','W'], ['W','N']];
      return map[tile.r];
    }
  }
  return [];
}

function computeFlow(level, tiles) {
  const { rows, cols } = level;
  const srcIdx = tiles.findIndex(t => t && t.k === 'src');
  const filled = new Set();
  let winning = false;
  if (srcIdx < 0) return { filled, winning };
  filled.add(srcIdx);
  const queue = [srcIdx];
  while (queue.length) {
    const idx = queue.shift();
    const tile = tiles[idx];
    if (tile.k === 'sink') continue; // sinks don't propagate
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    for (const dir of openingsForTile(tile)) {
      const [dr, dc] = DELTA[dir];
      const nr = row + dr, nc = col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const nIdx = nr * cols + nc;
      if (filled.has(nIdx)) continue;
      const nTile = tiles[nIdx];
      if (!nTile || nTile.k === 'wall') continue;
      const nOpenings = openingsForTile(nTile);
      if (!nOpenings.includes(OPPOSITE[dir])) continue;
      filled.add(nIdx);
      if (nTile.k === 'sink') winning = true;
      else queue.push(nIdx);
    }
  }
  return { filled, winning };
}

// ---- SVG path snippets (canonical shapes pointing E or N+E) ----
// All shapes drawn into 100x100 viewBox; rotation applied via CSS transform.
function svgPaths(tile) {
  if (!tile) return '';
  const C = 'M 50 50';
  if (tile.k === 'src' || tile.k === 'sink') {
    // Canonical: opening points E. Stub from center to right edge.
    return `M 50 50 L 100 50`;
  }
  if (tile.k === 'pipe') {
    if (tile.s === 'I') {
      // canonical W+E horizontal
      return `M 0 50 L 100 50`;
    }
    if (tile.s === 'L') {
      // canonical N+E (top + right)
      return `M 50 0 Q 50 50 100 50`;
    }
  }
  return '';
}

function rotationFor(tile) {
  if (!tile) return 0;
  if (tile.k === 'src' || tile.k === 'sink') return DIR_TO_ROT[tile.dir] * 90;
  if (tile.k === 'pipe') return tile.r * 90;
  return 0;
}

// SVG used for both pipes and src/sink (consistent look).
// Source/sink have an extra icon overlay drawn on top.
function pipeSvgHtml(tile) {
  const d = svgPaths(tile);
  if (!d) return '';
  return `
    <svg class="pipe-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <path d="${d}" class="pipe-casing-outer" stroke-width="34" stroke-linecap="square" fill="none" />
      <path d="${d}" class="pipe-casing-inner" stroke-width="22" stroke-linecap="square" fill="none" />
      <path d="${d}" class="pipe-water"        stroke-width="14" stroke-linecap="square" fill="none" />
    </svg>
  `;
}

function srcIconHtml() {
  // Faucet/tap icon — drawn at the centre, with the spout pointing left (away from the pipe stub on right).
  return `
    <svg class="src-icon" viewBox="0 0 100 100" style="position:absolute;inset:0;pointer-events:none;">
      <!-- spout coming from left -->
      <rect x="6" y="38" width="36" height="20" rx="3" fill="#ffd966" stroke="#7a5a1f" stroke-width="3"/>
      <!-- handle -->
      <rect x="20" y="14" width="14" height="22" rx="2" fill="#ffd966" stroke="#7a5a1f" stroke-width="3"/>
      <rect x="14" y="10" width="26" height="8" rx="2" fill="#ffd966" stroke="#7a5a1f" stroke-width="3"/>
      <!-- drip -->
      <circle cx="14" cy="68" r="4" fill="#3aa3ff" stroke="#1f5d99" stroke-width="2"/>
    </svg>
  `;
}

function sinkIconHtml() {
  // Tank icon centered, with pipe stub on the dir-side.
  return `
    <svg class="sink-icon" viewBox="0 0 100 100" style="position:absolute;inset:0;pointer-events:none;">
      <rect x="14" y="22" width="56" height="56" rx="6" fill="#2a3a50" stroke="#000" stroke-width="3"/>
      <rect x="14" y="22" width="56" height="14" fill="#1a2230" stroke="#000" stroke-width="3"/>
      <rect x="18" y="38" width="48" height="38" fill="#0f1620"/>
      <circle cx="42" cy="58" r="4" fill="#3aa3ff"/>
    </svg>
  `;
}

// ----- Rendering -----
export function renderPipesLevel(container, levelIndex, opts) {
  const level = PIPES_LEVELS[levelIndex];
  if (!level) {
    container.innerHTML = '<p style="padding:20px;">Level not found.</p>';
    return;
  }
  // Deep-copy tiles so rotations don't mutate the level template.
  const tiles = level.tiles.map(t => t ? { ...t } : null);

  container.innerHTML = `
    <div class="topbar">
      <button class="back-btn" data-act="back">‹</button>
      <h1>${level.name}</h1>
      <div class="spacer"></div>
    </div>
    <div class="pipes-game">
      <div class="pipes-stage">
        <div class="pipes-grid" id="grid"
             style="grid-template-columns: repeat(${level.cols}, 1fr); grid-template-rows: repeat(${level.rows}, 1fr);"></div>
        <div class="tank"><div class="tank-water" id="tank-water"></div></div>
      </div>
      <p style="color:rgba(255,255,255,0.5);font-size:14px;">Tap pipes to rotate. Get the water to the tank!</p>
    </div>
  `;

  const grid = container.querySelector('#grid');
  const tank = container.querySelector('#tank-water');

  // Build tile elements
  const tileEls = tiles.map((tile, idx) => {
    const el = document.createElement('div');
    el.className = 'tile';
    el.dataset.idx = idx;
    if (!tile) {
      el.classList.add('empty');
    } else if (tile.k === 'wall') {
      el.classList.add('blocked');
    } else if (tile.k === 'src') {
      el.classList.add('source-tile');
      el.classList.add('fixed');
      el.innerHTML = pipeSvgHtml(tile) + srcIconHtml();
      el.querySelector('.pipe-svg').style.transform = `rotate(${rotationFor(tile)}deg)`;
    } else if (tile.k === 'sink') {
      el.classList.add('sink-tile');
      el.classList.add('fixed');
      el.innerHTML = pipeSvgHtml(tile) + sinkIconHtml();
      el.querySelector('.pipe-svg').style.transform = `rotate(${rotationFor(tile)}deg)`;
    } else if (tile.k === 'pipe') {
      el.classList.add('rotatable');
      if (tile.fixed) el.classList.add('fixed');
      el.innerHTML = pipeSvgHtml(tile);
      el.dataset.visRot = rotationFor(tile);
      el.querySelector('.pipe-svg').style.transform = `rotate(${rotationFor(tile)}deg)`;
    }
    grid.appendChild(el);
    return el;
  });

  let won = false;

  function updateFlow() {
    const { filled, winning } = computeFlow(level, tiles);
    tileEls.forEach((el, idx) => {
      el.classList.toggle('filled', filled.has(idx));
    });
    if (winning && !won) {
      won = true;
      onWin();
    }
  }

  function onTileTap(e) {
    if (won) return;
    const target = e.target.closest('.tile.rotatable');
    if (!target) return;
    if (target.classList.contains('fixed')) return;
    const idx = parseInt(target.dataset.idx, 10);
    const tile = tiles[idx];
    if (!tile || tile.k !== 'pipe') return;
    tile.r = (tile.r + 1) % 4;
    const vis = (parseInt(target.dataset.visRot, 10) || 0) + 90;
    target.dataset.visRot = vis;
    target.querySelector('.pipe-svg').style.transform = `rotate(${vis}deg)`;
    sfx.rotate();
    // Recompute flow after the rotation animation kicks in
    const prevFilled = container.querySelectorAll('.tile.filled').length;
    requestAnimationFrame(() => {
      updateFlow();
      const newFilled = container.querySelectorAll('.tile.filled').length;
      if (newFilled > prevFilled && !won) sfx.flow();
    });
  }

  grid.addEventListener('click', onTileTap);

  function onWin() {
    sfx.win();
    // Animate the tank filling
    tank.style.height = '100%';
    // Burst stars
    const stage = container.querySelector('.pipes-stage');
    const rect = stage.getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('div');
      s.className = 'star-burst';
      s.textContent = '⭐';
      const angle = (Math.PI * 2 * i) / 14;
      const dist = 120 + Math.random() * 80;
      s.style.setProperty('--end', `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`);
      s.style.left = (rect.width / 2) + 'px';
      s.style.top = (rect.height / 2) + 'px';
      s.style.position = 'absolute';
      stage.appendChild(s);
      setTimeout(() => s.remove(), 1400);
    }
    // Mark progress
    opts.onComplete(levelIndex);
    // Show overlay after a beat
    setTimeout(() => showWinOverlay(), 1200);
  }

  function showWinOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'win-overlay';
    const hasNext = levelIndex + 1 < PIPES_LEVELS.length;
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

  // Back button
  container.querySelector('[data-act="back"]').addEventListener('click', opts.onBack);

  // Initial flow check (in case the level happens to start solved — for testing)
  updateFlow();
}
