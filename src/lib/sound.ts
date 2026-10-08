/**
 * Browser-native Web Audio API synthesizer for ride alerts and notifications.
 * Works offline, requires zero external mp3 assets, and has zero latency.
 */

let audioCtx: AudioContext | null = null;
let alertIntervalId: number | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a single dual-frequency high-priority chime (Uber/Ola style).
 */
export function playChimeTone(freq1 = 587.33, freq2 = 880, duration = 0.25) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq1, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn("Audio playback not allowed yet:", err);
  }
}

/**
 * Loops the chime every 1.2 seconds until dismissed.
 */
export function startRideAlertLoop() {
  if (alertIntervalId) return;
  playChimeTone();
  if (typeof window !== "undefined") {
    alertIntervalId = window.setInterval(() => {
      playChimeTone(659.25, 987.77, 0.3);
    }, 1200);
  }
}

/**
 * Stops the continuous alert loop.
 */
export function stopRideAlertLoop() {
  if (alertIntervalId && typeof window !== "undefined") {
    window.clearInterval(alertIntervalId);
    alertIntervalId = null;
  }
}
