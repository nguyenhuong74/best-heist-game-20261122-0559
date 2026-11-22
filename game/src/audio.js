// audio.js — tiny synthesised sound effects, made with WebAudio only.
// No audio files are shipped: every beep is an oscillator, so the game
// loads nothing over the network and stays fully offline.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Every effect is two or three short tones at most: a picked coin chirps,
  // a spotted guard growls low, a win arpeggiates up. Nothing loops except
  // the alarm beep the game loop triggers while the meter is high.
  function tone(freq, seconds, type = 'sine', volume = 0.08, when = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const start = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  }

  return {
    get muted() { return muted; },
    toggleMute() { muted = !muted; return muted; },
    pickup() { tone(660, 0.12, 'sine', 0.07); tone(990, 0.14, 'sine', 0.06, 0.08); },
    crack() { tone(440, 0.08, 'square', 0.04); },
    vaultOpen() { tone(523, 0.15, 'triangle', 0.09); tone(659, 0.15, 'triangle', 0.09, 0.1); tone(784, 0.25, 'triangle', 0.09, 0.2); },
    spotted() { tone(220, 0.25, 'sawtooth', 0.09); tone(185, 0.3, 'sawtooth', 0.09, 0.18); },
    alarmLoop() { tone(880, 0.09, 'square', 0.045); },
    caught() { tone(330, 0.2, 'sawtooth', 0.1); tone(262, 0.25, 'sawtooth', 0.1, 0.15); tone(196, 0.45, 'sawtooth', 0.1, 0.3); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, i * 0.12)); },
    smoke() { tone(180, 0.3, 'sine', 0.05); },
    emp() { tone(1200, 0.12, 'square', 0.05); tone(300, 0.25, 'square', 0.05, 0.1); },
  };
}
