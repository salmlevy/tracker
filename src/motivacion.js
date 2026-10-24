/* Little wins mira hacia adelante: 1 a 3 metas de hoy, con números del historial.
   Sin decisión de hoy, solo una línea de la semana. Regreso sin culpa se queda. */
import { doneSetsOf } from "./regreso.js";

export const TEXTO_WINS = "Metas chicas para hoy, con tus números.";
export const TEXTO_REGRESO = "Si faltaste, la siguiente sesión cuenta igual, sin compensar.";

const QUE = {
  lar: "tu último largo",
  pot: "tu última potencia",
  res: "tu última resistencia",
  lib: "tu último libre",
};

function num(n) {
  const x = Math.round(Number(n) * 10) / 10;
  if (!Number.isFinite(x)) return "";
  return Number.isInteger(x) ? String(x) : String(x);
}

function unidad(ex) {
  return ex && ex.u === "kg" ? "kg" : "lb";
}

function planCount(ex) {
  if (!ex) return 0;
  if (Number(ex.nSets) > 0) return Number(ex.nSets);
  return Array.isArray(ex.prev) ? ex.prev.length : 0;
}

function ultimaSesion(hist, day) {
  const list = (hist || []).filter((s) => s && s.day === day && s.logs);
  if (!list.length) return null;
  return list.slice().sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))).pop();
}

function setsBuenos(session, exId) {
  return doneSetsOf(session, exId, "main").filter((s) => s && s.f !== false);
}

/* El peso de la serie más pesada que sí hizo, en la variante principal. */
function pesoHecho(session, ex) {
  const sets = setsBuenos(session, ex.id).filter((s) => s.w > 0);
  if (!sets.length) return 0;
  return sets.reduce((m, s) => (s.w > m ? s.w : m), 0);
}

function ayudaHecha(session, ex) {
  const sets = setsBuenos(session, ex.id).filter((s) => s.r > 0);
  if (!sets.length) return null;
  return sets.reduce((m, s) => (s.w < m ? s.w : m), sets[0].w);
}

export function textoSemanaMas(hechas, meta = 4) {
  const h = Number(hechas) || 0;
  const m = Number(meta) || 4;
  if (h >= m) return "";
  return "Una sesión más esta semana te deja en " + (h + 1) + "/" + m + ".";
}

export function metaCarga(ex, session) {
  if (!ex || !session) return "";
  const step = Number(ex.step);
  if (!(step > 0)) return "";
  if (ex.type === "body" || ex.type === "time") return "";
  if (ex.type === "assist") {
    const ayuda = ayudaHecha(session, ex);
    if (ayuda == null || !(ayuda > 0)) return "";
    const llega = Math.round((ayuda - step) * 10) / 10;
    if (llega < 0) return "";
    const nombre = ex.n;
    if (llega === 0) return "Baja " + num(step) + " kg de ayuda en " + nombre + ": hoy sin ayuda.";
    return "Baja " + num(step) + " kg de ayuda en " + nombre + ": llega a " + num(llega) + " kg.";
  }
  const peso = pesoHecho(session, ex);
  if (!(peso > 0)) return "";
  const llega = Math.round((peso + step) * 10) / 10;
  const u = unidad(ex);
  return "Sube " + num(step) + " " + u + " en " + ex.n + ": llega a " + num(llega) + " " + u + ".";
}

export function metaSeries(ex) {
  if (!ex || !ex.n) return "";
  if (!(planCount(ex) > 0)) return "";
  return "Completa todas las series de " + ex.n + ".";
}

function mejorCarga(ejercicios, session, skipId) {
  const hits = [];
  (ejercicios || []).forEach((ex, i) => {
    if (skipId && ex.id === skipId) return;
    const line = metaCarga(ex, session);
    if (!line) return;
    hits.push({ ex, line, step: Number(ex.step), i });
  });
  hits.sort((a, b) => a.step - b.step || a.i - b.i);
  return hits[0] || null;
}

function parcialDe(ejercicios, session) {
  if (!session) return null;
  return (ejercicios || []).find((ex) => {
    const plan = planCount(ex);
    if (!(plan > 0)) return false;
    const n = setsBuenos(session, ex.id).length;
    return n > 0 && n < plan;
  }) || null;
}

function ejercicioSeries(ejercicios, session, skipId) {
  const list = (ejercicios || []).filter((ex) => ex && ex.id !== skipId && planCount(ex) > 0);
  const parcial = list.find((ex) => {
    if (!session) return false;
    const n = setsBuenos(session, ex.id).length;
    const plan = planCount(ex);
    return n > 0 && n < plan;
  });
  return parcial || list[0] || null;
}

function slotDe(run, assign) {
  if (!run) return "";
  const a = assign && assign[String(run.id)];
  if (a) return a;
  return run.tipo || "";
}

export function metaCorrida(runs, assign, slot) {
  const que = QUE[slot];
  if (!que) return "";
  const list = (runs || []).filter((r) => r && Number(r.min) > 0 && slotDe(r, assign) === slot);
  if (!list.length) return "";
  const last = list.slice().sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))).pop();
  const min = Math.round(Number(last.min));
  if (!(min > 0)) return "";
  return "Corre un poco más que " + que + ": llega a " + (min + 1) + " min.";
}

/* decidido: hay un entreno concreto (lo que toca, o lo que eligió).
   Si no, una sola línea de la semana. */
export function metasHoy({ decidido, kind, id, ejercicios, hist, runs, assign, hechas, meta }) {
  const semana = textoSemanaMas(hechas, meta);
  if (!decidido) return semana ? [semana] : [];
  const out = [];
  if (kind === "run") {
    const linea = metaCorrida(runs, assign, id);
    if (linea) out.push(linea);
  } else if (kind === "gym") {
    const sesion = ultimaSesion(hist, id);
    const parcial = parcialDe(ejercicios, sesion);
    let carga = mejorCarga(ejercicios, sesion, parcial ? parcial.id : "");
    if (!carga) carga = mejorCarga(ejercicios, sesion, "");
    if (carga) out.push(carga.line);
    const seriesEx = parcial && (!carga || parcial.id !== carga.ex.id)
      ? parcial
      : ejercicioSeries(ejercicios, sesion, carga ? carga.ex.id : "");
    const series = metaSeries(seriesEx);
    if (series) out.push(series);
  }
  if (semana && out.length < 3) out.push(semana);
  return out.slice(0, 3);
}

export function partesMotivacion(hist, runs, volver) {
  const conWins = (hist || []).filter((s) => s && Array.isArray(s.wins) && s.wins.length);
  const last = conWins.length ? conWins[conWins.length - 1] : null;
  let regreso = "";
  const winRegreso = last && last.wins.find((w) => w && w.tipo === "regreso" && w.texto);
  if (volver && volver.pendiente && !volver.hoyHay) {
    regreso = "La siguiente sesión cuenta igual, sin compensar.";
  } else if (winRegreso) {
    regreso = winRegreso.texto;
  } else if (volver && volver.total > 0) {
    regreso = "Llevas " + volver.total + " regresos. Cada uno contó igual.";
  }
  return { regreso };
}
