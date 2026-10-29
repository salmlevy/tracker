/* Small helpers for Día C session UI. Keep catalog ids unchanged. */

export function fmtClock(ms) {
  const t = Math.max(0, Math.floor((ms || 0) / 1000));
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
}

/* One tap: start work, or flip work ↔ rest. The clock runs until the sets are done. */
export function applyVuelta(state, now) {
  const t = now || Date.now();
  if (!state || !state.startedAt) return { startedAt: t, phase: "work", phaseAt: t };
  if (state.stopped) return state;
  return { ...state, phase: state.phase === "work" ? "rest" : "work", phaseAt: t };
}

/* Para el reloj al cerrar la última serie. No sigue contando en descanso. */
export function stopVuelta(state, now) {
  if (!state || !state.startedAt) return state || null;
  if (state.stopped) return state;
  return { ...state, stopped: true, stoppedAt: now || Date.now() };
}

/* Seconds actually held when a work lap ends. null if this tap did not finish work. */
export function vueltaHeldSec(prev, now) {
  if (!prev || !prev.startedAt || prev.stopped || prev.phase !== "work") return null;
  const t = now || Date.now();
  const sec = Math.round((t - (prev.phaseAt || prev.startedAt)) / 1000);
  return sec >= 1 ? sec : null;
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

/* First exercise that is not finished. If all are done, the last one. */
export function firstPendingExId(ids, isDone) {
  const list = ids || [];
  for (let i = 0; i < list.length; i++) {
    if (!isDone(list[i])) return list[i];
  }
  return list.length ? list[list.length - 1] : null;
}

/* Layout-viewport px covered by the keyboard. 0 when iOS PWA shrinks innerHeight with the keys. */
export function viewportKeyboardPx(innerHeight, vv) {
  if (!vv || typeof vv.height !== "number") return 0;
  const visualBottom = (vv.offsetTop || 0) + vv.height;
  return Math.max(0, (innerHeight || 0) - visualBottom);
}

/* Chrome de la nota (barra oculta, encabezado fijo) solo con la nota abierta.
   El teclado de peso/reps no debe dispararlo. */
export function isKeyboardChromeOpen(_kb, noteFocused) {
  return !!noteFocused;
}

/* El panel flota sobre el teclado solo si el foco está en la nota y hay teclado. */
export function shouldDockNote(noteFocused, kb) {
  return !!noteFocused && (kb || 0) > 40;
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

/* Keyboard inset. Safari shrinks visualViewport. iOS PWA often does not:
   innerHeight and visualViewport stay full-screen and the keys overlay 100lvh.
   Then a focused note uses fallbackPx so it can still sit above the keys. */
export function keyboardInsetPx(metrics) {
  const m = metrics || {};
  const inner = m.innerHeight || 0;
  const layout = m.layoutHeight || inner;
  const measured = Math.max(
    viewportKeyboardPx(inner, m.vv),
    Math.max(0, layout - inner),
  );
  if (measured > 40) return measured;
  if (m.focused && m.useFallback) {
    return m.fallbackPx != null ? m.fallbackPx : Math.round(layout * 0.42);
  }
  return 0;
}

/* Fixed box for a focused note. Bottom stays put, so a taller field grows up.
   top/height are layout-viewport CSS pixels (what position:fixed uses). */
export function noteFixedBox(metrics) {
  const m = metrics || {};
  const inner = m.innerHeight || 0;
  const layout = m.layoutHeight || inner;
  const vv = m.vv || { height: inner, offsetTop: 0 };
  const vvTop = vv.offsetTop || 0;
  const vvH = typeof vv.height === "number" ? vv.height : inner;
  const kb = keyboardInsetPx(m);
  const vvGap = Math.max(0, layout - (vvTop + vvH));
  const extra = Math.max(0, kb - vvGap);
  const visibleBottom = Math.max(0, vvTop + vvH - extra);
  const head = Math.max(0, m.headH || 0);
  const margin = 8;
  const maxH = Math.max(64, Math.min(m.maxH || 220, visibleBottom - vvTop - head - margin * 2));
  const want = Math.max(64, Math.min(maxH, m.fieldHeight || 64));
  const top = Math.max(vvTop + head + margin, visibleBottom - margin - want);
  return { top, height: want, maxHeight: maxH };
}

/* Positive = scroll the scroller down so the note moves up (above keys).
   pinBottom: keyboard up — keep the field’s bottom on the dock so growth goes upward. */
export function noteScrollDelta(rect, box, headH, dockGap, pinBottom) {
  if (!rect || !box) return 0;
  const padTop = 8;
  const top = (box.top || 0) + Math.max(0, headH || 0) + padTop;
  const bottom = (box.bottom || 0) - Math.max(0, dockGap || 0);
  const avail = bottom - top;
  const h = typeof rect.height === "number" ? rect.height : (rect.bottom - rect.top);
  if (pinBottom || avail < 24 || h > avail) return rect.bottom - bottom;
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

const YT_URL = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?|embed\/|shorts\/)|youtu\.be\/)/i;

/* Link verificado, o búsqueda con el nombre exacto que se ve en pantalla. */
export function youtubeHref(name, yt) {
  const raw = String(yt || "").trim();
  if (YT_URL.test(raw)) return raw;
  const q = String(name || "").trim();
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
}

export function activeType(ex, v) {
  if (v === "alt" && ex && ex.alt && ex.alt.type) return ex.alt.type;
  return (ex && ex.type) || "";
}

export function viewEx(ex, v) {
  if (!ex || v !== "alt" || !ex.alt) return ex;
  const type = activeType(ex, v);
  const step = ex.alt.step || ex.step;
  if (type === ex.type && step === ex.step) return ex;
  return { ...ex, type, step };
}

const roundToStep = (x, s) => Math.max(0, Math.round(x / s) * s);

/* Peso de la variante. alt.w es un peso de partida (la banda no tiene número). */
export function altPrevSets(prev, alt, step) {
  const st = step || 5;
  const a = alt || {};
  return (prev || []).map(([w, r]) => {
    const nw = typeof a.w === "number" ? a.w : roundToStep((w || 0) * (a.factor || 0), st);
    return [nw, r];
  });
}

/* La nota fuera de pantalla no se reposiciona en cada frame de scroll. */
export function noteNearScroll(top, scrollTop, viewH, pad) {
  const p = pad == null ? 280 : pad;
  const y = top || 0;
  const a = (scrollTop || 0) - p;
  const b = (scrollTop || 0) + (viewH || 0) + p;
  return y >= a && y <= b;
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
