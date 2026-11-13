/* Siguiente carga a partir de la sesión anterior. No reescribe el historial.
   Si todas las series llegaron al tope de reps, sube el incremento.
   Si todas entraron al rango, suma una rep. Si alguna se quedó corta, se mantiene. */

export function pasoSiguiente(w, r, opts) {
  const o = opts || {};
  const R = Number(r) || 0;
  const W = Number(w) || 0;
  const lo = Number(o.lo) || 0;
  const hi = Number(o.hi) || lo;
  const st = Number(o.step) > 0 ? Number(o.step) : 5;
  const type = o.type || "weight";
  if (type === "time") return { w: 0, r: R >= hi ? R : R + 5 };
  if (type === "body") return { w: 0, r: R >= lo ? Math.min(hi, R + 1) : R };
  if (type === "assist") {
    if (R >= hi) return { w: Math.max(st, W - st), r: lo };
    if (R >= lo) return { w: W, r: Math.min(hi, R + 1) };
    return { w: W, r: R };
  }
  if (R >= hi) return { w: W + st, r: lo };
  if (R >= lo) return { w: W, r: Math.min(hi, R + 1) };
  return { w: W, r: R };
}

/* Una línea corta. Vacía si la carga se queda igual. */
export function textoSiguiente(antes, despues) {
  if (!antes || !antes.length || !despues) return "";
  const aw = Number(antes[0][0]) || 0;
  const ar = Number(antes[0][1]) || 0;
  const dw = Number(despues.w) || 0;
  const dr = Number(despues.r) || 0;
  if (dw > aw + 0.05) return "siguiente: sube peso";
  if (aw > 0 && dw < aw - 0.05) return "siguiente: baja ayuda";
  if (dr > ar) return "siguiente: +1 rep";
  return "";
}
