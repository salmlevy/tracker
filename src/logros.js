/* Logros del inicio. Solo sesiones y trotes reales: nada de semillas ni metas inventadas. */

import {
  chipModel, dateKey, daysBetween, doneSetsOf, returnProgram, sessionHasWork, weekIndex,
} from "./regreso.js";

export const VARIANTES = ["records", "constancia", "hitos"];
export const WEEK_PLAN = ["A", "B", "C", "res", "pot"];

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function pickVariante(random) {
  const r = typeof random === "function" ? random() : Number(random);
  const x = Number.isFinite(r) ? r : 0;
  if (x <= 0) return VARIANTES[0];
  if (x >= 1) return VARIANTES[VARIANTES.length - 1];
  return VARIANTES[Math.min(VARIANTES.length - 1, Math.floor(x * VARIANTES.length))];
}

export function weekMonday(value, timeZone) {
  const k = dateKey(value, timeZone);
  if (!k) return "";
  const [y, m, d] = k.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const wd = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - wd);
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return utc.getUTCFullYear() + "-" + mm + "-" + dd;
}

function shiftMonday(monday, weeks) {
  if (!monday) return "";
  const [y, m, d] = monday.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + weeks * 7));
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return utc.getUTCFullYear() + "-" + mm + "-" + dd;
}

export function fechaCorta(value, timeZone) {
  const k = dateKey(value, timeZone);
  if (!k) return "";
  const [, m, d] = k.split("-");
  return Number(d) + " " + (MESES_CORTOS[Number(m) - 1] || "");
}

function monthKey(value, timeZone) {
  const k = dateKey(value, timeZone);
  return k ? k.slice(0, 7) : "";
}

function monthName(key) {
  const n = Number(String(key || "").slice(5, 7));
  return MESES[n - 1] || "";
}

function num(n) {
  const x = Math.round(Number(n) * 10) / 10;
  if (!Number.isFinite(x)) return "0";
  return String(x);
}

function epley(w, r) {
  const W = Number(w) || 0;
  const R = Number(r) || 0;
  return W > 0 ? W * (1 + R / 30) : R;
}

function work(hist, timeZone) {
  return (hist || []).filter(sessionHasWork).slice().sort((a, b) => {
    const da = dateKey(a.date, timeZone);
    const db = dateKey(b.date, timeZone);
    if (da < db) return -1;
    if (da > db) return 1;
    return 0;
  });
}

function cleanSets(session, exId, v) {
  return doneSetsOf(session, exId, v).filter((s) => s && s.f !== false && ((Number(s.w) || 0) > 0 || (Number(s.r) || 0) > 0));
}

function better(type, a, b) {
  if (!b) return true;
  if (type === "assist") {
    if (a.w !== b.w) return a.w < b.w;
    return a.r > b.r;
  }
  if (type === "time" || type === "body") return a.r > b.r;
  return epley(a.w, a.r) > epley(b.w, b.r) + 1e-9;
}

function bestOf(type, sets) {
  let best = null;
  sets.forEach((s) => {
    const cur = { w: Number(s.w) || 0, r: Number(s.r) || 0 };
    if (!best || better(type, cur, best)) best = cur;
  });
  return best;
}

function setDetail(type, u, set) {
  if (!set) return "";
  if (type === "assist") {
    if (set.w <= 0) return "sin ayuda × " + set.r;
    return num(set.w) + " kg de ayuda × " + set.r;
  }
  if (type === "time") return set.r + " s";
  if (type === "body") return set.r + " reps";
  const unit = u === "kg" ? "kg" : "lb";
  return num(set.w) + "×" + set.r + " " + unit;
}

function paceText(min, km) {
  const sec = Math.round((min / km) * 60);
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return m + ":" + s + "/km";
}

function runList(runs) {
  const seen = new Set();
  return (runs || []).filter((r) => {
    if (!r || seen.has(r.id)) return false;
    seen.add(r.id);
    return Number(r.min) > 0 && dateKey(r.date);
  }).slice().sort((a, b) => {
    const da = dateKey(a.date);
    const db = dateKey(b.date);
    if (da < db) return -1;
    if (da > db) return 1;
    return String(a.id).localeCompare(String(b.id));
  });
}

export function flattenCatalog(days) {
  const out = [];
  Object.keys(days || {}).forEach((day) => {
    const list = (days[day] && days[day].ex) || [];
    list.forEach((ex) => {
      if (!ex || !ex.id) return;
      out.push({ id: ex.id, v: "main", name: ex.n, type: ex.type || "weight", u: ex.u || "lb" });
      if (ex.alt && ex.alt.n) out.push({ id: ex.id, v: "alt", name: ex.alt.n, type: ex.type || "weight", u: ex.u || "lb" });
    });
  });
  return out;
}

/* Récords recientes: una marca solo si supera la mejor anterior. Si nadie se superó, las mejores reales. */
export function recentRecords(hist, catalog, runs, timeZone) {
  const beats = [];
  const bests = [];
  const sessions = work(hist, timeZone);
  (catalog || []).forEach((ex) => {
    let prev = null;
    let top = null;
    let topWhen = "";
    let topSort = "";
    sessions.forEach((s) => {
      const sets = cleanSets(s, ex.id, ex.v || "main");
      const cur = bestOf(ex.type, sets);
      if (!cur) return;
      const sort = dateKey(s.date, timeZone);
      const when = fechaCorta(s.date, timeZone);
      if (prev && better(ex.type, cur, prev)) {
        beats.push({
          key: ex.id + ":" + (ex.v || "main") + ":" + sort,
          title: ex.name,
          detail: setDetail(ex.type, ex.u, cur),
          when,
          badge: "record",
          sort,
        });
      }
      if (!top || better(ex.type, cur, top)) {
        top = cur;
        topWhen = when;
        topSort = sort;
      }
      prev = !prev || better(ex.type, cur, prev) ? cur : prev;
    });
    if (top) {
      bests.push({
        key: "best:" + ex.id + ":" + (ex.v || "main"),
        title: ex.name,
        detail: setDetail(ex.type, ex.u, top),
        when: topWhen,
        badge: "mejor",
        sort: topSort,
      });
    }
  });

  let bestKm = 0;
  let bestPace = Infinity;
  let paceKm = 0;
  runList(runs).forEach((r) => {
    const km = Number(r.km) || 0;
    const min = Number(r.min) || 0;
    const when = fechaCorta(r.date, timeZone);
    const sort = dateKey(r.date, timeZone);
    if (km > bestKm + 0.009) {
      if (bestKm > 0) {
        beats.push({ key: "km:" + r.id, title: "Distancia", detail: num(km) + " km", when, badge: "record", sort });
      }
      bestKm = km;
    }
    /* El ritmo solo se compara contra un trote de al menos esa distancia. Un 3 km no le gana a un 13 km. */
    if (km >= 1 && min > 0) {
      const pace = min / km;
      const comparable = paceKm === 0 || km + 0.05 >= paceKm;
      if (comparable && pace < bestPace - 1e-6) {
        if (bestPace < Infinity) {
          beats.push({ key: "pace:" + r.id, title: "Ritmo", detail: paceText(min, km), when, badge: "record", sort });
        }
        bestPace = pace;
        paceKm = km;
      }
    }
  });
  if (bestKm > 0) {
    const top = runList(runs).filter((r) => (Number(r.km) || 0) >= bestKm - 0.009).pop();
    if (top) bests.push({ key: "best:km", title: "Distancia", detail: num(bestKm) + " km", when: fechaCorta(top.date, timeZone), badge: "mejor", sort: dateKey(top.date, timeZone) });
  }

  beats.sort((a, b) => (a.sort < b.sort ? 1 : a.sort > b.sort ? -1 : 0));
  if (beats.length) return { items: beats.slice(0, 5), empty: false };
  bests.sort((a, b) => (a.sort < b.sort ? 1 : a.sort > b.sort ? -1 : 0));
  if (bests.length) return { items: bests.slice(0, 4), empty: false };
  return { items: [], empty: true };
}

function slotDone(hist, runs, assign, monday, timeZone) {
  const gym = new Set();
  work(hist, timeZone).forEach((s) => {
    if (weekMonday(s.date, timeZone) !== monday) return;
    if (s.day === "A" || s.day === "B" || s.day === "C") gym.add(s.day);
  });
  const run = new Set();
  const seen = new Set();
  (runs || []).forEach((r) => {
    if (!r || seen.has(r.id) || !(Number(r.min) > 0)) return;
    seen.add(r.id);
    if (weekMonday(r.date, timeZone) !== monday) return;
    const slot = assign && assign[String(r.id)];
    if (slot) run.add(slot);
  });
  return { gym, run };
}

function weekMet(done) {
  return WEEK_PLAN.every((id) => (id === "A" || id === "B" || id === "C" ? done.gym.has(id) : done.run.has(id)));
}

export function constanciaStats(hist, runs, assign, today, ret, timeZone) {
  const todayK = dateKey(today, timeZone) || dateKey(new Date(), timeZone);
  const thisMonday = weekMonday(todayK, timeZone);
  const thisDone = slotDone(hist, runs, assign, thisMonday, timeZone);
  const weekDone = WEEK_PLAN.filter((id) => (id === "A" || id === "B" || id === "C" ? thisDone.gym.has(id) : thisDone.run.has(id))).length;
  let cursor = weekMet(thisDone) ? thisMonday : shiftMonday(thisMonday, -1);
  let streak = 0;
  for (let i = 0; i < 26 && cursor; i++) {
    if (!weekMet(slotDone(hist, runs, assign, cursor, timeZone))) break;
    streak += 1;
    cursor = shiftMonday(cursor, -1);
  }
  const mk = monthKey(todayK, timeZone);
  const gymMonth = work(hist, timeZone).filter((s) => monthKey(s.date, timeZone) === mk).length;
  const seen = new Set();
  let runMonth = 0;
  (runs || []).forEach((r) => {
    if (!r || seen.has(r.id) || !(Number(r.min) > 0)) return;
    seen.add(r.id);
    if (monthKey(r.date, timeZone) === mk) runMonth += 1;
  });
  const chip = chipModel(ret);
  const regreso = chip ? {
    title: "Regreso · semana " + chip.week + " de " + chip.weeks,
    detail: "Volver ya cuenta. Vas al " + chip.pct + "%.",
  } : null;
  const monthCount = gymMonth + runMonth;
  return {
    streak,
    weekDone,
    weekTotal: WEEK_PLAN.length,
    monthCount,
    monthLabel: monthName(mk),
    regreso,
    empty: streak === 0 && weekDone === 0 && monthCount === 0 && !regreso,
  };
}

function assistMark(hist, exId, timeZone) {
  let best = null;
  let first = null;
  let reps = 0;
  let when = "";
  work(hist, timeZone).forEach((s) => {
    cleanSets(s, exId, "main").forEach((set) => {
      const w = Number(set.w) || 0;
      const r = Number(set.r) || 0;
      if (r <= 0) return;
      if (first == null) first = w;
      if (best == null || w < best || (w === best && r > reps)) {
        best = w;
        reps = r;
        when = fechaCorta(s.date, timeZone);
      }
    });
  });
  if (best == null) return { done: false, progress: 0, detail: "Todavía no hay registro.", when: "" };
  if (best <= 0) return { done: true, progress: 1, detail: "sin ayuda × " + reps, when };
  const start = Math.max(first || 0, best, 1);
  const progress = start > best ? Math.min(0.95, (start - best) / start) : 0;
  return { done: false, progress, detail: num(best) + " kg de ayuda", when };
}

function finishedReturn(hist, timeZone) {
  const sessions = work(hist, timeZone);
  let phase = null;
  let lastFull = null;
  let prev = null;
  let done = false;
  sessions.forEach((s) => {
    const d = dateKey(s.date, timeZone);
    if (!d) return;
    if (prev == null) {
      lastFull = d;
      prev = d;
      return;
    }
    const gap = daysBetween(prev, d, timeZone);
    if (phase) {
      const week = weekIndex(phase.anchor, d, timeZone);
      if (week > phase.program.weeks) {
        if (gap >= 14) phase = { anchor: d, program: returnProgram(gap), baseline: lastFull };
        else {
          phase = null;
          lastFull = d;
        }
      } else if (week >= phase.program.weeks) {
        done = true;
        lastFull = d;
      }
    } else if (gap >= 14) {
      phase = { anchor: d, program: returnProgram(gap), baseline: lastFull };
    } else lastFull = d;
    prev = d;
  });
  return done;
}

const LADDER = [
  { id: "sesiones_10", title: "10 sesiones" },
  { id: "cinco_km", title: "5 km seguidos" },
  { id: "fondos_libre", title: "Fondos sin ayuda" },
  { id: "chin_libre", title: "Chin-up sin ayuda" },
  { id: "pullup_libre", title: "Pull-up sin ayuda" },
  { id: "regreso_100", title: "Regreso al 100%" },
  { id: "sesiones_50", title: "50 sesiones" },
  { id: "sesiones_100", title: "100 sesiones" },
];

function countMark(n, goal) {
  const c = Math.max(0, n);
  if (c >= goal) return { done: true, progress: 1, detail: c + " sesiones" };
  return { done: false, progress: c / goal, detail: c + " de " + goal };
}

export function hitosState(hist, runs, ret, timeZone) {
  const n = work(hist, timeZone).length;
  const maxKm = runList(runs).reduce((m, r) => Math.max(m, Number(r.km) || 0), 0);
  const km = maxKm >= 5
    ? { done: true, progress: 1, detail: num(maxKm) + " km" }
    : { done: false, progress: Math.max(0, Math.min(0.99, maxKm / 5)), detail: maxKm > 0 ? "tu más largo: " + num(maxKm) + " km" : "Sin distancia registrada." };
  const chip = chipModel(ret);
  const regresoDone = finishedReturn(hist, timeZone);
  const regreso = regresoDone
    ? { done: true, progress: 1, detail: "Llegaste a la semana del 100%." }
    : chip
      ? { done: false, progress: Math.min(0.99, (chip.week - (chip.pct >= 100 ? 0 : 1)) / chip.weeks), detail: "Semana " + chip.week + " de " + chip.weeks + " · " + chip.pct + "%" }
      : { done: false, progress: 0, detail: "Se cierra al llegar a la semana del 100%." };
  const marks = {
    sesiones_10: countMark(n, 10),
    sesiones_50: countMark(n, 50),
    sesiones_100: countMark(n, 100),
    cinco_km: km,
    fondos_libre: assistMark(hist, "a10", timeZone),
    chin_libre: assistMark(hist, "b5", timeZone),
    pullup_libre: assistMark(hist, "b10", timeZone),
    regreso_100: regreso,
  };
  const done = [];
  let next = null;
  LADDER.forEach((step) => {
    const m = marks[step.id];
    if (m.done) done.push({ id: step.id, title: step.title, detail: m.detail, when: m.when || "" });
    else if (!next) next = { id: step.id, title: step.title, detail: m.detail, progress: m.progress, when: m.when || "" };
  });
  return { done, next, empty: !done.length && !next };
}

/* 0 domingo ... 6 sábado, en la zona del dispositivo. */
export function weekdayOf(value, timeZone) {
  const k = dateKey(value, timeZone);
  if (!k) return -1;
  const [y, m, d] = k.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/* Jueves de frater: cada dos jueves, empezando el 22 oct 2026. */
export const FRATER_ANCLA = "2026-10-22";
export function fraterHoy(today, timeZone) {
  const k = dateKey(today, timeZone);
  if (!k || weekdayOf(k, timeZone) !== 4) return false;
  const n = daysBetween(FRATER_ANCLA, k, timeZone);
  return n >= 0 && n % 14 === 0;
}

export function pickHoy({ hist, runs, assign, today, draftDay, draftSets, timeZone }) {
  const monday = weekMonday(today, timeZone);
  const done = slotDone(hist, runs, assign, monday, timeZone);
  if (draftSets > 0 && draftDay) {
    return { kind: "gym", id: draftDay, continue: true, done: done.gym.has(draftDay), weekComplete: false };
  }
  /* Lunes y miércoles son de running: si queda un trote de cinta pendiente, toca ese. */
  const wd = weekdayOf(today, timeZone);
  if (wd === 1 || wd === 3) {
    const run = ["res", "pot"].find((id) => !done.run.has(id));
    if (run) return { kind: "run", id: run, continue: false, done: false, weekComplete: false };
  }
  for (let i = 0; i < WEEK_PLAN.length; i++) {
    const id = WEEK_PLAN[i];
    const isGym = id === "A" || id === "B" || id === "C";
    if (isGym ? !done.gym.has(id) : !done.run.has(id)) {
      return { kind: isGym ? "gym" : "run", id, continue: false, done: false, weekComplete: false };
    }
  }
  if (!done.run.has("lar")) return { kind: "run", id: "lar", continue: false, done: false, weekComplete: false };
  return { kind: "gym", id: "A", continue: false, done: true, weekComplete: true };
}

function lastGym(hist, day, timeZone) {
  const sessions = work(hist, timeZone);
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].day === day) return dateKey(sessions[i].date, timeZone);
  }
  return "";
}

function lastSlot(runs, assign, slot, timeZone) {
  const list = runList(runs).filter((r) => assign && assign[String(r.id)] === slot);
  if (!list.length) return "";
  return dateKey(list[list.length - 1].date, timeZone);
}

export function lineaHoy({ target, hist, runs, assign, ret, runSug, today, timeZone }) {
  if (!target) return "";
  if (target.continue) return "La sesión sigue abierta.";
  if (target.weekComplete) return "Los entrenos de la semana ya están.";
  if (target.done) return "Esta ya está hecha en la semana.";
  if (target.kind === "gym" && ret && ret.active && ret.program) {
    const chip = chipModel(ret);
    if (chip) {
      const anchor = dateKey(ret.anchor || ret.baselineDate, timeZone);
      const trained = anchor && work(hist, timeZone).some((s) => dateKey(s.date, timeZone) >= anchor);
      if (trained) return "Semana " + chip.week + " de " + chip.weeks + " del regreso, vas bien.";
      return "Semana " + chip.week + " de " + chip.weeks + " del regreso. Hoy al " + chip.pct + "%.";
    }
  }
  if (target.kind === "run" && runSug && Number(runSug.minutes) > 0) {
    return "Regreso del trote · cerca de " + runSug.minutes + " min.";
  }
  const todayK = dateKey(today, timeZone);
  const last = target.kind === "gym" ? lastGym(hist, target.id, timeZone) : lastSlot(runs, assign, target.id, timeZone);
  if (last && todayK) {
    const n = daysBetween(last, todayK, timeZone);
    if (n > 0) return "La última fue hace " + n + (n === 1 ? " día." : " días.");
  }
  if (target.kind === "run") return "Todavía no hay un trote guardado en este hueco.";
  return "Todavía no hay una sesión guardada de este día.";
}

export const REACCIONES = [
  { id: "motiva", label: "me motiva" },
  { id: "gusta", label: "me gusta" },
  { id: "no", label: "no me aporta" },
];

/* Una opinión por variante y día civil. «x» es cerrar sin opinar: no es una reacción. */
export function reaccionVisible(store, variante, today, timeZone) {
  const day = dateKey(today, timeZone);
  if (!day || !variante) return false;
  const bag = store && store[day];
  return !(bag && bag[variante]);
}

export function markReaccion(store, variante, today, value, timeZone) {
  const day = dateKey(today, timeZone);
  const next = { ...(store || {}) };
  if (!day || !variante) return next;
  const keep = Object.keys(next).sort().slice(-21);
  const trimmed = {};
  keep.forEach((k) => { trimmed[k] = next[k]; });
  trimmed[day] = { ...(trimmed[day] || {}), [variante]: value };
  return trimmed;
}

export function chipDoneMap(hist, runs, assign, today, timeZone) {
  const done = slotDone(hist, runs, assign, weekMonday(today, timeZone), timeZone);
  return {
    A: done.gym.has("A"), B: done.gym.has("B"), C: done.gym.has("C"),
    res: done.run.has("res"), pot: done.run.has("pot"), lar: done.run.has("lar"),
  };
}
