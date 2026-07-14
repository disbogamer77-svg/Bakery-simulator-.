// Professional High-Fidelity Web Audio API Synthesizer for the Magic Oven
// Crafted with physical modeling, additive harmonics, and dynamic modulation

let audioCtx: AudioContext | null = null;
let ovenHumOsc1: OscillatorNode | null = null;
let ovenHumOsc2: OscillatorNode | null = null;
let ovenHumFan: AudioBufferSourceNode | null = null;
let ovenHumGain: GainNode | null = null;

let sizzleNoise: AudioBufferSourceNode | null = null;
let sizzleLFO: OscillatorNode | null = null;
let sizzleGain: GainNode | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Premium Haptic Tap / Button Click
export function playButtonPress() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    // Start at a high crisp frequency and slide down extremely fast (simulating a solid physical click)
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(1.0, ctx.currentTime);

    // Rapid volume decay
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {
    console.error('Audio button tap error:', e);
  }
}

// 2. Warm Convection Oven Hum (Cozy Fan + Low Power Hum)
export function playOvenHum(start: boolean, temperature: number = 350) {
  try {
    const ctx = getAudioContext();

    if (!start) {
      if (ovenHumOsc1) {
        try { ovenHumOsc1.stop(); } catch(e){}
        ovenHumOsc1 = null;
      }
      if (ovenHumOsc2) {
        try { ovenHumOsc2.stop(); } catch(e){}
        ovenHumOsc2 = null;
      }
      if (ovenHumFan) {
        try { ovenHumFan.stop(); } catch(e){}
        ovenHumFan = null;
      }
      if (ovenHumGain) {
        ovenHumGain.disconnect();
        ovenHumGain = null;
      }
      return;
    }

    if (ovenHumOsc1) return; // Already humming!

    ovenHumGain = ctx.createGain();
    ovenHumGain.gain.setValueAtTime(0.0, ctx.currentTime);
    ovenHumGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.8); // Smooth fade in

    // 1st Warm Harmonic (Subtransformer hum)
    const freq1 = 55 + (temperature / 500) * 15; // 55Hz to 70Hz
    ovenHumOsc1 = ctx.createOscillator();
    ovenHumOsc1.type = 'sine';
    ovenHumOsc1.frequency.setValueAtTime(freq1, ctx.currentTime);

    const osc1Gain = ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.7, ctx.currentTime);

    // 2nd Harmonic (Warm buzz)
    const freq2 = freq1 * 2;
    ovenHumOsc2 = ctx.createOscillator();
    ovenHumOsc2.type = 'triangle';
    ovenHumOsc2.frequency.setValueAtTime(freq2, ctx.currentTime);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.15, ctx.currentTime);

    // Convection Air Fan Noise (Very cozy lowpass filtered white noise)
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    ovenHumFan = ctx.createBufferSource();
    ovenHumFan.buffer = noiseBuffer;
    ovenHumFan.loop = true;

    const fanFilter = ctx.createBiquadFilter();
    fanFilter.type = 'lowpass';
    fanFilter.frequency.setValueAtTime(280, ctx.currentTime); // Cozy muffled air breeze
    
    const fanGain = ctx.createGain();
    fanGain.gain.setValueAtTime(0.35, ctx.currentTime);

    // Master Lowpass Filter for the combined hum
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(450, ctx.currentTime);

    // Connections
    ovenHumOsc1.connect(osc1Gain);
    osc1Gain.connect(masterFilter);

    ovenHumOsc2.connect(osc2Gain);
    osc2Gain.connect(masterFilter);

    ovenHumFan.connect(fanFilter);
    fanFilter.connect(fanGain);
    fanGain.connect(masterFilter);

    masterFilter.connect(ovenHumGain);
    ovenHumGain.connect(ctx.destination);

    ovenHumOsc1.start();
    ovenHumOsc2.start();
    ovenHumFan.start();
  } catch (e) {
    console.error('Audio hum error:', e);
  }
}

// 3. Juicy Bubbling & Sizzling (Warm Cheese Pops & Crinkles)
export function playSizzling(start: boolean) {
  try {
    const ctx = getAudioContext();

    if (!start) {
      if (sizzleNoise) {
        try { sizzleNoise.stop(); } catch(e){}
        sizzleNoise = null;
      }
      if (sizzleLFO) {
        try { sizzleLFO.stop(); } catch(e){}
        sizzleLFO = null;
      }
      if (sizzleGain) {
        sizzleGain.disconnect();
        sizzleGain = null;
      }
      return;
    }

    if (sizzleNoise) return;

    sizzleGain = ctx.createGain();
    sizzleGain.gain.setValueAtTime(0.0, ctx.currentTime);
    sizzleGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.8); // Soft start

    // Generates high-quality white noise
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    sizzleNoise = ctx.createBufferSource();
    sizzleNoise.buffer = noiseBuffer;
    sizzleNoise.loop = true;

    // Highpass filter for the hot oil/crackle crispness
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(3500, ctx.currentTime);

    // Bandpass filter to sculpt sizzle resonance
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(4500, ctx.currentTime);
    bandpass.Q.setValueAtTime(1.2, ctx.currentTime);

    // LFO to modulate amplitude and simulate randomized bubbling/sputtering sauce
    sizzleLFO = ctx.createOscillator();
    sizzleLFO.type = 'sine';
    sizzleLFO.frequency.setValueAtTime(3.5, ctx.currentTime); // 3.5Hz bubbling speed

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.4, ctx.currentTime); // Depth of bubbling

    // Modulate the sizzle amplitude dynamically
    const bubbleGain = ctx.createGain();
    bubbleGain.gain.setValueAtTime(0.6, ctx.currentTime);

    sizzleLFO.connect(lfoGain);
    lfoGain.connect(bubbleGain.gain);

    sizzleNoise.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(bubbleGain);
    bubbleGain.connect(sizzleGain);
    sizzleGain.connect(ctx.destination);

    sizzleNoise.start();
    sizzleLFO.start();
  } catch (e) {
    console.error('Audio sizzle error:', e);
  }
}

// 4. Magnificent Retro Brass Bell / Chime (Cozy & Warm)
export function playOvenDing() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create a gorgeous brass gong/bell by summing 6 precise harmonic partials
    // with different decay profiles (higher partials fade out much faster)
    const partials = [
      { ratio: 1.0, freq: 523.25, volume: 0.35, decay: 1.8 }, // C5 (Fundamental warmth)
      { ratio: 1.5, freq: 783.99, volume: 0.18, decay: 1.4 }, // G5 (Perfect Fifth resonance)
      { ratio: 2.0, freq: 1046.50, volume: 0.15, decay: 1.0 }, // C6 (Octave shine)
      { ratio: 2.51, freq: 1318.51, volume: 0.10, decay: 0.7 }, // E6 (Warm Major Third)
      { ratio: 3.0, freq: 1567.98, volume: 0.08, decay: 0.5 }, // G6 (High octave fifth)
      { ratio: 4.0, freq: 2093.00, volume: 0.05, decay: 0.3 }  // C7 (High crystal ping)
    ];

    partials.forEach((part) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const biquad = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(part.freq, now);

      // Soft physical strike attack
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(part.volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + part.decay);

      biquad.type = 'lowpass';
      biquad.frequency.setValueAtTime(3000, now);

      osc.connect(biquad);
      biquad.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + part.decay + 0.1);
    });
  } catch (e) {
    console.error('Audio ding error:', e);
  }
}

// 5. Rich Magical Coin Jingle (Satisfying Cascade for Sales)
export function playCoinsSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create a rapid sequence of 6 sparkling metal tinks to simulate cascading coins
    const coinNotes = [
      { delay: 0.00, freq: 1100, volume: 0.15, duration: 0.18 },
      { delay: 0.04, freq: 1350, volume: 0.15, duration: 0.15 },
      { delay: 0.08, freq: 1540, volume: 0.18, duration: 0.16 },
      { delay: 0.13, freq: 1850, volume: 0.15, duration: 0.14 },
      { delay: 0.18, freq: 2200, volume: 0.20, duration: 0.22 },
      { delay: 0.24, freq: 2500, volume: 0.12, duration: 0.25 }
    ];

    coinNotes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const bandpass = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.delay);

      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(note.freq, now + note.delay);
      bandpass.Q.setValueAtTime(3.0, now + note.delay);

      gain.gain.setValueAtTime(0.001, now + note.delay);
      gain.gain.linearRampToValueAtTime(note.volume, now + note.delay + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.duration);

      osc.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.delay);
      osc.stop(now + note.delay + note.duration + 0.05);
    });
  } catch (e) {
    console.error('Audio coins sound error:', e);
  }
}

// 6. Magical Acoustic Unlock Sequence
export function playUnlock() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Warm retro digital physical acoustic arpeggio
    const times = [0.0, 0.07, 0.14, 0.21, 0.28];
    const freqs = [329.63, 392.00, 523.25, 659.25, 783.99]; // E4, G4, C5, E5, G5 (C major pentatonic warmth)

    times.forEach((t, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lowpass = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freqs[index], now + t);

      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1500, now + t);

      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(0.15, now + t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.45);

      osc.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + 0.5);
    });
  } catch (e) {
    console.error('Audio unlock error:', e);
  }
}
