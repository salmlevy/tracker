/* Pesos que existen en el gym. No reescribe el historial.
   En Navy las mancuernas van de 2 en 2 kg, de 2 a 32.
   El press de hombros sentado (a3) llega a 50 kg.
   Poleas y máquinas sin medir no inventan un escalón: la sugerencia
   se queda en un peso que él ya registró, y nunca por encima del mayor.
   Para sumar un stack, basta una entrada en POLEAS_NAVY. */

import { LB2KG, TECHNOGYM_ID, claveVariante } from "./gyms.js";
import { pesoLeido, setDelGym } from "./historial.js";

export const POLEAS_NAVY = {
  /* a1: { unidad: "kg", min: 5, paso: 5, max: 100 }, */
};

const DB_UNA_MAIN = new Set(["a4", "a5", "b4", "b7", "b8"]);

function red(n) {
  const x = Math.round((Number(n) || 0) * 1000) / 1000;
  return Object.is(x, -0) ? 0 : x;
}

export function aKg(w, u) {
  const n = Number(w) || 0;
  return u === "kg" ? n : n * LB2KG;
}

export function desdeKg(kg, u) {
  const n = Number(kg) || 0;
  return u === "kg" ? n : n / LB2KG;
}

function unidadNativa(ex) {
  return ex && ex.u === "kg" ? "kg" : "lb";
}

function textoVariante(ex, v) {
  const paso = ex && (ex.pasos || []).find((p) => p.id === (v || "main"));
  if (paso) return (paso.n || "") + " " + (paso.lbl || "");
  if (v === "alt" && ex && ex.alt) return (ex.alt.n || "") + " " + (ex.alt.lbl || "");
  return ((ex && ex.n) || "") + " " + ((ex && ex.lbl) || "");
}

export function perfilEquipo(gymId, ex, v) {
  if (!ex || gymId !== TECHNOGYM_ID) return null;
  if (ex.rehab || ex.rehabFixed) return null;
  const tipo = (v === "alt" && ex.alt && ex.alt.type) || ex.type || "";
  if (tipo === "body" || tipo === "time" || tipo === "band" || tipo === "assist") return null;
  if (ex.id === "a3" && v !== "alt") return { tipo: "tope", unidad: "kg", max: 50, id: "a3" };
  const polea = (!v || v === "main") ? POLEAS_NAVY[ex.id] : null;
  if (polea && Number(polea.paso) > 0 && Number(polea.max) > 0) {
    return {
      tipo: "escalera",
      unidad: polea.unidad === "lb" ? "lb" : "kg",
      min: Number(polea.min) > 0 ? Number(polea.min) : Number(polea.paso),
      paso: Number(polea.paso),
      max: Number(polea.max),
      id: ex.id,
    };
  }
  const txt = textoVariante(ex, v);
  const unaMain = (!v || v === "main") && DB_UNA_MAIN.has(ex.id);
  if (/mancuerna|\bdb\b/i.test(txt) || unaMain) {
    if (/total/i.test(txt)) return { tipo: "escalera", unidad: "kg", min: 4, paso: 4, max: 64, id: "mancuernas" };
    return { tipo: "escalera", unidad: "kg", min: 2, paso: 2, max: 32, id: "mancuerna" };
  }
  return { tipo: "registrado", unidad: "kg", id: ex.id };
}

export function mismaCarga(a, b, perfil, u) {
  if (!perfil || perfil.tipo !== "escalera") return a === b;
  const vals = valoresEscalera(perfil);
  if (!vals.length) return a === b;
  return cercanoLista(aKg(a, u), vals) === cercanoLista(aKg(b, u), vals);
}

export function valoresEscalera(perfil) {
  if (!perfil || perfil.tipo !== "escalera") return [];
  const out = [];
  for (let w = perfil.min; w <= perfil.max + 1e-6; w = red(w + perfil.paso)) out.push(red(w));
  return out;
}

function cercanoLista(kg, vals) {
  let best = vals[0];
  let dist = Infinity;
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    const d = Math.abs(v - kg);
    if (d < dist - 1e-6 || (Math.abs(d - dist) <= 1e-6 && v < best)) {
      best = v;
      dist = d;
    }
  }
  return best;
}

function siguienteLista(kg, vals) {
  for (let i = 0; i < vals.length; i++) if (vals[i] > kg + 0.05) return vals[i];
  return vals[vals.length - 1];
}

function anteriorLista(kg, vals) {
  let prev = vals[0];
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] >= kg - 0.05) break;
    prev = vals[i];
  }
  return prev;
}

/* Pesos ya hechos de ese ejercicio, variante y gym. w queda en la unidad nativa. */
export function placasRegistradas(hist, ex, v, gymId, gyms) {
  const uN = unidadNativa(ex);
  const out = [];
  const rows = hist || [];
  for (let i = 0; i < rows.length; i++) {
    const s = rows[i];
    const l = s && s.logs && s.logs[ex.id];
    if (!l || Array.isArray(l)) continue;
    if (claveVariante(ex.id, l.v) !== claveVariante(ex.id, v)) continue;
    const sets = l.sets || [];
    for (let k = 0; k < sets.length; k++) {
      const set = sets[k];
      if (!set || !set.done) continue;
      if (gymId && !setDelGym(set, s, gymId, gyms)) continue;
      const nativo = pesoLeido(ex.id, l.v || "main", s, Number(set.w) || 0);
      if (!(nativo > 0)) continue;
      out.push({ w: nativo, kg: aKg(nativo, uN) });
    }
  }
  return out;
}

function empacar(base, wv, perfil, ex) {
  const uN = unidadNativa(ex);
  return { ...base, w: desdeKg(wv, uN), wv: red(wv), u: perfil.unidad };
}

/* La serie propuesta cae en una placa real. Si no puede subir, conserva las reps. */
export function ajustarSerie(antesW, antesR, propuesto, ctx) {
  const perfil = ctx && ctx.perfil;
  const ex = ctx && ctx.ex;
  const regs = (ctx && ctx.regs) || [];
  if (!perfil || !propuesto || !ex) return propuesto;
  const uN = unidadNativa(ex);
  const dir = propuesto.w > antesW + 0.15 ? 1 : propuesto.w < antesW - 0.15 ? -1 : 0;
  if (perfil.tipo === "escalera") {
    const vals = valoresEscalera(perfil);
    const ahora = cercanoLista(aKg(antesW, uN), vals);
    let wv = ahora;
    if (dir > 0) wv = siguienteLista(ahora, vals);
    else if (dir < 0) {
      const quiere = aKg(propuesto.w, uN);
      const abajo = vals.filter((v) => v <= quiere + 0.05);
      wv = abajo.length ? abajo[abajo.length - 1] : vals[0];
    }
    const subio = wv > ahora + 0.05;
    const r = dir > 0 && !subio ? antesR : propuesto.r;
    return empacar({ ...propuesto, r }, wv, perfil, ex);
  }
  if (perfil.tipo === "tope") {
    const cap = perfil.max;
    const ahoraKg = aKg(antesW, uN);
    const quiereKg = aKg(propuesto.w, uN);
    const dentro = regs.map((r) => r.kg).filter((k) => k <= cap + 0.05).sort((a, b) => a - b);
    let wv = null;
    if (ahoraKg > cap + 0.05 || quiereKg > cap + 0.05) wv = cap;
    else if (!dentro.length) return propuesto;
    else if (dir > 0) {
      const next = dentro.find((k) => k > ahoraKg + 0.2);
      wv = next != null ? next : cercanoLista(ahoraKg, dentro);
    } else if (dir < 0) {
      const abajo = dentro.filter((k) => k <= quiereKg + 0.2);
      wv = abajo.length ? abajo[abajo.length - 1] : dentro[0];
    } else wv = cercanoLista(ahoraKg, dentro);
    const base = ahoraKg > cap + 0.05 ? cap : (dentro.length ? cercanoLista(Math.min(ahoraKg, cap), dentro) : Math.min(ahoraKg, cap));
    const subio = wv > base + 0.05;
    const r = dir > 0 && !subio ? antesR : propuesto.r;
    return empacar({ ...propuesto, r }, wv, perfil, ex);
  }
  if (!regs.length) return propuesto;
  const max = Math.max(...regs.map((r) => r.kg));
  const ahora = aKg(antesW, uN);
  const quiere = aKg(propuesto.w, uN);
  if (dir > 0 && quiere > max + 0.2) {
    const top = regs.reduce((a, b) => (a.kg >= b.kg ? a : b));
    return { ...propuesto, w: top.w, r: antesR };
  }
  if (dir > 0) {
    const next = regs.filter((r) => r.kg > ahora + 0.2).sort((a, b) => a.kg - b.kg)[0];
    if (!next) return { ...propuesto, w: antesW, r: antesR };
    return { ...propuesto, w: next.w };
  }
  if (quiere > max + 0.2) {
    const top = regs.reduce((a, b) => (a.kg >= b.kg ? a : b));
    return { ...propuesto, w: top.w };
  }
  return propuesto;
}

export function cerrarPlan(sets, bases, ctx) {
  if (!ctx || !ctx.perfil || !sets) return sets;
  return sets.map((s, i) => {
    const base = bases && bases.length ? bases[Math.min(i, bases.length - 1)] : null;
    const aw = base ? (Array.isArray(base) ? base[0] : base.w) : s.w;
    const ar = base ? (Array.isArray(base) ? base[1] : base.r) : s.r;
    return ajustarSerie(Number(aw) || 0, Number(ar) || 0, s, ctx);
  });
}

/* Lo que se ve en el campo. Con unidad guardada, el número es el de esa placa. */
export function verPeso(set, ex, viewU) {
  const vu = viewU === "kg" ? "kg" : "lb";
  if (set && set.wv != null && (set.u === "kg" || set.u === "lb")) {
    if (set.u === vu) return red(set.wv);
    const conv = set.u === "lb" ? set.wv * LB2KG : set.wv / LB2KG;
    return Math.round(conv * 10) / 10;
  }
  const nu = unidadNativa(ex);
  const w = Number(set && set.w) || 0;
  if (nu === vu) return red(w);
  const conv = nu === "lb" ? w * LB2KG : w / LB2KG;
  return Math.round(conv * 2) / 2;
}

/* Lo que él escribe, de vuelta a una placa real y con su unidad. */
export function anotarPeso(typed, viewU, cur, ex, perfil, regs) {
  const vu = viewU === "kg" ? "kg" : "lb";
  const n = Number(typed);
  if (!(n >= 0) || !ex) return { w: 0 };
  if (cur && cur.wv != null && cur.u) {
    const visto = verPeso(cur, ex, vu);
    if (Math.abs(n - visto) < 0.06) return { w: cur.w, wv: cur.wv, u: cur.u };
  }
  if (perfil && perfil.tipo === "escalera") {
    const kg = vu === "kg" ? n : n * LB2KG;
    const wv = cercanoLista(kg, valoresEscalera(perfil));
    return empacar({ r: cur && cur.r }, wv, perfil, ex);
  }
  if (perfil && perfil.tipo === "tope") {
    const kg = Math.min(perfil.max, vu === "kg" ? n : n * LB2KG);
    return empacar({ r: cur && cur.r }, kg, perfil, ex);
  }
  const uN = unidadNativa(ex);
  if (vu === uN) return { w: n, wv: n, u: vu };
  const kg = vu === "kg" ? n : n * LB2KG;
  return { w: desdeKg(kg, uN), wv: red(kg), u: "kg" };
}

export function moverPeso(cur, dir, ex, perfil, regs) {
  const uN = unidadNativa(ex);
  const w = Number(cur && cur.w) || 0;
  if (!perfil) {
    const st = (ex && ex.step) || 5;
    return { w: Math.max(0, red(w + dir * st)) };
  }
  if (perfil.tipo === "escalera") {
    const vals = valoresEscalera(perfil);
    const base = cur && cur.wv != null ? Number(cur.wv) : aKg(w, uN);
    const ahora = cercanoLista(base, vals);
    const wv = dir < 0 ? anteriorLista(ahora, vals) : siguienteLista(ahora, vals);
    return empacar(cur || {}, wv, perfil, ex);
  }
  if (perfil.tipo === "tope") {
    const cap = perfil.max;
    const base = cur && cur.wv != null ? Number(cur.wv) : aKg(w, uN);
    if (base > cap + 0.05) return empacar(cur || {}, cap, perfil, ex);
    const dentro = (regs || []).map((r) => r.kg).filter((k) => k <= cap + 0.05).sort((a, b) => a - b);
    if (!dentro.length) return cur && cur.wv != null ? { w: cur.w, wv: cur.wv, u: cur.u } : { w };
    const ahora = cercanoLista(base, dentro);
    const wv = dir < 0 ? anteriorLista(ahora, dentro) : siguienteLista(ahora, dentro);
    return empacar(cur || {}, Math.min(wv, cap), perfil, ex);
  }
  if (!regs || !regs.length) return { w };
  const ahora = cur && cur.wv != null && cur.u ? aKg(cur.wv, cur.u) : aKg(w, uN);
  const orden = regs.slice().sort((a, b) => a.kg - b.kg);
  if (dir > 0) {
    const n = orden.find((r) => r.kg > ahora + 0.2);
    return n ? { w: n.w } : { w };
  }
  const menores = orden.filter((r) => r.kg < ahora - 0.2);
  const n = menores.length ? menores[menores.length - 1] : orden[0];
  return { w: n.w };
}
