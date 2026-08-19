/** Dev-only performance marks for bootstrap/render diagnostics. */
export function perfMark(label: string): () => void {
  if (!import.meta.env.DEV) return () => {};
  const start = performance.now();
  return () => {
    const ms = (performance.now() - start).toFixed(1);
    console.debug(`[perf] ${label}: ${ms}ms`);
  };
}

export function perfLog(label: string, detail?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return;
  if (detail) {
    console.debug(`[perf] ${label}`, detail);
  } else {
    console.debug(`[perf] ${label}`);
  }
}
