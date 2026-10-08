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

export function dateKey(value) {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
  const s = String(value == null ? "" : value);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) return dateKey(dt);
  return "";
}

export function daysBetween(a, b) {
  const ak = dateKey(a);
  const bk = dateKey(b);
  if (!ak || !bk) return 0;
  const ap = ak.split("-").map(Number);
  const bp = bk.split("-").map(Number);
  const ua = Date.UTC(ap[0], ap[1] - 1, ap[2]);
  const ub = Date.UTC(bp[0], bp[1] - 1, bp[2]);
  return Math.round((ub - ua) / 86400000);
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

function workSessions(hist) {
  return (hist || []).filter(sessionHasWork).slice().sort((a, b) => {
    const da = dateKey(a.date);
    const db = dateKey(b.date);
    if (da < db) return -1;
    if (da > db) return 1;
    return 0;
  });
}

/**
 * Estado del regreso a partir del historial y de "hoy" (YYYY-MM-DD o Date).
 * No muta hist.
 */
export function analyzeReturn(hist, today) {
  const sessions = workSessions(hist);
  const todayK = dateKey(today);
  if (!sessions.length || !todayK) return { active: false };

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
    const d = dateKey(s.date);
    if (prevDate == null) {
      lastFullDate = d;
      prevDate = d;
      return;
    }
    const gap = daysBetween(prevDate, d);
    if (phase) {
      const week = Math.floor(daysBetween(phase.anchor, d) / 7) + 1;
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
    const week = Math.floor(daysBetween(phase.anchor, todayK) / 7) + 1;
    if (week <= phase.program.weeks) {
      return {
        active: true,
        pending: false,
        gapDays: phase.gapDays,
        anchor: phase.anchor,
        week,
        program: phase.program,
        baselineDate: phase.baselineDate,
      };
    }
    phase = null;
  }

  const gapToToday = daysBetween(prevDate, todayK);
  if (gapToToday >= 14) {
    return {
      active: true,
      pending: true,
      gapDays: gapToToday,
      anchor: null,
      week: 1,
      program: returnProgram(gapToToday),
      baselineDate: lastFullDate,
    };
  }
  return { active: false };
}

export function baselineSets(hist, exId, v, baselineDate) {
  const cut = dateKey(baselineDate);
  if (!cut) return null;
  const sessions = workSessions(hist).filter((s) => dateKey(s.date) <= cut);
  for (let i = sessions.length - 1; i >= 0; i--) {
    const sets = doneSetsOf(sessions[i], exId, v);
    if (sets.length) return sets.map((s) => ({ w: s.w, r: s.r }));
  }
  return null;
}

export function easyReturnCount(hist, ex, v, anchor) {
  const a = dateKey(anchor);
  if (!a || !ex) return 0;
  const hi = ex.rng && ex.rng.length > 1 ? ex.rng[1] : Infinity;
  let n = 0;
  workSessions(hist).forEach((s) => {
    if (dateKey(s.date) < a) return;
    const sets = doneSetsOf(s, ex.id, v);
    if (!sets.length) return;
    const easy = sets.every((set) => set.r >= hi && set.f !== false);
    if (easy) n += 1;
  });
  return n;
}

export function weekForExercise(ret, hist, ex, v) {
  if (!ret || !ret.active || !ret.program) return 1;
  const skip = ret.skip || 0;
  const easy = ret.anchor ? easyReturnCount(hist, ex, v, ret.anchor) : 0;
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

export function buildReturnPlan(hist, ex, v, ret) {
  if (!ret || !ret.active || !ex) return null;
  const base = baselineSets(hist, ex.id, v, ret.baselineDate);
  if (!base || !base.length) return null;
  const week = weekForExercise(ret, hist, ex, v);
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
    return { active: false, dismissed: true, episodeId: id, baselineDate: ret.baselineDate, program: ret.program, gapDays: ret.gapDays };
  }
  return { ...ret, episodeId: id, skip };
}

export function chipModel(ret) {
  if (!ret || !ret.active || !ret.program) return null;
  const week = Math.min(ret.program.weeks, Math.max(1, (ret.week || 1) + (ret.skip || 0)));
  const level = levelAt(ret.program, week);
  return {
    week,
    weeks: ret.program.weeks,
    pct: level.pct,
    label: "Regreso · semana " + week + " de " + ret.program.weeks + " · " + level.pct + "%",
    canSkip: week < ret.program.weeks,
    episodeId: ret.episodeId || episodeId(ret),
  };
}

export function dismissEpisode(ui, id) {
  const base = ui || {};
  return { dismissed: { ...(base.dismissed || {}), [id]: true }, skip: { ...(base.skip || {}) } };
}

export function skipEpisode(ui, id) {
  const base = ui || {};
  const skip = { ...(base.skip || {}) };
  skip[id] = (skip[id] || 0) + 1;
  return { dismissed: { ...(base.dismissed || {}) }, skip };
}

function realRuns(runs) {
  return (runs || [])
    .filter((r) => r && Number(r.min) > 0 && dateKey(r.date))
    .map((r) => ({ date: dateKey(r.date), min: Math.round(Number(r.min)) }))
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
export function suggestRunReturn(runs, today) {
  const list = realRuns(runs);
  const todayK = dateKey(today);
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
    const gap = daysBetween(prevDate, run.date);
    if (phase) {
      const week = Math.floor(daysBetween(phase.anchor, run.date) / 7) + 1;
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
    const week = Math.floor(daysBetween(phase.anchor, todayK) / 7) + 1;
    const needed = weeksUntilRunBaseline(phase.baselineMin);
    if (week <= needed) {
      return {
        minutes: runMinutesFor(phase.baselineMin, week),
        fromMin: phase.baselineMin,
        fromDate: phase.fromDate,
        week,
        gapDays: daysBetween(phase.fromDate, phase.anchor),
        replacesPlan: false,
      };
    }
  }

  const gapToToday = daysBetween(prevDate, todayK);
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
