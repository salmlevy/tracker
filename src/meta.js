/* Meta de 4 sesiones por semana, en un bloque de 4 semanas hasta el 14 nov 2026. */
import { dateKey, daysBetween, sesionesReales } from "./regreso.js";
import { weekMonday } from "./logros.js";

export const META_SESIONES = 4;
export const META_HASTA = "2026-11-14";
export const META_HASTA_TEXTO = "14 nov";
export const BLOQUE_SEMANAS = 4;
export const PORQUES = [
  "Quiero entrenar para estar en el mejor estado físico de mi vida",
  "para tener energía para cuando tenga hijos en el futuro",
  "para mantener mi mente sana, crear disciplina y sentirme increíble",
];
export const LINEA_DOS = "Hoy toca para no faltar dos seguidas";

const DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function addDays(k, n) {
  const p = String(k || "").split("-").map(Number);
  if (p.length < 3 || p.some((x) => !Number.isFinite(x))) return "";
  const u = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
  const m = String(u.getUTCMonth() + 1).padStart(2, "0");
  const d = String(u.getUTCDate()).padStart(2, "0");
  return u.getUTCFullYear() + "-" + m + "-" + d;
}

function weekdayIndex(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function inicioBloque(hasta = META_HASTA) {
  const lunesFin = weekMonday(hasta);
  if (!lunesFin) return "";
  return addDays(lunesFin, -7 * (BLOQUE_SEMANAS - 1));
}

export function semanaBloque(today, timeZone) {
  const k = dateKey(today, timeZone);
  const lunes = weekMonday(k, timeZone);
  const start = inicioBloque();
  if (!lunes || !start) return 1;
  const n = Math.floor(daysBetween(start, lunes, timeZone) / 7) + 1;
  if (n < 1) return 1;
  if (n > BLOQUE_SEMANAS) return BLOQUE_SEMANAS;
  return n;
}

export function porSemana(sesiones) {
  const map = {};
  (sesiones || []).forEach((s) => {
    const m = weekMonday(s.date);
    if (!m) return;
    map[m] = (map[m] || 0) + 1;
  });
  return map;
}

/* La semana en curso no corta la racha mientras todavía puede cumplirse. */
export function rachaSemanas(mapa, lunesHoy) {
  if (!lunesHoy) return 0;
  let cursor = (mapa[lunesHoy] || 0) >= META_SESIONES ? lunesHoy : addDays(lunesHoy, -7);
  let n = 0;
  while (cursor && (mapa[cursor] || 0) >= META_SESIONES && n < 52) {
    n += 1;
    cursor = addDays(cursor, -7);
  }
  return n;
}

export function circulosSemana(sesiones, lunes, meta = META_SESIONES) {
  const list = (sesiones || []).filter((s) => weekMonday(s.date) === lunes);
  const out = [];
  for (let i = 0; i < meta; i++) {
    const s = list[i];
    out.push(s ? { lleno: true, dia: DIA[weekdayIndex(s.date)] || "" } : { lleno: false, dia: "" });
  }
  return out;
}

export function lineaMeta(model, index) {
  if (model && model.faltoAyer) return LINEA_DOS;
  const i = Math.abs(Number(index) || 0) % PORQUES.length;
  return PORQUES[i];
}

export function metaSemanal(hist, runs, today, timeZone) {
  const todayK = dateKey(today, timeZone) || dateKey(new Date(), timeZone);
  const sesiones = sesionesReales(hist, runs, timeZone).filter((s) => s.date && s.date <= todayK);
  const lunes = weekMonday(todayK, timeZone);
  const deSemana = sesiones.filter((s) => weekMonday(s.date) === lunes);
  const hechas = deSemana.length;
  const ayer = addDays(todayK, -1);
  const huboAntes = sesiones.some((s) => s.date < todayK);
  const ayerHay = sesiones.some((s) => s.date === ayer);
  const hoyHay = sesiones.some((s) => s.date === todayK);
  const mapa = porSemana(sesiones);
  const mostradas = Math.min(hechas, META_SESIONES);
  return {
    hechas,
    mostradas,
    meta: META_SESIONES,
    circulos: circulosSemana(sesiones, lunes),
    extra: hechas > META_SESIONES,
    cumplida: hechas >= META_SESIONES,
    semana: semanaBloque(todayK, timeZone),
    semanas: BLOQUE_SEMANAS,
    hasta: META_HASTA_TEXTO,
    racha: rachaSemanas(mapa, lunes),
    faltoAyer: huboAntes && !ayerHay && !hoyHay,
    hoyHay,
  };
}

export function textoRacha(n) {
  const x = Number(n) || 0;
  return "Racha de " + x + (x === 1 ? " semana" : " semanas");
}

export function textoSemana(model) {
  return "Semana " + model.semana + " de " + model.semanas + " rumbo al " + model.hasta;
}
