type SoundName =
  | "click"
  | "chip"
  | "win"
  | "bigWin"
  | "lose"
  | "spin"
  | "diceRoll"
  | "cardDeal"
  | "coinFlip"
  | "pour"
  | "jukebox"
  | "lock"
  | "unlock";

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const C =
      (window as unknown as { AudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    return ctx;
  } catch {
    return null;
  }
}

export function setSoundMuted(m: boolean) {
  muted = m;
}

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
    o.frequency.exponentialRampToValueAtTime(
      Math.max(20, opts.sweepTo),
      start + duration,
    );
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
    case "diceRoll":
      for (let i = 0; i < 5; i++) {
        tone(180 + Math.random() * 80, 0.04, {
          type: "square",
          gain: 0.04,
          delay: i * 0.06,
        });
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
  }
}
