/* Little wins: logros pequeños y concretos, reconocidos en el momento.
   Tipos: "ligera" (fue aunque sea en Relajado), "regreso" (volvió tras faltar),
   "marca" (igualó o superó su marca reciente en un ejercicio), "completa" (terminó la sesión).
   Sobrio: una línea con el dato. Se guardan en la sesión como wins: [{tipo, texto}]. */

const num = (x) => (Math.round(Number(x) * 100) / 100).toString();

export function fmtSet(type, unit, w, r) {
  if (type === "time") return r + " s";
  if (type === "body") return r + " reps";
  if (type === "assist") return (w > 0 ? num(w) + " " + unit + " de ayuda" : "sin ayuda") + " × " + r;
  return num(w) + " " + unit + " × " + r;
}

/* ¿a es al menos tan bueno como b? y ¿es mejor? */
function cmp(type, a, b) {
  const [aw, ar] = a; const [bw, br] = b;
  if (type === "time" || type === "body") return { ok: ar >= br, better: ar > br };
  if (type === "assist") return { ok: aw <= bw && ar >= br, better: aw < bw || ar > br };
  return { ok: aw >= bw && ar >= br, better: aw > bw || ar > br };
}
const rank = (type, [w, r]) => (type === "time" || type === "body" ? r : type === "assist" ? -w * 1000 + r : w * 1000 + r);

/* Marca reciente: la mejor serie de la última sesión con ese ejercicio. */
export function marcaReciente(lastSets, type) {
  const list = (lastSets || []).filter((x) => Array.isArray(x) && Number(x[1]) > 0);
  if (!list.length) return null;
  return list.reduce((a, b) => (rank(type, b) > rank(type, a) ? b : a));
}

/* Win de marca con las series hechas hoy (solo series con buena técnica). */
export function winMarca({ name, type, unit, sets, mark, toView }) {
  if (!mark) return null;
  const done = (sets || []).filter((s) => s && s.done && s.f !== false && Number(s.r) > 0).map((s) => [Number(s.w) || 0, Number(s.r)]);
  let best = null;
  done.forEach((s) => {
    const c = cmp(type, s, mark);
    if (!c.ok) return;
    if (!best || (c.better && !best.better) || (c.better === best.better && rank(type, s) > rank(type, best.s))) best = { s, better: c.better };
  });
  if (!best) return null;
  const tv = toView || ((w) => w);
  const hoy = fmtSet(type, unit, tv(best.s[0]), best.s[1]);
  const antes = fmtSet(type, unit, tv(mark[0]), mark[1]);
  return best.better
    ? { tipo: "marca", texto: "Superaste tu marca de " + name + ": " + hoy + " (antes " + antes + ")" }
    : { tipo: "marca", texto: "Igualaste tu marca de " + name + ": " + hoy };
}

export function winLigera(energy) {
  return energy === "relajado" ? { tipo: "ligera", texto: "Viniste aunque fuera en versión ligera (Relajado). Cuenta igual." } : null;
}

export function winCompleta(hechos, total) {
  return total > 0 && hechos >= total ? { tipo: "completa", texto: "Completaste la sesión: " + total + " de " + total + " ejercicios." } : null;
}

export function sessionWins({ energy, regresoNumero, marcas, hechos, total }) {
  const out = [];
  const l = winLigera(energy); if (l) out.push(l);
  if (regresoNumero > 0) out.push({ tipo: "regreso", texto: "Regreso número " + regresoNumero + ". Volviste después de faltar." });
  (marcas || []).forEach((m) => { if (m) out.push(m); });
  const c = winCompleta(hechos, total); if (c) out.push(c);
  return out;
}
