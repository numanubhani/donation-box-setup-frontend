/** Short success beep when a QR code is scanned. Uses Web Audio API (no asset file). */
export function playScanBeep() {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1174, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.18);

    oscillator.onended = () => {
      void ctx.close();
    };
  } catch {
    // ignore if audio is blocked
  }
}
