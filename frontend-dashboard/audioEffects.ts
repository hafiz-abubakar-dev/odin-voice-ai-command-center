// Web Audio API & Speech Synthesis Engine for Odin Command Center

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a resonant Norse acoustic tone representing Odin's rune awakening
 */
export function playRuneHum(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Deep fundamental tone (A2 = 110Hz) + minor fifth (E3 = 164.8Hz) + octave harmonic
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, now);
    osc1.frequency.exponentialRampToValueAtTime(115, now + 0.6);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(164.8, now);
    osc2.frequency.exponentialRampToValueAtTime(162, now + 0.6);

    // Lowpass filter for dark obsidian tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.linearRampToValueAtTime(600, now + 0.3);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.8);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.08, now + 0.08);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.85);
    osc2.stop(now + 0.95);
  } catch (e) {
    console.warn('Audio synthesis not supported or blocked:', e);
  }
}

/**
 * Plays a clear crystal / gold chime tone upon task confirmation
 */
export function playConfirmationChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Gemstone crystal chime chords (C6 = 1046.5Hz & G6 = 1567.98Hz)
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.05 / (idx + 1), now + idx * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + 0.95);
    });
  } catch (e) {
    console.warn('Confirmation chime not played:', e);
  }
}

/**
 * Odin voice speech synthesis (deep, deliberate, authoritative)
 */
export function speakOdinResponse(
  text: string,
  options: { pitch?: number; rate?: number; onEnd?: () => void } = {}
): void {
  return;
    if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel(); // Stop any pending speech

  const cleanText = text.replace(/[*_#`[\]]/g, '');
  const utterance = new SpeechSynthesisUtterance(cleanText);

  utterance.pitch = options.pitch ?? 0.82; // Deep, authoritative
  utterance.rate = options.rate ?? 0.92; // Deliberate executive pacing

  // Attempt to select a dignified, deep English voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice =
    voices.find(v => v.lang.startsWith('en') && (v.name.includes('Daniel') || v.name.includes('George') || v.name.includes('Male') || v.name.includes('Natural') || v.name.includes('Google UK English Male'))) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (options.onEnd) {
    utterance.onend = options.onEnd;
    utterance.onerror = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any current speech playback
 */
export function stopOdinSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Plays an external audio stream or audio URL returned by n8n
 */
export function playAudioUrl(
  audioUrl: string,
  onEnd?: () => void
): HTMLAudioElement {
  const audio = new Audio(audioUrl);
  if (onEnd) {
    audio.onended = onEnd;
    audio.onerror = onEnd;
  }
  audio.play().catch(err => {
    console.warn('Audio URL playback error, falling back to speech synthesis if needed:', err);
    if (onEnd) onEnd();
  });
  return audio;
}
