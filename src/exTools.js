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

export const TAB_BAR_H = 67;

/* Session list order = section ids (Push/Pull/Legs+Core), not catalog array order. */
export function sessionExIds(day) {
  if (!day || !Array.isArray(day.secs)) return [];
  const out = [];
  day.secs.forEach((s) => {
    (s && s.ids ? s.ids : []).forEach((id) => { if (id) out.push(id); });
  });
  return out;
}

export function nextSessionExId(ids, currentId) {
  const list = ids || [];
  const i = list.indexOf(currentId);
  if (i < 0 || i >= list.length - 1) return null;
  return list[i + 1];
}

export function afterCompleteOpenIds(openIds, currentId, sessionIds) {
  const next = { ...(openIds || {}), [currentId]: false };
  const nxt = nextSessionExId(sessionIds, currentId);
  if (nxt) next[nxt] = true;
  return next;
}

/* Layout-viewport px covered by the keyboard. 0 when iOS PWA shrinks innerHeight with the keys. */
export function viewportKeyboardPx(innerHeight, vv) {
  if (!vv || typeof vv.height !== "number") return 0;
  const visualBottom = (vv.offsetTop || 0) + vv.height;
  return Math.max(0, (innerHeight || 0) - visualBottom);
}

export function isKeyboardChromeOpen(kb, noteFocused) {
  return !!(noteFocused || (kb || 0) > 40);
}

/* How far above the visual-viewport bottom the note should sit.
   Keyboard up / note focused: footer is hidden — dock just above the keys.
   Keyboard down: clear the tab bar. */
export function noteDockGap(kb, tabH, noteFocused) {
  const k = Math.max(0, kb || 0);
  const tab = Math.max(0, tabH == null ? TAB_BAR_H : tabH);
  if (noteFocused || k > 40) return 8;
  return tab + 8;
}

/* Positive = scroll the scroller down so the note moves up (above keys). Tall notes pin the bottom. */
export function noteScrollDelta(rect, box, headH, dockGap) {
  if (!rect || !box) return 0;
  const padTop = 8;
  const top = (box.top || 0) + Math.max(0, headH || 0) + padTop;
  const bottom = (box.bottom || 0) - Math.max(0, dockGap || 0);
  const avail = bottom - top;
  const h = typeof rect.height === "number" ? rect.height : (rect.bottom - rect.top);
  if (avail < 24 || h > avail) return rect.bottom - bottom;
  if (rect.bottom > bottom) return rect.bottom - bottom;
  if (rect.top < top) return rect.top - top;
  return 0;
}

/* Grow the planned set list to n without dropping existing sets. */
export function padPlan(plan, n, fill) {
  const out = (plan || []).map((s) => ({ ...s }));
  const want = n || 0;
  if (want <= out.length) return out;
  const last = out[out.length - 1] || fill || { w: 0, r: 0 };
  while (out.length < want) out.push({ ...last });
  return out;
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
