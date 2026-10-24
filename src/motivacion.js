/* Little wins y regreso sin culpa, dentro de la tarjeta de meta.
   Los textos salen de las sesiones y las corridas guardadas. */

export const TEXTO_WINS = "Logros chicos y reales de tus sesiones: una serie más, más peso, una corrida más larga.";
export const TEXTO_REGRESO = "Si faltaste, la siguiente sesión cuenta igual, sin compensar.";

function num(n) {
  const x = Math.round(Number(n) * 100) / 100;
  return Number.isFinite(x) ? String(x) : "";
}

function fraseCorrida(r) {
  if (!r) return "";
  const km = Number(r.km);
  const min = Number(r.min);
  const bits = [];
  if (km > 0) bits.push(num(km) + " km");
  if (min > 0) bits.push(Math.round(min) + " min");
  if (bits.length === 2) return bits[0] + " en " + bits[1];
  return bits[0] || "";
}

/* La última corrida que superó a la anterior en minutos o en km. */
export function textoCorridaMasLarga(runs) {
  const list = (runs || [])
    .filter((r) => r && (Number(r.min) > 0 || Number(r.km) > 0))
    .slice()
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  let best = null;
  for (let i = 1; i < list.length; i++) {
    const prev = list[i - 1];
    const cur = list[i];
    if (Number(cur.min) > Number(prev.min) || Number(cur.km) > Number(prev.km)) best = { cur, prev };
  }
  if (!best) return "";
  const ahora = fraseCorrida(best.cur);
  const antes = fraseCorrida(best.prev);
  if (!ahora || !antes) return "";
  return "Corrida más larga: " + ahora + " (antes " + antes + ").";
}

export function partesMotivacion(hist, runs, volver) {
  const conWins = (hist || []).filter((s) => s && Array.isArray(s.wins) && s.wins.length);
  const last = conWins.length ? conWins[conWins.length - 1] : null;
  const wins = [];
  if (last) {
    last.wins.forEach((w) => {
      if (!w || !w.texto || w.tipo === "regreso") return;
      wins.push(w.texto);
    });
  }
  const larga = textoCorridaMasLarga(runs);
  if (larga) wins.push(larga);
  let regreso = "";
  const winRegreso = last && last.wins.find((w) => w && w.tipo === "regreso" && w.texto);
  if (volver && volver.pendiente && !volver.hoyHay) {
    regreso = "La siguiente sesión cuenta igual, sin compensar.";
  } else if (winRegreso) {
    regreso = winRegreso.texto;
  } else if (volver && volver.total > 0) {
    regreso = "Llevas " + volver.total + " regresos. Cada uno contó igual.";
  }
  return { wins: wins.slice(0, 3), regreso };
}
