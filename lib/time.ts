export function formatMs(ms: number): string {
  const clamped = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((clamped % 1000) / 10);
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const xx = String(centiseconds).padStart(2, "0");
  return `${mm}:${ss}.${xx}`;
}
