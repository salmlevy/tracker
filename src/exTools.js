/* Small helpers for Día C session UI. Keep catalog ids unchanged. */

export function fmtClock(ms) {
  const t = Math.max(0, Math.floor((ms || 0) / 1000));
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
}

/* One tap: start work, or flip work ↔ rest. The clock never stops. */
export function applyVuelta(state, now) {
  const t = now || Date.now();
  if (!state || !state.startedAt) return { startedAt: t, phase: "work", phaseAt: t };
  return { ...state, phase: state.phase === "work" ? "rest" : "work", phaseAt: t };
}

export function resolveOpt(logOpt, lastOpt, ex) {
  if (!ex || !ex.opts || !ex.opts.length) return null;
  const ok = (id) => id && ex.opts.some((o) => o.id === id);
  if (ok(logOpt)) return logOpt;
  if (ok(lastOpt)) return lastOpt;
  if (ok(ex.optDefault)) return ex.optDefault;
  return ex.opts[0].id;
}

export function optLabel(ex, optId) {
  if (!ex || !ex.opts) return "";
  const hit = ex.opts.find((o) => o.id === optId);
  return hit ? hit.n : "";
}

export function lastOptFor(hist, dayId, ex, v) {
  if (!ex || !ex.opts) return null;
  const vid = v === "alt" ? ex.id + "~alt" : ex.id;
  const list = hist || [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].day !== dayId) continue;
    const raw = list[i].logs && list[i].logs[ex.id];
    if (!raw || Array.isArray(raw)) continue;
    const lv = raw.v === "alt" ? ex.id + "~alt" : ex.id;
    if (lv === vid && raw.opt) return raw.opt;
  }
  return null;
}
