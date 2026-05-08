type SoundName =
  | "click"
  | "chip"
  | "win"
  | "bigWin"
  | "lose"
  | "spin"
  | "dice"
  | "diceRoll"
  | "cardDeal"
  | "coinFlip"
  | "pour"
  | "jukebox"
  | "lock"
  | "unlock"
  | "collectible";

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const C =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    return ctx;
  } catch {
    return null;
  }
}

export function setSoundMuted(m: boolean) {
  muted = m;
  if (m) stopMusic();
}

/* -------------------------------------------------------------------------- */
/* SFX helpers                                                                 */
/* -------------------------------------------------------------------------- */

function tone(
  freq: number,
  duration: number,
  opts: { type?: OscillatorType; gain?: number; sweepTo?: number; delay?: number } = {},
) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = opts.type ?? "sine";
  const start = c.currentTime + (opts.delay ?? 0);
  o.frequency.setValueAtTime(freq, start);
  if (opts.sweepTo != null) {
    o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.sweepTo), start + duration);
  }
  const gain = opts.gain ?? 0.08;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  o.connect(g).connect(c.destination);
  o.start(start);
  o.stop(start + duration + 0.02);
}

function noiseBurst(duration: number, gain = 0.05) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const buffer = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(g).connect(c.destination);
  src.start();
}

export function playSound(name: SoundName) {
  switch (name) {
    case "click":
      tone(900, 0.04, { type: "square", gain: 0.04 });
      break;
    case "chip":
      tone(1200, 0.05, { type: "triangle", gain: 0.05 });
      tone(1600, 0.04, { type: "triangle", gain: 0.04, delay: 0.04 });
      break;
    case "win":
      tone(523, 0.12, { type: "triangle", gain: 0.06 });
      tone(659, 0.12, { type: "triangle", gain: 0.06, delay: 0.08 });
      tone(784, 0.18, { type: "triangle", gain: 0.07, delay: 0.16 });
      break;
    case "bigWin":
      tone(523, 0.16, { type: "sawtooth", gain: 0.06 });
      tone(659, 0.16, { type: "sawtooth", gain: 0.06, delay: 0.08 });
      tone(784, 0.16, { type: "sawtooth", gain: 0.06, delay: 0.16 });
      tone(1046, 0.32, { type: "sawtooth", gain: 0.08, delay: 0.24 });
      tone(1318, 0.4, { type: "triangle", gain: 0.06, delay: 0.36 });
      break;
    case "lose":
      tone(220, 0.18, { type: "sawtooth", gain: 0.05, sweepTo: 90 });
      break;
    case "spin":
      noiseBurst(0.5, 0.02);
      tone(180, 0.5, { type: "triangle", gain: 0.03, sweepTo: 80 });
      break;
    case "dice":
    case "diceRoll":
      for (let i = 0; i < 5; i++) {
        tone(180 + Math.random() * 80, 0.04, { type: "square", gain: 0.04, delay: i * 0.06 });
      }
      break;
    case "cardDeal":
      noiseBurst(0.08, 0.04);
      break;
    case "coinFlip":
      tone(900, 0.05, { type: "triangle", gain: 0.05 });
      tone(700, 0.05, { type: "triangle", gain: 0.05, delay: 0.05 });
      tone(900, 0.05, { type: "triangle", gain: 0.05, delay: 0.1 });
      break;
    case "pour":
      noiseBurst(0.4, 0.03);
      tone(420, 0.4, { type: "sine", gain: 0.02, sweepTo: 280 });
      break;
    case "jukebox": {
      const notes = [523, 587, 659, 784, 880];
      const n = notes[Math.floor(Math.random() * notes.length)];
      tone(n, 0.4, { type: "triangle", gain: 0.05 });
      tone(n * 1.5, 0.3, { type: "sine", gain: 0.03, delay: 0.05 });
      break;
    }
    case "lock":
      tone(600, 0.05, { type: "square", gain: 0.05 });
      tone(300, 0.1, { type: "square", gain: 0.06, delay: 0.05 });
      break;
    case "unlock":
      tone(440, 0.08, { type: "triangle", gain: 0.05 });
      tone(660, 0.08, { type: "triangle", gain: 0.05, delay: 0.06 });
      tone(880, 0.16, { type: "triangle", gain: 0.06, delay: 0.12 });
      break;
    case "collectible":
      tone(523, 0.1, { type: "triangle", gain: 0.05 });
      tone(659, 0.1, { type: "triangle", gain: 0.05, delay: 0.09 });
      tone(784, 0.1, { type: "triangle", gain: 0.05, delay: 0.18 });
      tone(1046, 0.3, { type: "sine", gain: 0.06, delay: 0.27 });
      noiseBurst(0.1, 0.02);
      break;
  }
}

/* -------------------------------------------------------------------------- */
/* Ambient music system                                                        */
/* -------------------------------------------------------------------------- */

interface MusicNote {
  /** Time offset from bar start, seconds. */
  t: number;
  /** Frequency, Hz. */
  f: number;
  /** Duration, seconds. */
  d: number;
  /** Peak volume. */
  v: number;
  /** Waveform type. */
  w: OscillatorType;
}

interface MusicTrackDef {
  /** Total bar length in seconds. */
  bar: number;
  notes: MusicNote[];
}

/** Five distinct ambient tracks. */
const MUSIC_TRACKS: Record<string, MusicTrackDef> = {
  smoke: {
    bar: 6.4,
    notes: [
      // bass — Db major, slow
      { t: 0,   f: 138.6, d: 0.9, v: 0.065, w: "sine" },
      { t: 1.6, f: 155.6, d: 0.7, v: 0.055, w: "sine" },
      { t: 3.2, f: 138.6, d: 0.9, v: 0.065, w: "sine" },
      { t: 4.8, f: 164.8, d: 0.7, v: 0.055, w: "sine" },
      // melody
      { t: 0.3, f: 554.4, d: 0.7, v: 0.028, w: "triangle" },
      { t: 1.3, f: 622.3, d: 0.6, v: 0.022, w: "triangle" },
      { t: 2.2, f: 740,   d: 0.9, v: 0.030, w: "triangle" },
      { t: 3.5, f: 554.4, d: 0.5, v: 0.022, w: "triangle" },
      { t: 4.3, f: 622.3, d: 0.7, v: 0.026, w: "triangle" },
      { t: 5.3, f: 740,   d: 0.8, v: 0.028, w: "triangle" },
    ],
  },
  neon: {
    bar: 4.0,
    notes: [
      // driving bass — Am
      { t: 0,   f: 110,   d: 0.32, v: 0.065, w: "sawtooth" },
      { t: 0.5, f: 110,   d: 0.22, v: 0.048, w: "sawtooth" },
      { t: 1.0, f: 130.8, d: 0.32, v: 0.065, w: "sawtooth" },
      { t: 1.5, f: 110,   d: 0.22, v: 0.048, w: "sawtooth" },
      { t: 2.0, f: 110,   d: 0.32, v: 0.065, w: "sawtooth" },
      { t: 2.5, f: 98,    d: 0.22, v: 0.048, w: "sawtooth" },
      { t: 3.0, f: 130.8, d: 0.32, v: 0.065, w: "sawtooth" },
      { t: 3.5, f: 110,   d: 0.22, v: 0.048, w: "sawtooth" },
      // synth lead
      { t: 0.1, f: 440,   d: 0.28, v: 0.030, w: "square" },
      { t: 0.6, f: 523,   d: 0.22, v: 0.026, w: "square" },
      { t: 1.1, f: 659,   d: 0.28, v: 0.030, w: "square" },
      { t: 1.6, f: 523,   d: 0.22, v: 0.026, w: "square" },
      { t: 2.1, f: 440,   d: 0.28, v: 0.030, w: "square" },
      { t: 2.6, f: 392,   d: 0.22, v: 0.026, w: "square" },
      { t: 3.1, f: 440,   d: 0.48, v: 0.030, w: "square" },
    ],
  },
  midnight: {
    bar: 5.6,
    notes: [
      // swing bass — F major
      { t: 0,   f: 174.6, d: 0.55, v: 0.060, w: "sine" },
      { t: 0.8, f: 196,   d: 0.35, v: 0.040, w: "sine" },
      { t: 1.4, f: 220,   d: 0.55, v: 0.060, w: "sine" },
      { t: 2.2, f: 196,   d: 0.35, v: 0.040, w: "sine" },
      { t: 2.8, f: 174.6, d: 0.55, v: 0.060, w: "sine" },
      { t: 3.6, f: 164.8, d: 0.35, v: 0.040, w: "sine" },
      { t: 4.2, f: 174.6, d: 0.55, v: 0.060, w: "sine" },
      { t: 5.0, f: 196,   d: 0.35, v: 0.040, w: "sine" },
      // melody
      { t: 0.1, f: 698.5, d: 0.60, v: 0.026, w: "triangle" },
      { t: 0.9, f: 784,   d: 0.50, v: 0.022, w: "triangle" },
      { t: 1.5, f: 880,   d: 0.70, v: 0.030, w: "triangle" },
      { t: 2.3, f: 784,   d: 0.50, v: 0.026, w: "triangle" },
      { t: 2.9, f: 698.5, d: 0.60, v: 0.026, w: "triangle" },
      { t: 3.7, f: 622.3, d: 0.50, v: 0.022, w: "triangle" },
      { t: 4.3, f: 698.5, d: 0.90, v: 0.026, w: "triangle" },
    ],
  },
  lounge: {
    bar: 5.0,
    notes: [
      // bossa nova feel — Eb major
      { t: 0,    f: 155.6, d: 0.60, v: 0.060, w: "sine" },
      { t: 1.25, f: 185,   d: 0.50, v: 0.050, w: "sine" },
      { t: 2.5,  f: 155.6, d: 0.60, v: 0.060, w: "sine" },
      { t: 3.75, f: 174.6, d: 0.50, v: 0.050, w: "sine" },
      // gentle melody
      { t: 0.2, f: 622.3, d: 0.70, v: 0.026, w: "triangle" },
      { t: 1.1, f: 698.5, d: 0.55, v: 0.022, w: "triangle" },
      { t: 1.8, f: 784,   d: 0.65, v: 0.026, w: "triangle" },
      { t: 2.6, f: 740,   d: 0.55, v: 0.024, w: "triangle" },
      { t: 3.3, f: 622.3, d: 0.80, v: 0.026, w: "triangle" },
      { t: 4.3, f: 554.4, d: 0.55, v: 0.020, w: "triangle" },
    ],
  },
  casino: {
    bar: 3.2,
    notes: [
      // upbeat Vegas-y — G major
      { t: 0,   f: 196,   d: 0.28, v: 0.065, w: "triangle" },
      { t: 0.4, f: 246.9, d: 0.28, v: 0.058, w: "triangle" },
      { t: 0.8, f: 261.6, d: 0.38, v: 0.065, w: "triangle" },
      { t: 1.6, f: 246.9, d: 0.28, v: 0.058, w: "triangle" },
      { t: 2.0, f: 220,   d: 0.28, v: 0.058, w: "triangle" },
      { t: 2.4, f: 196,   d: 0.38, v: 0.065, w: "triangle" },
      // melody
      { t: 0.1, f: 784,   d: 0.24, v: 0.030, w: "sine" },
      { t: 0.5, f: 880,   d: 0.22, v: 0.026, w: "sine" },
      { t: 0.9, f: 1046.5,d: 0.34, v: 0.030, w: "sine" },
      { t: 1.5, f: 880,   d: 0.22, v: 0.026, w: "sine" },
      { t: 2.1, f: 784,   d: 0.22, v: 0.024, w: "sine" },
      { t: 2.6, f: 659.3, d: 0.34, v: 0.026, w: "sine" },
    ],
  },
  blues: {
    bar: 7.2,
    notes: [
      // walking E-minor blues bass
      { t: 0,   f: 82.4,  d: 0.45, v: 0.070, w: "sawtooth" },
      { t: 0.6, f: 82.4,  d: 0.35, v: 0.060, w: "sawtooth" },
      { t: 1.2, f: 82.4,  d: 0.45, v: 0.070, w: "sawtooth" },
      { t: 1.8, f: 82.4,  d: 0.35, v: 0.058, w: "sawtooth" },
      { t: 2.4, f: 110,   d: 0.45, v: 0.070, w: "sawtooth" },
      { t: 3.0, f: 110,   d: 0.35, v: 0.058, w: "sawtooth" },
      { t: 3.6, f: 82.4,  d: 0.45, v: 0.070, w: "sawtooth" },
      { t: 4.2, f: 82.4,  d: 0.35, v: 0.058, w: "sawtooth" },
      { t: 4.8, f: 98.0,  d: 0.45, v: 0.070, w: "sawtooth" },
      { t: 5.4, f: 110,   d: 0.35, v: 0.058, w: "sawtooth" },
      { t: 6.0, f: 82.4,  d: 0.55, v: 0.070, w: "sawtooth" },
      // bluesy lead (E pentatonic minor)
      { t: 0.2, f: 330,   d: 0.60, v: 0.026, w: "triangle" },
      { t: 0.9, f: 370,   d: 0.50, v: 0.022, w: "triangle" },
      { t: 1.5, f: 392,   d: 0.65, v: 0.028, w: "triangle" },
      { t: 2.5, f: 440,   d: 0.60, v: 0.026, w: "triangle" },
      { t: 3.2, f: 392,   d: 0.50, v: 0.025, w: "triangle" },
      { t: 3.8, f: 330,   d: 0.80, v: 0.028, w: "triangle" },
      { t: 4.9, f: 370,   d: 0.45, v: 0.022, w: "triangle" },
      { t: 5.6, f: 330,   d: 0.70, v: 0.025, w: "triangle" },
    ],
  },
  jazz: {
    bar: 3.6,
    notes: [
      // walking C-major bass (swing feel)
      { t: 0,    f: 130.8, d: 0.38, v: 0.065, w: "triangle" },
      { t: 0.45, f: 146.8, d: 0.38, v: 0.055, w: "triangle" },
      { t: 0.9,  f: 164.8, d: 0.38, v: 0.065, w: "triangle" },
      { t: 1.35, f: 174.6, d: 0.38, v: 0.055, w: "triangle" },
      { t: 1.8,  f: 196,   d: 0.38, v: 0.065, w: "triangle" },
      { t: 2.25, f: 164.8, d: 0.38, v: 0.055, w: "triangle" },
      { t: 2.7,  f: 146.8, d: 0.38, v: 0.060, w: "triangle" },
      { t: 3.15, f: 130.8, d: 0.38, v: 0.065, w: "triangle" },
      // jazzy melody (syncopated)
      { t: 0.1,  f: 523.3, d: 0.35, v: 0.028, w: "sine" },
      { t: 0.55, f: 587.3, d: 0.25, v: 0.024, w: "sine" },
      { t: 0.95, f: 659.3, d: 0.38, v: 0.030, w: "sine" },
      { t: 1.5,  f: 523.3, d: 0.35, v: 0.028, w: "sine" },
      { t: 1.95, f: 587.3, d: 0.25, v: 0.024, w: "sine" },
      { t: 2.35, f: 523.3, d: 0.52, v: 0.030, w: "sine" },
      { t: 3.05, f: 440,   d: 0.40, v: 0.026, w: "sine" },
    ],
  },
  chill: {
    bar: 8.0,
    notes: [
      // slow Am pad chords
      { t: 0,   f: 110,   d: 2.2, v: 0.038, w: "sine" },
      { t: 2.0, f: 130.8, d: 2.2, v: 0.032, w: "sine" },
      { t: 4.0, f: 110,   d: 2.2, v: 0.038, w: "sine" },
      { t: 6.0, f: 98.0,  d: 2.2, v: 0.032, w: "sine" },
      // gentle arpeggio (A minor pentatonic)
      { t: 0.5, f: 440,   d: 0.90, v: 0.018, w: "triangle" },
      { t: 1.5, f: 523.3, d: 0.90, v: 0.016, w: "triangle" },
      { t: 2.5, f: 659.3, d: 0.90, v: 0.018, w: "triangle" },
      { t: 3.5, f: 523.3, d: 0.90, v: 0.016, w: "triangle" },
      { t: 4.5, f: 440,   d: 0.90, v: 0.018, w: "triangle" },
      { t: 5.5, f: 392,   d: 0.90, v: 0.016, w: "triangle" },
      { t: 6.5, f: 440,   d: 1.00, v: 0.018, w: "triangle" },
      // ambient lead
      { t: 1.0, f: 880,   d: 1.6,  v: 0.013, w: "sine" },
      { t: 3.2, f: 784,   d: 1.6,  v: 0.012, w: "sine" },
      { t: 5.2, f: 698.5, d: 2.0,  v: 0.013, w: "sine" },
    ],
  },
  retro: {
    bar: 4.0,
    notes: [
      // pulsing D-major synth bass
      { t: 0,   f: 73.4,  d: 0.22, v: 0.080, w: "sawtooth" },
      { t: 0.5, f: 73.4,  d: 0.22, v: 0.070, w: "sawtooth" },
      { t: 1.0, f: 82.4,  d: 0.22, v: 0.080, w: "sawtooth" },
      { t: 1.5, f: 73.4,  d: 0.22, v: 0.070, w: "sawtooth" },
      { t: 2.0, f: 65.4,  d: 0.22, v: 0.080, w: "sawtooth" },
      { t: 2.5, f: 65.4,  d: 0.22, v: 0.070, w: "sawtooth" },
      { t: 3.0, f: 73.4,  d: 0.22, v: 0.080, w: "sawtooth" },
      { t: 3.5, f: 73.4,  d: 0.22, v: 0.070, w: "sawtooth" },
      // arpeggiated square-wave lead
      { t: 0.1, f: 587.3, d: 0.17, v: 0.032, w: "square" },
      { t: 0.3, f: 740,   d: 0.17, v: 0.028, w: "square" },
      { t: 0.5, f: 880,   d: 0.17, v: 0.032, w: "square" },
      { t: 0.7, f: 740,   d: 0.17, v: 0.028, w: "square" },
      { t: 1.1, f: 659.3, d: 0.17, v: 0.030, w: "square" },
      { t: 1.3, f: 740,   d: 0.17, v: 0.028, w: "square" },
      { t: 1.5, f: 880,   d: 0.22, v: 0.032, w: "square" },
      { t: 2.1, f: 523.3, d: 0.17, v: 0.030, w: "square" },
      { t: 2.3, f: 659.3, d: 0.17, v: 0.028, w: "square" },
      { t: 2.5, f: 784,   d: 0.17, v: 0.032, w: "square" },
      { t: 2.7, f: 659.3, d: 0.17, v: 0.028, w: "square" },
      { t: 3.1, f: 587.3, d: 0.17, v: 0.030, w: "square" },
      { t: 3.3, f: 740,   d: 0.17, v: 0.028, w: "square" },
      { t: 3.6, f: 587.3, d: 0.35, v: 0.030, w: "square" },
    ],
  },
  deephouse: {
    bar: 4.8,
    notes: [
      // four-on-the-floor kick sub — G
      { t: 0,    f: 98,   d: 0.35, v: 0.085, w: "sine" },
      { t: 1.2,  f: 98,   d: 0.35, v: 0.085, w: "sine" },
      { t: 2.4,  f: 98,   d: 0.35, v: 0.085, w: "sine" },
      { t: 3.6,  f: 98,   d: 0.35, v: 0.085, w: "sine" },
      // bass synth (Gm)
      { t: 0,    f: 98,   d: 0.55, v: 0.045, w: "sawtooth" },
      { t: 0.6,  f: 110,  d: 0.30, v: 0.038, w: "sawtooth" },
      { t: 1.2,  f: 98,   d: 0.55, v: 0.045, w: "sawtooth" },
      { t: 2.4,  f: 87.3, d: 0.55, v: 0.045, w: "sawtooth" },
      { t: 3.0,  f: 98,   d: 0.30, v: 0.038, w: "sawtooth" },
      { t: 3.6,  f: 110,  d: 0.55, v: 0.045, w: "sawtooth" },
      // atmospheric chord stabs
      { t: 0.8,  f: 392,  d: 0.40, v: 0.018, w: "triangle" },
      { t: 0.8,  f: 494,  d: 0.40, v: 0.015, w: "triangle" },
      { t: 2.0,  f: 370,  d: 0.40, v: 0.018, w: "triangle" },
      { t: 2.0,  f: 466,  d: 0.40, v: 0.015, w: "triangle" },
      { t: 4.0,  f: 392,  d: 0.40, v: 0.018, w: "triangle" },
      // silky lead
      { t: 1.0,  f: 784,  d: 0.8,  v: 0.016, w: "sine" },
      { t: 2.2,  f: 740,  d: 0.8,  v: 0.015, w: "sine" },
      { t: 3.4,  f: 784,  d: 1.2,  v: 0.016, w: "sine" },
    ],
  },
};

let musicGain: GainNode | null = null;
let musicTimerId: number | null = null;
let currentMusicId: string | null = null;
let musicBarStartTime = 0;

function scheduleMusicBar(trackId: string, barStart: number) {
  const c = getCtx();
  if (!c || !musicGain) return;
  const track = MUSIC_TRACKS[trackId];
  if (!track) return;

  for (const { t, f, d, v, w } of track.notes) {
    const noteStart = barStart + t;
    if (noteStart < c.currentTime - 0.01) continue;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = w;
    osc.frequency.setValueAtTime(f, noteStart);
    g.gain.setValueAtTime(0.0001, noteStart);
    g.gain.linearRampToValueAtTime(v, noteStart + 0.025);
    g.gain.setValueAtTime(v, Math.max(noteStart + 0.025, noteStart + d - 0.06));
    g.gain.linearRampToValueAtTime(0.0001, noteStart + d);
    osc.connect(g).connect(musicGain);
    osc.start(noteStart);
    osc.stop(noteStart + d + 0.01);
  }
}

export function startMusic(trackId: string) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});

  stopMusic();
  if (muted) return;

  const track = MUSIC_TRACKS[trackId];
  if (!track) return;

  currentMusicId = trackId;

  musicGain = c.createGain();
  musicGain.gain.setValueAtTime(0.001, c.currentTime);
  musicGain.gain.linearRampToValueAtTime(1.0, c.currentTime + 1.2);
  musicGain.connect(c.destination);

  musicBarStartTime = c.currentTime + 0.1;
  scheduleMusicBar(trackId, musicBarStartTime);

  const loop = () => {
    if (currentMusicId !== trackId) return;
    musicBarStartTime += track.bar;
    scheduleMusicBar(trackId, musicBarStartTime);
    musicTimerId = window.setTimeout(loop, (track.bar - 0.4) * 1000);
  };
  musicTimerId = window.setTimeout(loop, (track.bar - 0.4) * 1000);
}

export function stopMusic() {
  if (musicTimerId !== null) {
    window.clearTimeout(musicTimerId);
    musicTimerId = null;
  }
  currentMusicId = null;
  if (musicGain) {
    const c = getCtx();
    if (c) {
      try {
        musicGain.gain.setValueAtTime(musicGain.gain.value, c.currentTime);
        musicGain.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.5);
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      musicGain?.disconnect();
      musicGain = null;
    }, 600);
  }
}

export function getMusicTrackIds(): string[] {
  return Object.keys(MUSIC_TRACKS);
}
