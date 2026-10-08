/**
 * Modo regreso: hueco entre Gyms, nivel, porcentaje y redondeo.
 * No toca el historial. La UI solo lee estas funciones.
 *
 * Cortes (días desde la última sesión de Gym con series hechas):
 *   < 14        nada
 *   14–26       2 semanas: 85% → 100%
 *   27–55       3 semanas: 80% / 90% / 100%
 *   56+         4 semanas: 70% / 80% / 90% / 100%
 *
 * 27 días entra en las 3 semanas a propósito. 10 sep → 7 oct son 27 días,
 * casi 4 semanas: ahí se pierde ~6–9% de fuerza y se recupera en cerca de
 * la mitad del tiempo fuera. El tramo de 2 semanas queda para parones de
 * 2–3 semanas (14–26 días), donde alcanza con 85%.
 *
 * Las semanas cuentan desde la primera sesión después del hueco.
 * El peso base es el último trabajo real ANTES del hueco (una sesión de
 * regreso no se usa como base: si se corta a la mitad, se recalcula el
 * plan sin encadenar porcentajes).
 */

/* YYYY-MM-DD pelado se queda. Un instante con zona (…Z o ±hh:mm) pasa al día local.
   Una fecha sin zona ("2026-09-10T18:30:00") conserva el día escrito: así no se
   mueven las pruebas ni los registros que ya traen el día civil. */
const DATE_ONLY = /^(\d{4}-\d{2}-\d{2})$/;
const NAIVE_DT = /^(\d{4}-\d{2}-\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/;
const HAS_ZONE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

function ymdInZone(date, timeZone) {
  if (!timeZone) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const bag = {};
  parts.forEach((p) => { bag[p.type] = p.value; });
  if (!bag.year || !bag.month || !bag.day) return "";
  return bag.year + "-" + bag.month + "-" + bag.day;
}

export function dateKey(value, timeZone) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return ymdInZone(value, timeZone);
  }
  const s = String(value == null ? "" : value).trim();
  if (!s) return "";
  if (DATE_ONLY.test(s)) return s;
  if (HAS_ZONE.test(s)) {
    const dt = new Date(s);
    if (!Number.isNaN(dt.getTime())) return ymdInZone(dt, timeZone);
  } else if (NAIVE_DT.test(s)) return s.slice(0, 10);
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) return ymdInZone(dt, timeZone);
  return "";
}

export function daysBetween(a, b, timeZone) {
  const ak = dateKey(a, timeZone);
  const bk = dateKey(b, timeZone);
  if (!ak || !bk) return 0;
  const ap = ak.split("-").map(Number);
  const bp = bk.split("-").map(Number);
  const ua = Date.UTC(ap[0], ap[1] - 1, ap[2]);
  const ub = Date.UTC(bp[0], bp[1] - 1, bp[2]);
  return Math.round((ub - ua) / 86400000);
}

/* Semana 1 es la primera. Un ancla "mañana" en UTC (sesión nocturna) no puede dar 0. */
export function weekIndex(anchor, day, timeZone) {
  const n = Math.floor(daysBetween(anchor, day, timeZone) / 7) + 1;
  return n >= 1 ? n : 1;
}

export function roundToStep(x, step) {
  const s = step || 1;
  if (!Number.isFinite(Number(x))) return 0;
  return Math.max(0, Math.round(Number(x) / s) * s);
}

/* 14–26: 2 sem.  27–55: 3 sem (incluye 10 sep → 7 oct).  56+: 4 sem. */
export function returnProgram(gapDays) {
  const g = Number(gapDays);
  if (!(g >= 14)) return null;
  if (g <= 26) {
    return {
      weeks: 2,
      levels: [
        { pct: 85, dropSet: false, rir: 0 },
        { pct: 100, dropSet: false, rir: 0 },
      ],
    };
  }
  if (g <= 55) {
    return {
      weeks: 3,
      levels: [
        { pct: 80, dropSet: true, rir: 3 },
        { pct: 90, dropSet: false, rir: 2 },
        { pct: 100, dropSet: false, rir: 0 },
      ],
    };
  }
  return {
    weeks: 4,
    levels: [
      { pct: 70, dropSet: true, rir: 3 },
      { pct: 80, dropSet: false, rir: 2 },
      { pct: 90, dropSet: false, rir: 1 },
      { pct: 100, dropSet: false, rir: 0 },
    ],
  };
}

export function levelAt(program, week) {
  if (!program || !program.levels || !program.levels.length) return null;
  const i = Math.min(program.levels.length, Math.max(1, week || 1)) - 1;
  return program.levels[i];
}

/* Más asistencia = más fácil. 70% → +2 steps; 80–85% → +1; 90% y 100% → 0. */
export function assistStepsForPct(pct) {
  const p = Number(pct);
  if (!(p < 100)) return 0;
  if (p <= 75) return 2;
  if (p < 90) return 1;
  return 0;
}

function asLog(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return { v: "main", sets: raw };
  if (typeof raw !== "object") return null;
  return raw;
}

function wantAlt(v) {
  return v === "alt";
}

export function doneSetsOf(session, exId, v) {
  if (!session || !session.logs) return [];
  const log = asLog(session.logs[exId]);
  if (!log) return [];
  const isAlt = log.v === "alt";
  if (isAlt !== wantAlt(v)) return [];
  return (log.sets || [])
    .filter((s) => s && s.done && ((Number(s.w) || 0) > 0 || (Number(s.r) || 0) > 0))
    .map((s) => ({ w: Number(s.w) || 0, r: Number(s.r) || 0, f: s.f }));
}

export function sessionHasWork(session) {
  if (!session || !session.logs || typeof session.logs !== "object") return false;
  const ids = Object.keys(session.logs);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (id === "_extras") {
      const extras = session.logs._extras;
      if (!Array.isArray(extras)) continue;
      const hit = extras.some((it) => (it && it.sets || []).some((s) => s && s.done));
      if (hit) return true;
      continue;
    }
    if (doneSetsOf(session, id, "main").length || doneSetsOf(session, id, "alt").length) return true;
  }
  return false;
}

function workSessions(hist, timeZone) {
  return (hist || []).filter(sessionHasWork).slice().sort((a, b) => {
    const da = dateKey(a.date, timeZone);
    const db = dateKey(b.date, timeZone);
    if (da < db) return -1;
    if (da > db) return 1;
    return 0;
  });
}

/**
 * Estado del regreso a partir del historial y de "hoy" (YYYY-MM-DD o Date).
 * No muta hist.
 */
export function analyzeReturn(hist, today, timeZone) {
  const sessions = workSessions(hist, timeZone);
  const todayK = dateKey(today, timeZone);
  if (!sessions.length || !todayK) return { active: false, timeZone: timeZone || "" };

  let lastFullDate = null;
  let phase = null;
  let prevDate = null;

  const openReturn = (gap, anchor) => {
    phase = {
      gapDays: gap,
      anchor,
      program: returnProgram(gap),
      baselineDate: lastFullDate,
    };
  };

  sessions.forEach((s) => {
    const d = dateKey(s.date, timeZone);
    if (prevDate == null) {
      lastFullDate = d;
      prevDate = d;
      return;
    }
    const gap = daysBetween(prevDate, d, timeZone);
    if (phase) {
      const week = weekIndex(phase.anchor, d, timeZone);
      if (week > phase.program.weeks) {
        /* El plan ya venció. Si el hueco sigue siendo largo, arranca otro. */
        if (gap >= 14) openReturn(gap, d);
        else {
          phase = null;
          lastFullDate = d;
        }
      } else if (week >= phase.program.weeks) {
        /* Semana al 100%: ya es trabajo real para un hueco futuro. */
        lastFullDate = d;
      }
    } else if (gap >= 14) {
      openReturn(gap, d);
    } else {
      lastFullDate = d;
    }
    prevDate = d;
  });

  if (phase) {
    const week = weekIndex(phase.anchor, todayK, timeZone);
    if (week <= phase.program.weeks) {
      return {
        active: true,
        pending: false,
        gapDays: phase.gapDays,
        anchor: phase.anchor,
        week,
        program: phase.program,
        baselineDate: phase.baselineDate,
        timeZone: timeZone || "",
      };
    }
    phase = null;
  }

  const gapToToday = daysBetween(prevDate, todayK, timeZone);
  if (gapToToday >= 14) {
    return {
      active: true,
      pending: true,
      gapDays: gapToToday,
      anchor: null,
      week: 1,
      program: returnProgram(gapToToday),
      baselineDate: lastFullDate,
      timeZone: timeZone || "",
    };
  }
  return { active: false, timeZone: timeZone || "" };
}

export function baselineSets(hist, exId, v, baselineDate, timeZone) {
  const cut = dateKey(baselineDate, timeZone);
  if (!cut) return null;
  const sessions = workSessions(hist, timeZone).filter((s) => dateKey(s.date, timeZone) <= cut);
  for (let i = sessions.length - 1; i >= 0; i--) {
    const sets = doneSetsOf(sessions[i], exId, v);
    if (sets.length) return sets.map((s) => ({ w: s.w, r: s.r }));
  }
  return null;
}

export function easyReturnCount(hist, ex, v, anchor, timeZone) {
  const a = dateKey(anchor, timeZone);
  if (!a || !ex) return 0;
  const hi = ex.rng && ex.rng.length > 1 ? ex.rng[1] : Infinity;
  let n = 0;
  workSessions(hist, timeZone).forEach((s) => {
    if (dateKey(s.date, timeZone) < a) return;
    const sets = doneSetsOf(s, ex.id, v);
    if (!sets.length) return;
    const easy = sets.every((set) => set.r >= hi && set.f !== false);
    if (easy) n += 1;
  });
  return n;
}

export function weekForExercise(ret, hist, ex, v, timeZone) {
  if (!ret || !ret.active || !ret.program) return 1;
  const tz = timeZone || (ret && ret.timeZone) || undefined;
  const skip = ret.skip || 0;
  const easy = ret.anchor ? easyReturnCount(hist, ex, v, ret.anchor, tz) : 0;
  const week = Math.max(ret.week || 1, easy + 1) + skip;
  return Math.min(ret.program.weeks, Math.max(1, week));
}

export function prescribeReturn(rawSets, ex, level, week) {
  const step = (ex && ex.step) || 5;
  let sets = (rawSets || []).map((s) => (Array.isArray(s) ? { w: Number(s[0]) || 0, r: Number(s[1]) || 0 } : { w: Number(s.w) || 0, r: Number(s.r) || 0 }));
  if (!sets.length || !level || !ex) return [];
  const pct = level.pct;
  const rir = level.rir || 0;
  const wk = week || 1;

  if (ex.type === "assist") {
    if (level.dropSet && sets.length > 1) sets = sets.slice(0, -1);
    const bump = assistStepsForPct(pct) * step;
    return sets.map((s) => ({ w: roundToStep(s.w + bump, step), r: Math.max(1, s.r - rir) }));
  }
  if (ex.type === "time") {
    return sets.map((s) => ({ w: 0, r: Math.max(1, Math.round(s.r * pct / 100)) }));
  }
  if (ex.type === "body") {
    if (wk === 1 && sets.length > 1) return sets.slice(0, -1).map((s) => ({ w: 0, r: Math.max(1, s.r) }));
    if (wk === 1) return sets.map((s) => ({ w: 0, r: Math.max(1, Math.round(s.r * 0.8)) }));
    return sets.map((s) => ({ w: 0, r: Math.max(1, s.r) }));
  }
  if (level.dropSet && sets.length > 1) sets = sets.slice(0, -1);
  return sets.map((s) => ({
    w: roundToStep(s.w * pct / 100, step),
    r: Math.max(1, s.r - rir),
  }));
}

export function buildReturnPlan(hist, ex, v, ret, timeZone) {
  if (!ret || !ret.active || !ex) return null;
  const tz = timeZone || (ret && ret.timeZone) || undefined;
  const base = baselineSets(hist, ex.id, v, ret.baselineDate, tz);
  if (!base || !base.length) return null;
  const week = weekForExercise(ret, hist, ex, v, tz);
  const level = levelAt(ret.program, week);
  const sets = prescribeReturn(base, ex, level, week);
  if (!sets.length) return null;
  return { sets, week, level, baseline: base };
}

export function episodeId(ret) {
  if (!ret || !ret.baselineDate || !ret.program) return "";
  return dateKey(ret.baselineDate) + ":" + ret.program.weeks;
}

export function presentReturn(ret, ui) {
  if (!ret || !ret.active) return { active: false };
  const id = episodeId(ret);
  const dismissed = !!(ui && ui.dismissed && ui.dismissed[id]);
  const skip = Math.max(0, Math.round((ui && ui.skip && ui.skip[id]) || 0));
  if (dismissed) {
    return {
      active: false,
      dismissed: true,
      episodeId: id,
      baselineDate: ret.baselineDate,
      program: ret.program,
      gapDays: ret.gapDays,
      anchor: ret.anchor,
      week: ret.week,
      timeZone: ret.timeZone || "",
      source: "auto",
    };
  }
  return { ...ret, episodeId: id, skip, source: ret.source || "auto" };
}

export function chipModel(ret) {
  if (!ret || !ret.active || !ret.program) return null;
  const base = Number(ret.week);
  const week = Math.min(ret.program.weeks, Math.max(1, (base >= 1 ? base : 1) + (ret.skip || 0)));
  const level = levelAt(ret.program, week);
  return {
    week,
    weeks: ret.program.weeks,
    pct: level.pct,
    label: "Regreso · semana " + week + " de " + ret.program.weeks + " · " + level.pct + "%",
    canSkip: week < ret.program.weeks,
    canUndo: (ret.skip || 0) > 0,
    episodeId: ret.episodeId || episodeId(ret),
  };
}

export function bannerModel(ret, ui) {
  const chip = chipModel(ret);
  if (!chip) return null;
  const days = Math.max(0, Math.round(Number(ret.gapDays) || 0));
  const seen = !!(ui && ui.bannerSeen && chip.episodeId && ui.bannerSeen[chip.episodeId]);
  return {
    ...chip,
    collapsed: seen,
    gapDays: days,
    title: "Llevas " + days + " " + (days === 1 ? "día" : "días") + " sin entrenar",
    body: "Hoy toca " + chip.pct + "% · semana " + chip.week + " de " + chip.weeks + ".",
  };
}

function copyUi(ui) {
  const base = ui || {};
  return {
    dismissed: { ...(base.dismissed || {}) },
    skip: { ...(base.skip || {}) },
    manual: { ...(base.manual || {}) },
    bannerSeen: { ...(base.bannerSeen || {}) },
    runHidden: { ...(base.runHidden || {}) },
    prefer: base.prefer || "",
  };
}

export function dismissEpisode(ui, id) {
  const next = copyUi(ui);
  if (id) next.dismissed[id] = true;
  return next;
}

export function skipEpisode(ui, id) {
  const next = copyUi(ui);
  if (id) next.skip[id] = (next.skip[id] || 0) + 1;
  return next;
}

export function unskipEpisode(ui, id) {
  const next = copyUi(ui);
  const cur = Math.max(0, Math.round(next.skip[id] || 0));
  if (cur <= 1) delete next.skip[id];
  else next.skip[id] = cur - 1;
  return next;
}

export function reactivateEpisode(ui, id) {
  const next = copyUi(ui);
  if (id) delete next.dismissed[id];
  return next;
}

export function collapseBanner(ui, id) {
  const next = copyUi(ui);
  if (id) next.bannerSeen[id] = true;
  return next;
}

export function histBeforePause(hist, baselineDate, timeZone) {
  const cut = dateKey(baselineDate, timeZone);
  if (!cut) return (hist || []).slice();
  return (hist || []).filter((s) => {
    const d = dateKey(s && s.date, timeZone);
    return d && d <= cut;
  });
}

/* Con el regreso apagado, el plan normal solo ve sesiones hasta el último Gym de antes de la pausa. */
export function planningHist(hist, ret) {
  if (!ret || !ret.dismissed || !ret.baselineDate) return hist || [];
  return histBeforePause(hist, ret.baselineDate, ret.timeZone);
}

function setScore(w, r) {
  const W = Number(w) || 0;
  const R = Number(r) || 0;
  return W > 0 ? W * (1 + R / 30) : R;
}

/* La pantalla final, en regreso, compara contra el plan del día y no contra la sesión previa a la pausa. */
export function metReturnPlan(doneSets, planSets) {
  const done = (doneSets || []).filter((s) => s && s.done !== false && s.f !== false && ((Number(s.w) || 0) > 0 || (Number(s.r) || 0) > 0));
  const plan = planSets || [];
  if (!done.length || !plan.length) return false;
  const tNow = done.reduce((a, s) => a + setScore(s.w, s.r), 0);
  const tPlan = plan.reduce((a, s) => a + setScore(s.w, s.r), 0);
  return tPlan > 0 && tNow >= tPlan * 0.98;
}

export function gapSinceLastGym(hist, today, timeZone) {
  const sessions = workSessions(hist, timeZone);
  const todayK = dateKey(today, timeZone);
  if (!sessions.length || !todayK) return { gapDays: null, lastDate: null, today: todayK };
  const lastDate = dateKey(sessions[sessions.length - 1].date, timeZone);
  return { gapDays: Math.max(0, daysBetween(lastDate, todayK, timeZone)), lastDate, today: todayK };
}

export function manualProgram(weeks) {
  if (weeks === 2) return returnProgram(14);
  if (weeks === 4) return returnProgram(56);
  return returnProgram(27);
}

export function manualChoices(gapDays) {
  const known = gapDays != null && gapDays !== "" && Number.isFinite(Number(gapDays));
  const g = known ? Number(gapDays) : null;
  const auto = known ? returnProgram(g) : null;
  return {
    gapDays: g,
    calculated: auto ? { weeks: auto.weeks, week: 1, pct: levelAt(auto, 1).pct } : null,
    options: [2, 3, 4].map((weeks) => {
      const program = manualProgram(weeks);
      return { weeks, levels: program.levels.map((l, i) => ({ week: i + 1, pct: l.pct })) };
    }),
  };
}

export function manualEpisodeId(lastDate, weeks) {
  return dateKey(lastDate) + ":" + weeks + ":manual";
}

export function manualBaseline(ret, gap) {
  if (ret && ret.baselineDate) {
    return {
      lastDate: ret.baselineDate,
      gapDays: ret.gapDays != null ? ret.gapDays : (gap && gap.gapDays),
    };
  }
  return { lastDate: gap && gap.lastDate, gapDays: gap && gap.gapDays };
}

export function startManualReturn(ui, spec) {
  const next = copyUi(ui);
  const weeks = spec && (spec.weeks === 2 || spec.weeks === 4) ? spec.weeks : 3;
  const program = manualProgram(weeks);
  const startWeek = Math.min(program.weeks, Math.max(1, Math.round((spec && spec.week) || 1)));
  const lastDate = dateKey(spec && spec.lastDate);
  const anchor = dateKey((spec && spec.today) || lastDate);
  const id = manualEpisodeId(lastDate, weeks);
  next.manual[id] = {
    weeks,
    startWeek,
    baselineDate: lastDate,
    gapDays: spec && spec.gapDays != null ? spec.gapDays : 0,
    anchor,
  };
  delete next.dismissed[id];
  next.prefer = id;
  return next;
}

export function useCalculatedReturn(ui, id) {
  const next = copyUi(ui);
  next.prefer = "";
  if (id) delete next.dismissed[id];
  return next;
}

function manualReturn(rec, id, ui, today, timeZone) {
  if (!rec || !rec.baselineDate) return null;
  const program = manualProgram(rec.weeks);
  const todayK = dateKey(today, timeZone);
  const anchor = dateKey(rec.anchor || rec.baselineDate, timeZone);
  const cal = weekIndex(anchor, todayK, timeZone);
  const skip = Math.max(0, Math.round((ui && ui.skip && ui.skip[id]) || 0));
  const week = (rec.startWeek || 1) + cal - 1;
  if (week > program.weeks) return null;
  return {
    active: true,
    pending: false,
    manual: true,
    source: "manual",
    gapDays: rec.gapDays || 0,
    anchor,
    week: Math.max(1, week),
    program,
    baselineDate: dateKey(rec.baselineDate, timeZone),
    episodeId: id,
    skip,
    timeZone: timeZone || "",
  };
}

export function resolveReturn(hist, today, ui, timeZone) {
  const auto = analyzeReturn(hist, today, timeZone);
  const state = ui || {};
  const prefer = state.prefer || "";
  const rec = prefer && state.manual ? state.manual[prefer] : null;
  if (rec && rec.baselineDate) {
    if (state.dismissed && state.dismissed[prefer]) {
      return {
        active: false,
        dismissed: true,
        episodeId: prefer,
        baselineDate: dateKey(rec.baselineDate, timeZone),
        program: manualProgram(rec.weeks),
        gapDays: rec.gapDays || 0,
        timeZone: timeZone || "",
        source: "manual",
      };
    }
    const built = manualReturn(rec, prefer, state, today, timeZone);
    if (built) return built;
  }
  if (auto.active) return presentReturn(auto, state);
  return { active: false };
}

export function runEpisodeId(sug) {
  if (!sug || !sug.fromDate) return "";
  return sug.fromDate + ":" + sug.fromMin;
}

export function hideRunHint(ui, id) {
  const next = copyUi(ui);
  if (id) next.runHidden[id] = true;
  return next;
}

export function showRunHint(ui, id) {
  const next = copyUi(ui);
  if (id) delete next.runHidden[id];
  return next;
}

export function runHintVisible(sug, ui) {
  const id = runEpisodeId(sug);
  if (!id) return false;
  return !(ui && ui.runHidden && ui.runHidden[id]);
}

function realRuns(runs, timeZone) {
  return (runs || [])
    .filter((r) => r && Number(r.min) > 0 && dateKey(r.date, timeZone))
    .map((r) => ({ date: dateKey(r.date, timeZone), min: Math.round(Number(r.min)) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function runMinutesFor(baselineMin, week) {
  const cap = Math.max(1, Math.round(Number(baselineMin) || 0));
  const base = Math.max(1, Math.round(cap * 2 / 3));
  const w = Math.max(1, week || 1);
  return Math.min(cap, base + (w - 1) * 5);
}

/* Un trote de regreso dura cerca de la sugerencia. Uno distinto (30 min tras un largo de 100) es trabajo real nuevo. */
function isRampDuration(actual, suggested) {
  return actual >= suggested - 8 && actual <= suggested + 5;
}

/**
 * Sugerencia de duración tras 14+ días sin un trote real (min > 0).
 * La base es el último trote real, no un largo más viejo ni un trote de 0 min.
 * No modifica el plan de la nota: replacesPlan es siempre false.
 * Si a la mitad vuelve a haber hueco, se recalcula sobre ese trote real
 * (no sobre el trote corto del regreso).
 */
export function suggestRunReturn(runs, today, timeZone) {
  const list = realRuns(runs, timeZone);
  const todayK = dateKey(today, timeZone);
  if (!list.length || !todayK) return null;

  let fullMin = null;
  let fullDate = null;
  let phase = null;
  let prevDate = null;

  list.forEach((run) => {
    if (prevDate == null) {
      fullMin = run.min;
      fullDate = run.date;
      prevDate = run.date;
      return;
    }
    const gap = daysBetween(prevDate, run.date, timeZone);
    if (phase) {
      const week = weekIndex(phase.anchor, run.date, timeZone);
      const needed = weeksUntilRunBaseline(phase.baselineMin);
      const suggested = runMinutesFor(phase.baselineMin, Math.min(Math.max(week, 1), needed));
      if (run.min >= phase.baselineMin) {
        phase = null;
        fullMin = run.min;
        fullDate = run.date;
      } else if (week <= needed && isRampDuration(run.min, suggested)) {
        /* Sigue el regreso: la base no baja. */
      } else {
        phase = null;
        fullMin = run.min;
        fullDate = run.date;
      }
    } else if (gap >= 14 && isRampDuration(run.min, runMinutesFor(fullMin, 1)) && run.min < fullMin) {
      phase = { baselineMin: fullMin, anchor: run.date, fromDate: fullDate };
    } else {
      fullMin = run.min;
      fullDate = run.date;
    }
    prevDate = run.date;
  });

  if (phase) {
    const week = weekIndex(phase.anchor, todayK, timeZone);
    const needed = weeksUntilRunBaseline(phase.baselineMin);
    if (week <= needed) {
      return {
        minutes: runMinutesFor(phase.baselineMin, week),
        fromMin: phase.baselineMin,
        fromDate: phase.fromDate,
        week,
        gapDays: daysBetween(phase.fromDate, phase.anchor, timeZone),
        replacesPlan: false,
      };
    }
  }

  const gapToToday = daysBetween(prevDate, todayK, timeZone);
  if (gapToToday >= 14) {
    return {
      minutes: runMinutesFor(fullMin, 1),
      fromMin: fullMin,
      fromDate: fullDate,
      week: 1,
      gapDays: gapToToday,
      replacesPlan: false,
    };
  }
  return null;
}

function weeksUntilRunBaseline(baselineMin) {
  const cap = Math.max(1, Math.round(Number(baselineMin) || 0));
  const base = Math.max(1, Math.round(cap * 2 / 3));
  if (base >= cap) return 1;
  return Math.floor((cap - base) / 5) + 1;
}

export function runHintText(sug) {
  if (!sug) return "";
  if ((sug.week || 1) <= 1) return "Regreso · ~" + sug.minutes + " min (2/3 de " + sug.fromMin + ") · la nota manda";
  return "Regreso · ~" + sug.minutes + " min · semana " + sug.week + " · la nota manda";
}
