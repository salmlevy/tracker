/* Huella de los logs hechos, sin fecha ni nota.
   Sirve para no volver a guardar la misma sesión y para no contarla dos veces. */

function comoLog(l) {
  if (Array.isArray(l)) return { v: "main", sets: l };
  if (!l || typeof l !== "object") return { v: "main", sets: [] };
  return l;
}

export function firmaLogs(logs) {
  const keys = Object.keys(logs || {}).filter((k) => k !== "_extras").sort();
  const parts = [];
  keys.forEach((id) => {
    const l = comoLog(logs[id]);
    const sets = (l.sets || [])
      .filter((s) => s && s.done)
      .map((s) => [Number(s.w) || 0, Number(s.r) || 0, s.f === false ? 0 : 1].join(":"))
      .join(",");
    if (!sets) return;
    parts.push(id + "@" + (l.v || "main") + "=" + sets);
  });
  return parts.join("|");
}

export function logsRepetidos(hist, logs) {
  const f = firmaLogs(logs);
  if (!f) return false;
  return (hist || []).some((s) => s && firmaLogs(s.logs) === f);
}

/* La primera sesión con esos logs se queda. Las copias posteriores no cuentan. */
export function sinCopias(hist) {
  const seen = new Set();
  const out = [];
  (hist || []).forEach((s) => {
    if (!s) return;
    const f = firmaLogs(s.logs);
    if (f && seen.has(f)) return;
    if (f) seen.add(f);
    out.push(s);
  });
  return out;
}
