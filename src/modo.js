/* Modo del día al empezar Gym: Relajado / Normal / Espartano.
   Se guarda en session.energy. Nunca agrega ejercicios ni sube peso:
   solo elige, ordena y recorta lo que ya tiene el día. Mínimo 40 min. */

export const MODOS = ["relajado", "normal", "espartano"];
export const MODO_INFO = {
  relajado: { n: "Relajado", min: 40, sub: "~40 min · 2 series · deja ~3 reps de sobra", rir: "Deja ~3 reps de sobra en cada serie" },
  normal: { n: "Normal", min: 48, sub: "~45-50 min · 3 series · deja 1-2 reps de sobra", rir: "Deja 1-2 reps de sobra en cada serie" },
  espartano: { n: "Espartano", min: 60, sub: "~60 min · el día completo", rir: "El día completo, con buena técnica" },
};
export const isModo = (e) => MODOS.includes(e);

/* Grupo muscular de cada sección (por índice de secs en DAYS). */
export const SEC_GROUPS = {
  A: ["pecho", "hombros", "pecho", "triceps", "pecho"],
  B: ["espalda", "espalda", "espalda", "biceps", "core"],
  C: ["piernas", "piernas", "gluteo", "pantorrilla", "core"],
};

/* Relajado: principales en máquina/cable/apoyados, en pares, 2 series, 1 de abdomen/core si el día lo trae. */
export const RELAJADO = {
  A: { pares: [["a1", "a3"], ["a2", "a5"], ["a9", "a4"], ["a7", "a10"]], max: 2 },
  B: { pares: [["b1", "b6"], ["b2", "b7"], ["b4", "b10"], ["b8", "b9"]], max: 2 },
  C: { pares: [["c1", "c2"], ["c3", "c4"], ["c5", "c6"], ["c8", "c12"]], max: 2 },
};
/* Normal: día completo con tope de 3 series, sin 1-2 accesorios. */
export const NORMAL_FUERA = { A: ["a4", "a11"], B: ["b5", "b11"], C: ["c11", "c10", "c9"] };
const PAIR_LABEL = { pecho: "Pecho", hombros: "Hombro", triceps: "Tríceps", espalda: "Espalda", biceps: "Bíceps", core: "Core", piernas: "Pierna", gluteo: "Glúteo", pantorrilla: "Pantorrilla" };

export function groupOfEx(dayId, day, exId) {
  const gs = SEC_GROUPS[dayId] || [];
  const i = (day.secs || []).findIndex((s) => s.ids.includes(exId));
  return i >= 0 ? gs[i] : null;
}

/* Lunes local como inicio de semana. */
export function weekStart(now = new Date()) {
  const d = new Date(now); d.setHours(0, 0, 0, 0);
  const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd);
  return d;
}

/* Series hechas por grupo esta semana, sobre todos los días. */
export function weeklyGroupSets(hist, days, now = new Date()) {
  const from = weekStart(now).getTime();
  const out = {};
  (hist || []).forEach((s) => {
    if (!s || !s.logs || !days[s.day] || new Date(s.date).getTime() < from) return;
    Object.entries(s.logs).forEach(([id, l]) => {
      const g = groupOfEx(s.day, days[s.day], id);
      if (!g) return;
      const sets = Array.isArray(l) ? l : (l && l.sets) || [];
      out[g] = (out[g] || 0) + sets.filter((x) => x && x.done).length;
    });
  });
  return out;
}

/* Grupos del día con menos de 4 series esta semana, solo si ya se entrenó algo esta semana
   (si no, el orden normal del día ya es el correcto). */
export function priorityGroups(hist, days, dayId, now = new Date()) {
  const w = weeklyGroupSets(hist, days, now);
  const any = Object.values(w).some((n) => n > 0);
  if (!any) return [];
  const gs = [...new Set(SEC_GROUPS[dayId] || [])];
  const low = gs.filter((g) => (w[g] || 0) < 4);
  return low.length === gs.length ? [] : low;
}

/* Preselección: el último modo elegido; tras 2 Relajados seguidos, Normal. */
export function preselectModo(hist) {
  const modos = (hist || []).map((s) => s && s.energy).filter(isModo);
  if (!modos.length) return "normal";
  const last = modos[modos.length - 1];
  if (last === "relajado" && modos.length >= 2 && modos[modos.length - 2] === "relajado") return "normal";
  return last;
}

const exSets = (ex) => ex.nSets || (ex.prev && ex.prev.length) || 3;

/* Día ajustado al modo: mismos ids y ejercicios del catálogo, nunca nuevos. */
export function dayForModo(day, dayId, modo, prio = []) {
  if (!day) return day;
  const byId = Object.fromEntries(day.ex.map((e) => [e.id, e]));
  let secs; let ex;
  if (modo === "relajado" && RELAJADO[dayId]) {
    const r = RELAJADO[dayId];
    const pares = r.pares.map((p) => p.filter((id) => byId[id]));
    secs = pares.filter((p) => p.length).map((ids, i) => {
      const gs = [...new Set(ids.map((id) => groupOfEx(dayId, day, id)))];
      return { t: `Par ${i + 1} · ${gs.map((g) => PAIR_LABEL[g] || g).join(" + ")}`, note: ids.length > 1 ? "Alterna una serie de cada uno, sin prisa: ~1 min entre series" : "", ids, g: gs };
    });
    ex = secs.flatMap((s) => s.ids).map((id) => ({ ...byId[id], maxSets: r.max }));
  } else if (modo === "normal") {
    const out = new Set(NORMAL_FUERA[dayId] || []);
    secs = day.secs.map((s, i) => ({ ...s, ids: s.ids.filter((id) => !out.has(id)), g: [(SEC_GROUPS[dayId] || [])[i]] })).filter((s) => s.ids.length);
    ex = day.ex.filter((e) => !out.has(e.id)).map((e) => ({ ...e, maxSets: 3 }));
  } else {
    secs = day.secs.map((s, i) => ({ ...s, g: [(SEC_GROUPS[dayId] || [])[i]] }));
    ex = day.ex;
  }
  if (prio.length) {
    const first = secs.filter((s) => s.g.some((g) => prio.includes(g)));
    const rest = secs.filter((s) => !first.includes(s));
    if (first.length && rest.length) secs = [...first.map((s) => ({ ...s, note: s.note ? s.note : "Va primero: esta semana lleva menos de 4 series" })), ...rest];
  }
  const order = secs.flatMap((s) => s.ids);
  ex = order.map((id) => ex.find((e) => e.id === id)).filter(Boolean);
  return { ...day, secs, ex, modo: isModo(modo) ? modo : null };
}

export function capSets(plan, ex) {
  if (!Array.isArray(plan) || !ex || !ex.maxSets) return plan;
  return plan.slice(0, ex.maxSets);
}

/* Minutos estimados, calibrados con sus sesiones reales (Push 24 series en 42 min):
   4 min de calentamiento, 0.5 min de cambio por ejercicio y 1.5 min por serie (trabajo + descanso).
   Relajado: descanso tranquilo (~2 min por serie con el par alternado), por eso 2 series
   de 8 ejercicios llegan a ~40 min sin recortar grupos. */
export function estimateMin(day) {
  const byId = Object.fromEntries(day.ex.map((e) => [e.id, e]));
  const n = (e) => Math.min(exSets(e), e.maxSets || 99);
  let t = 4;
  day.secs.forEach((s) => {
    const es = s.ids.map((id) => byId[id]).filter(Boolean);
    t += 0.5 * es.length;
    es.forEach((e) => { t += n(e) * (e.warm ? 0.75 : day.modo === "relajado" ? 2 : 1.5); });
  });
  return Math.round(t);
}

export function modoSeries(day) {
  return day.ex.reduce((a, e) => a + Math.min(exSets(e), e.maxSets || 99), 0);
}
