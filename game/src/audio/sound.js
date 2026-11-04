// All sound is synthesised in code with WebAudio: no recordings, so nothing to license.
// Music: an Indian-classical flavour (raga Bhupali scale) with a tanpura drone, a bansuri-like
// flute and tabla strokes, generated live. Effects: a distinct sound for every tower and event.

const SCALE = [0, 2, 4, 7, 9]; // Sa Re Ga Pa Dha (Bhupali, a bright pentatonic raga)
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class Sound {
  constructor() {
    this.ctx = null; this.music = 0.6; this.sfx = 0.9; this.track = null; this.nextBeat = 0; this.step = 0;
    this.last = {}; this.timer = null; this.paused = false; this.seed = 7;
    // battle tension, 0..3: 0 getting ready, 1 fighting, 2 the fort is in danger or it is the
    // final wave, 3 boss. The music speeds up and adds layers as it rises.
    this.intensity = 0; this.heartbeat = false; this.ambience = null; this.ambT = 0;
  }

  // Browsers only allow audio after a tap, so this is called on the first pointer press.
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended' && !this.paused) this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.music * 0.5; this.musicBus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.sfx * 0.7; this.sfxBus.connect(this.master);
    // a short room reverb so the flute and drums sit in a space
    this.verb = c.createConvolver(); this.verb.buffer = this.impulse(1.8); const vg = c.createGain(); vg.gain.value = 0.28; this.verb.connect(vg); vg.connect(this.musicBus);
    this.noiseBuf = this.makeNoise();
    if (this.track) this.startScheduler();
  }

  setVolumes(music, sfx) {
    this.music = music; this.sfx = sfx;
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(music * 0.5, this.ctx.currentTime, 0.1);
    this.sfxBus.gain.setTargetAtTime(sfx * 0.7, this.ctx.currentTime, 0.05);
  }
  pause() { this.paused = true; if (this.ctx) this.ctx.suspend(); }
  resume() { this.paused = false; if (this.ctx) this.ctx.resume(); }

  impulse(sec) {
    const c = this.ctx, len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    return b;
  }
  makeNoise() {
    const c = this.ctx, b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // ---------------------------------------------------------------- building blocks
  tone(t, freq, dur, { type = 'sine', vol = 0.3, attack = 0.005, slideTo = null, bus = this.sfxBus, verb = false, detune = 0 } = {}) {
    const c = this.ctx, o = c.createOscillator(), gn = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + attack); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(bus); if (verb) gn.connect(this.verb);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  noise(t, dur, { vol = 0.3, freq = 1200, q = 1, type = 'bandpass', slideTo = null, bus = this.sfxBus, verb = false } = {}) {
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), gn = c.createGain();
    src.buffer = this.noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(gn); gn.connect(bus); if (verb) gn.connect(this.verb);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }

  // ---------------------------------------------------------------- effects
  play(name, opts = {}) {
    if (!this.ctx || this.paused || this.sfx <= 0) return;
    const now = this.ctx.currentTime, gap = { arrow: 0.06, hit: 0.05, magic: 0.08, coin: 0.05, kill: 0.04, cannon: 0.1, enemyShot: 0.1 }[name] ?? 0.02;
    if (this.last[name] && now - this.last[name] < gap) return;
    this.last[name] = now;
    const t = now + 0.005, j = 1 + (Math.random() - 0.5) * 0.08;
    switch (name) {
      case 'click': this.tone(t, 900, 0.06, { type: 'triangle', vol: 0.18 }); this.tone(t + 0.02, 1400, 0.05, { vol: 0.08 }); break;
      case 'back': this.tone(t, 700, 0.07, { type: 'triangle', vol: 0.16, slideTo: 450 }); break;
      case 'arrow': this.noise(t, 0.09, { vol: 0.16, freq: 3800 * j, q: 2, slideTo: 1600 }); this.tone(t, 300 * j, 0.05, { type: 'triangle', vol: 0.08 }); break;
      case 'falcon': this.tone(t, 2600 * j, 0.14, { vol: 0.08, slideTo: 1800 }); this.noise(t, 0.12, { vol: 0.1, freq: 2400, q: 1.2 }); break;
      case 'magic': this.tone(t, 520 * j, 0.25, { vol: 0.12, slideTo: 1240 }); this.tone(t + 0.03, 1560 * j, 0.2, { vol: 0.05, type: 'triangle' }); break;
      case 'cannon': this.tone(t, 110, 0.35, { vol: 0.35, slideTo: 40 }); this.noise(t, 0.3, { vol: 0.3, freq: 600, type: 'lowpass', slideTo: 120 }); break;
      case 'explosion': this.noise(t, 0.45, { vol: 0.35, freq: 900, type: 'lowpass', slideTo: 80 }); this.tone(t, 70, 0.4, { vol: 0.3, slideTo: 30 }); break;
      case 'hit': this.noise(t, 0.05, { vol: 0.1, freq: 1800 * j, q: 3 }); break;
      case 'sword': this.noise(t, 0.07, { vol: 0.12, freq: 5200 * j, q: 6 }); this.tone(t, 1900 * j, 0.08, { type: 'square', vol: 0.03 }); break;
      case 'kill': this.tone(t, 240 * j, 0.12, { type: 'triangle', vol: 0.1, slideTo: 120 }); break;
      case 'coin': this.tone(t, 1975, 0.09, { type: 'square', vol: 0.05 }); this.tone(t + 0.05, 2637, 0.16, { type: 'square', vol: 0.05 }); break;
      case 'build': [0, 0.08, 0.16].forEach((d, i) => this.noise(t + d, 0.07, { vol: 0.25, freq: 380 + i * 60, q: 4 })); this.tone(t + 0.2, 660, 0.18, { type: 'triangle', vol: 0.12 }); break;
      case 'upgrade': [0, 2, 4, 7].forEach((n, i) => this.tone(t + i * 0.07, midi(72 + SCALE[n % 5] + (n > 4 ? 12 : 0)), 0.2, { type: 'triangle', vol: 0.12 })); break;
      case 'sell': this.tone(t, 900, 0.1, { type: 'square', vol: 0.04 }); this.tone(t + 0.06, 600, 0.14, { type: 'square', vol: 0.04 }); break;
      case 'wave': this.drum(t, 'dhol'); this.drum(t + 0.22, 'dhol'); this.drum(t + 0.36, 'na'); break;
      case 'leak': this.tone(t, 140, 0.3, { type: 'sawtooth', vol: 0.12, slideTo: 70 }); break;
      case 'boss': this.tone(t, 90, 1.1, { type: 'sawtooth', vol: 0.22, slideTo: 55 }); this.tone(t, 95, 1.1, { type: 'sawtooth', vol: 0.18, slideTo: 50, detune: 30 }); this.noise(t, 1, { vol: 0.15, freq: 400, slideTo: 150 }); break;
      case 'volley': for (let i = 0; i < 5; i++) this.noise(t + i * 0.03, 0.1, { vol: 0.08, freq: 3000 + i * 300, q: 2 }); break;
      case 'holy': this.noise(t, 0.6, { vol: 0.25, freq: 500, slideTo: 3000, q: 0.7 }); this.tone(t, 392, 0.7, { vol: 0.1, verb: true, bus: this.sfxBus }); break;
      case 'sunStrike': this.tone(t, 260, 0.5, { type: 'sawtooth', vol: 0.12, slideTo: 780 }); this.noise(t + 0.1, 0.4, { vol: 0.3, freq: 700, type: 'lowpass', slideTo: 100 }); break;
      case 'freeze': [0, 4, 7, 12].forEach((n, i) => this.tone(t + i * 0.04, midi(84 + n), 0.5, { vol: 0.06 })); break;
      case 'powerup': [0, 2, 4].forEach((n, i) => this.tone(t + i * 0.06, midi(76 + SCALE[n]), 0.25, { type: 'triangle', vol: 0.1 })); break;
      case 'reward': [0, 1, 2, 3, 4].forEach((n, i) => this.tone(t + i * 0.06, midi(79 + SCALE[n]), 0.3, { type: 'triangle', vol: 0.1 })); this.tone(t + 0.3, midi(91), 0.5, { vol: 0.06 }); break;
      case 'win': this.fanfare(t, true); break;
      case 'lose': this.fanfare(t, false); break;
      case 'newEnemy': this.drum(t, 'dhol'); this.tone(t + 0.1, midi(62), 0.5, { type: 'sawtooth', vol: 0.06, slideTo: midi(65) }); break;
      case 'horn': this.tone(t, 147, 0.9, { type: 'sawtooth', vol: 0.12, attack: 0.08, slideTo: 165 }); this.tone(t, 220, 0.9, { type: 'sawtooth', vol: 0.06, attack: 0.1, slideTo: 247 }); break;
      case 'cry': for (let i = 0; i < 4; i++) this.noise(t + i * 0.05, 0.35, { vol: 0.06, freq: 700 + i * 180, q: 4, slideTo: 500 + i * 150 }); break;
      case 'shieldUp': [0, 4, 7].forEach((n, i) => this.tone(t + i * 0.05, midi(79 + n), 0.3, { vol: 0.05 })); break;
      case 'shieldBreak': this.noise(t, 0.25, { vol: 0.2, freq: 4200, q: 2, slideTo: 1800 }); this.tone(t, 1320, 0.2, { type: 'square', vol: 0.03, slideTo: 660 }); break;
      case 'jam': this.noise(t, 0.5, { vol: 0.18, freq: 900, q: 0.8, slideTo: 300 }); break;
      case 'portal': this.tone(t, 300, 0.5, { vol: 0.09, slideTo: 1200 }); this.noise(t, 0.4, { vol: 0.08, freq: 1500, q: 1, slideTo: 3500 }); break;
      case 'trumpet': this.tone(t, 330, 0.6, { type: 'sawtooth', vol: 0.12, attack: 0.04, slideTo: 520 }); this.tone(t + 0.05, 495, 0.55, { type: 'sawtooth', vol: 0.05, slideTo: 700 }); break;
      case 'bubble': this.tone(t, 380 * j, 0.1, { vol: 0.08, slideTo: 760 }); this.tone(t + 0.08, 520 * j, 0.08, { vol: 0.06, slideTo: 900 }); break;
      case 'finalWave': this.fanfare(t, false); this.drum(t, 'dhol'); this.drum(t + 0.2, 'dhol'); this.drum(t + 0.4, 'dhol'); break;
      case 'soldierDown': this.tone(t, 300, 0.2, { type: 'triangle', vol: 0.07, slideTo: 150 }); break;
      default: break;
    }
  }

  drum(t, kind, bus = this.sfxBus, vol = 1) {
    if (kind === 'dhol') { this.tone(t, 120, 0.35, { vol: 0.5 * vol, slideTo: 55, bus }); this.noise(t, 0.05, { vol: 0.15 * vol, freq: 900, bus }); }
    if (kind === 'dha') { this.tone(t, 98, 0.4, { vol: 0.28 * vol, slideTo: 70, bus }); this.tone(t, 392, 0.18, { vol: 0.12 * vol, bus, type: 'triangle' }); }
    if (kind === 'na') { this.tone(t, 523, 0.16, { vol: 0.14 * vol, bus, type: 'triangle' }); this.noise(t, 0.03, { vol: 0.08 * vol, freq: 3000, q: 3, bus }); }
    if (kind === 'tin') { this.tone(t, 659, 0.1, { vol: 0.09 * vol, bus }); }
    if (kind === 'ge') { this.tone(t, 80, 0.3, { vol: 0.25 * vol, slideTo: 110, bus }); }
  }

  fanfare(t, win) {
    const notes = win ? [0, 2, 4, 7, 9, 12, 16, 19] : [12, 9, 7, 4, 2, 0];
    notes.forEach((n, i) => this.tone(t + i * (win ? 0.09 : 0.16), midi(67 + n), win ? 0.4 : 0.5, { type: 'triangle', vol: 0.14, verb: true }));
    if (win) { this.drum(t, 'dhol'); this.drum(t + 0.36, 'dhol'); this.tone(t + 0.72, midi(79), 1.2, { vol: 0.1, type: 'triangle', verb: true }); }
  }

  // ---------------------------------------------------------------- music
  // track: 'menu' (slow alaap-like flute over drone) or 'battle' (tabla groove, livelier flute)
  playMusic(track) {
    if (this.track === track) return;
    this.track = track; this.step = 0;
    if (this.ctx) this.startScheduler();
  }
  stopMusic() { this.track = null; if (this.timer) { clearInterval(this.timer); this.timer = null; } }

  startScheduler() {
    if (this.timer) clearInterval(this.timer);
    this.nextBeat = this.ctx.currentTime + 0.1;
    this.note = 0;
    this.timer = setInterval(() => this.schedule(), 50);
  }
  rand() { this.seed = (this.seed * 16807) % 2147483647; return this.seed / 2147483647; }

  setIntensity(level, heartbeat = false) { this.intensity = level; this.heartbeat = heartbeat; }

  // background sound of the place: birdsong and wind in the spring hills
  setAmbience(kind) { this.ambience = kind; }
  ambienceTick(t) {
    if (!this.ambience || this.sfx <= 0) return;
    if (t < this.ambT) return;
    this.ambT = t + 1.5 + this.rand() * 3.5;
    const b = this.sfxBus;
    if (this.ambience === 'spring') {
      // a bird call: two or three quick chirps sliding up
      const f0 = 2400 + this.rand() * 1600, n = 2 + Math.floor(this.rand() * 3);
      for (let i = 0; i < n; i++) this.tone(t + i * 0.11, f0, 0.08, { vol: 0.025, slideTo: f0 * 1.35, bus: b });
      if (this.rand() > 0.6) this.noise(t, 2.4, { vol: 0.02, freq: 500, q: 0.4, type: 'lowpass', bus: b });
    }
  }

  schedule() {
    if (!this.ctx || !this.track || this.paused) return;
    const battle = this.track === 'battle' || this.track === 'boss';
    const I = battle ? Math.max(this.intensity, this.track === 'boss' ? 1 : 0) : 0;
    const bpm = battle ? [78, 92, 104, 112][I] : 66, beat = 60 / bpm / 2; // eighth notes
    this.ambienceTick(this.ctx.currentTime + 0.1);
    while (this.nextBeat < this.ctx.currentTime + 0.25) {
      const t = this.nextBeat, s = this.step, bar = s % 16, root = this.track === 'boss' ? 45 : 50; // D (or A for the boss)
      const mb = this.musicBus;
      if (this.music > 0) {
        // tanpura: Pa - Sa - Sa - Sa(low), plucked with long decay
        if (s % 4 === 0) {
          const tn = [7, 12, 12, 0][(s / 4) % 4];
          const o = this.tone(t, midi(root - 12 + tn), beat * 7, { type: 'sawtooth', vol: 0.035, attack: 0.02, bus: mb, verb: true });
          o.detune.setValueAtTime(-4, t);
        }
        // tabla: teentaal-ish theka in battle, sparse in the menu
        if (battle) {
          const pat = ['dha', null, 'dhin', 'na', 'dha', null, 'dhin', 'na', 'dha', 'tin', 'tin', 'na', 'ta', null, 'dhin', 'na'];
          const k = pat[bar];
          if (k) this.drum(t, k === 'dhin' ? 'dha' : k === 'ta' ? 'na' : k, mb, 0.55);
          if (bar === 0 && (s / 16) % 2 === 1) this.drum(t, 'ge', mb, 0.6);
          // tension layers: a low dhol pulse on every beat, then a war-horn drone
          if (I >= 2 && s % 2 === 0) this.drum(t, 'ge', mb, 0.35);
          if (I >= 2 && bar === 0) this.tone(t, midi(root - 24), beat * 15, { type: 'sawtooth', vol: 0.03, attack: 0.3, bus: mb, verb: true });
          if (I >= 3 && bar % 4 === 2) this.drum(t, 'dhol', mb, 0.45);
          if (I === 0 && bar % 8 !== 0) { /* getting ready: only the drone, the odd stroke and the flute */ }
        } else if (bar === 0 || bar === 10) this.drum(t, bar ? 'na' : 'dha', mb, 0.4);
        // heartbeat when the fort is nearly lost
        if (this.heartbeat && s % 8 === 0) { this.tone(t, 60, 0.18, { vol: 0.32, slideTo: 42, bus: this.sfxBus }); this.tone(t + 0.22, 56, 0.16, { vol: 0.22, slideTo: 40, bus: this.sfxBus }); }
        // bansuri: a random walk on the raga scale, phrases rest every other bar
        const phraseRest = battle ? (I === 0 ? bar % 8 > 4 : bar >= 14) : (Math.floor(s / 16) % 2 === 1 && bar > 6);
        const every = battle ? (I >= 2 ? 1 : 2) : 4;
        if (!phraseRest && s % every === 0 && this.rand() > (battle ? 0.15 : 0.25)) {
          this.note = Math.max(-2, Math.min(9, this.note + Math.round((this.rand() - 0.5) * 3)));
          const n = this.note, oct = Math.floor(n / 5), deg = ((n % 5) + 5) % 5;
          const f = midi(root + 12 + SCALE[deg] + 12 * oct);
          const dur = beat * every * (this.rand() > 0.7 ? 2 : 1.1);
          this.flute(t, f, dur, battle && I >= 3);
        }
      }
      this.nextBeat += beat;
      this.step++;
    }
  }

  flute(t, f, dur, reed = false) {
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), gn = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    // reed = a shehnai-like sound for boss fights: brighter, buzzier
    o.type = reed ? 'sawtooth' : 'sine'; o2.type = reed ? 'square' : 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2;
    lfo.frequency.value = 5.2; lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency);
    const g2 = c.createGain(); g2.gain.value = 0.15; o2.connect(g2); g2.connect(gn);
    o.frequency.setValueAtTime(f * 0.985, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); // the slide into a note (meend)
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.09, t + 0.05); gn.gain.setValueAtTime(0.08, t + dur * 0.7); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(this.musicBus); gn.connect(this.verb);
    this.noise(t, Math.min(0.12, dur), { vol: 0.02, freq: f * 2, q: 2, bus: this.musicBus });
    for (const x of [o, o2, lfo]) { x.start(t); x.stop(t + dur + 0.05); }
  }
}

export const sound = new Sound();
