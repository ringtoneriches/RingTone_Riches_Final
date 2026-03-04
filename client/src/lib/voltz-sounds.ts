
let audioCtx: AudioContext | null = null;

function isContextUsable(ctx: AudioContext | null): ctx is AudioContext {
  if (!ctx) return false;
  try {
    return ctx.state !== "closed";
  } catch {
    return false;
  }
}

function getAudioContext(): AudioContext | null {
  try {
    if (!isContextUsable(audioCtx)) {
      audioCtx = null;
    }
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (!isContextUsable(audioCtx)) {
      audioCtx = null;
      return null;
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    if (!isContextUsable(audioCtx)) {
      audioCtx = null;
      return null;
    }
    return audioCtx;
  } catch {
    audioCtx = null;
    return null;
  }
}

function safeCreateOscillator(ctx: AudioContext): OscillatorNode | null {
  try {
    if (!isContextUsable(ctx)) return null;
    return ctx.createOscillator();
  } catch {
    return null;
  }
}

function safeCreateGain(ctx: AudioContext): GainNode | null {
  try {
    if (!isContextUsable(ctx)) return null;
    return ctx.createGain();
  } catch {
    return null;
  }
}

export function disposeAudioContext() {
  if (audioCtx) {
    try {
      audioCtx.close().catch(() => {});
    } catch {}
    audioCtx = null;
  }
}

export function playWinSound() {
  try {
    const ctx = getAudioContext();
    if (!isContextUsable(ctx)) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      try {
        if (!isContextUsable(ctx)) return;
        const osc = safeCreateOscillator(ctx);
        const gain = safeCreateGain(ctx);
        if (!osc || !gain) return;

        osc.type = "sine";
        osc.frequency.value = freq;

        const t = now + i * 0.12;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      } catch {}
    });
  } catch {
    audioCtx = null;
  }
}

export function playPowerDown() {
  try {
    const ctx = getAudioContext();
    if (!isContextUsable(ctx)) return;
    const now = ctx.currentTime;

    const osc = safeCreateOscillator(ctx);
    const gain = safeCreateGain(ctx);
    if (!osc || !gain) return;

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  } catch {
    audioCtx = null;
  }
}

export function playBackupPower() {
  try {
    const ctx = getAudioContext();
    if (!isContextUsable(ctx)) return;
    const now = ctx.currentTime;

    const notes = [392, 523.25, 392];
    notes.forEach((freq, i) => {
      try {
        if (!isContextUsable(ctx)) return;
        const osc = safeCreateOscillator(ctx);
        const gain = safeCreateGain(ctx);
        if (!osc || !gain) return;

        osc.type = "triangle";
        osc.frequency.value = freq;

        const t = now + i * 0.15;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      } catch {}
    });
  } catch {
    audioCtx = null;
  }
}
