// Tiny synthesized SFX using the Web Audio API. No audio files.
// AudioContext is created lazily on first user gesture (iOS requirement).

let ctx = null;
let muted = false;

function ensureCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Attach a one-time listener that primes audio on any first tap/click.
if (typeof window !== 'undefined') {
  const prime = () => { ensureCtx(); };
  window.addEventListener('pointerdown', prime, { once: true });
  window.addEventListener('touchstart',  prime, { once: true });
  window.addEventListener('click',       prime, { once: true });
}

function tone({ freq = 440, dur = 0.1, type = 'sine', vol = 0.18, attack = 0.005, slideTo = null, delay = 0 }) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const now = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo !== null) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(vol, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function noiseBurst({ dur = 0.1, vol = 0.1, delay = 0 }) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(gain).connect(c.destination);
  src.start(c.currentTime + delay);
}

export const sfx = {
  rotate() { tone({ freq: 520, slideTo: 700, dur: 0.09, type: 'square', vol: 0.08 }); },
  click()  { tone({ freq: 800, dur: 0.04, type: 'square', vol: 0.08 }); },
  flow()   { tone({ freq: 260, slideTo: 520, dur: 0.25, type: 'sine', vol: 0.14 }); },
  snap()   { tone({ freq: 600, slideTo: 1100, dur: 0.08, type: 'triangle', vol: 0.16 }); },
  pickup() { tone({ freq: 700, dur: 0.05, type: 'sine', vol: 0.1 }); },
  drop()   { tone({ freq: 200, dur: 0.06, type: 'sine', vol: 0.08 }); },
  reject() { tone({ freq: 180, dur: 0.18, type: 'sawtooth', vol: 0.08 }); },
  toggle() { tone({ freq: 900, dur: 0.04, type: 'square', vol: 0.08 }); noiseBurst({ dur: 0.04, vol: 0.04 }); },
  spark()  { noiseBurst({ dur: 0.08, vol: 0.08 }); tone({ freq: 1200, dur: 0.05, type: 'square', vol: 0.06 }); },
  buzz()   { tone({ freq: 440, dur: 0.18, type: 'sawtooth', vol: 0.1 }); },
  win() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => tone({ freq: f, dur: 0.2, type: 'triangle', vol: 0.18, delay: i * 0.1 }));
    notes.forEach((f, i) => tone({ freq: f * 1.5, dur: 0.15, type: 'sine', vol: 0.08, delay: i * 0.1 + 0.04 }));
  },
};

export function setMuted(m) { muted = !!m; }
export function isMuted() { return muted; }
