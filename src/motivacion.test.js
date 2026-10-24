import assert from "node:assert/strict";
import { TEXTO_REGRESO, TEXTO_WINS, metaCarga, metaCorrida, metasHoy, partesMotivacion, textoSemanaMas } from "./motivacion.js";

assert.equal(TEXTO_WINS, "Metas chicas para hoy, con tus números.");
assert.equal(TEXTO_REGRESO, "Si faltaste, la siguiente sesión cuenta igual, sin compensar.");
assert.equal(textoSemanaMas(2, 4), "Una sesión más esta semana te deja en 3/4.");
assert.equal(textoSemanaMas(4, 4), "");
assert.equal(textoSemanaMas(0, 4), "Una sesión más esta semana te deja en 1/4.");

const ejercicios = [
  { id: "b1", n: "Jalón", u: "lb", step: 15, prev: [[130, 10], [130, 10], [130, 10], [130, 10]] },
  { id: "b2", n: "Low Row", u: "lb", step: 5, prev: [[100, 10], [100, 10], [100, 10], [100, 10]] },
  { id: "b3", n: "Remo Mancuerna", u: "lb", step: 5, prev: [[80, 10], [80, 10], [80, 10]] },
  { id: "b5", n: "Chin-up asistido", u: "kg", step: 5, type: "assist", prev: [[40, 6], [40, 6]] },
];

function sets(rows) {
  return rows.map(([w, r]) => ({ w, r, f: true, done: true }));
}

const hist = [{
  date: "2026-10-20T18:00:00.000Z",
  day: "B",
  logs: {
    b2: { v: "main", sets: sets([[100, 10], [100, 8]]) },
    b3: { v: "main", sets: sets([[80, 10], [80, 10], [80, 10]]) },
    b5: { v: "main", sets: sets([[40, 6], [40, 6]]) },
  },
  wins: [
    { tipo: "ligera", texto: "Viniste aunque fuera en versión ligera (Relajado). Cuenta igual." },
    { tipo: "regreso", texto: "Regreso número 14. Volviste después de faltar." },
  ],
}];

const gym = metasHoy({
  decidido: true, kind: "gym", id: "B", ejercicios, hist, runs: [], assign: {}, hechas: 2, meta: 4,
});
assert.equal(gym.length, 3);
assert.equal(gym[0], "Sube 5 lb en Remo Mancuerna: llega a 85 lb.");
assert.equal(gym[1], "Completa todas las series de Low Row.");
assert.equal(gym[2], "Una sesión más esta semana te deja en 3/4.");
assert.equal(gym.some((t) => /versión ligera|Superaste|antes/.test(t)), false);

const sinDatos = metasHoy({
  decidido: true, kind: "gym", id: "B", ejercicios, hist: [], runs: [], assign: {}, hechas: 0, meta: 4,
});
assert.equal(sinDatos.some((t) => /lb|kg/.test(t)), false);
assert.equal(sinDatos[0], "Completa todas las series de Jalón.");
assert.equal(sinDatos[1], "Una sesión más esta semana te deja en 1/4.");

assert.equal(metaCarga(ejercicios[1], null), "");
assert.equal(metaCarga({ id: "x", n: "X", u: "lb", step: 2.5 }, { logs: { x: { v: "main", sets: sets([[40, 8]]) } } }), "Sube 2.5 lb en X: llega a 42.5 lb.");
assert.equal(metaCarga(ejercicios[3], hist[0]), "Baja 5 kg de ayuda en Chin-up asistido: llega a 35 kg.");

const runs = [
  { id: "r1", date: "2026-10-12", min: 21, km: 3.2 },
  { id: "r2", date: "2026-10-19", min: 45, km: 6 },
];
const assign = { r1: "res", r2: "lar" };
assert.equal(metaCorrida(runs, assign, "lar"), "Corre un poco más que tu último largo: llega a 46 min.");
assert.equal(metaCorrida(runs, assign, "pot"), "");
assert.equal(metasHoy({ decidido: true, kind: "run", id: "lar", hist: [], runs, assign, hechas: 3, meta: 4 }).join(" | "), "Corre un poco más que tu último largo: llega a 46 min. | Una sesión más esta semana te deja en 4/4.");
assert.deepEqual(metasHoy({ decidido: true, kind: "run", id: "lib", hist: [], runs, assign, hechas: 1, meta: 4 }), ["Una sesión más esta semana te deja en 2/4."]);

const soloSemana = metasHoy({ decidido: false, kind: "gym", id: "B", ejercicios, hist, runs, assign, hechas: 2, meta: 4 });
assert.deepEqual(soloSemana, ["Una sesión más esta semana te deja en 3/4."]);
assert.deepEqual(metasHoy({ decidido: false, kind: "gym", id: "A", ejercicios, hist, hechas: 4, meta: 4 }), []);

const reg = partesMotivacion(hist, runs, { total: 14, pendiente: false, hoyHay: false });
assert.equal(reg.regreso, "Regreso número 14. Volviste después de faltar.");
assert.equal(partesMotivacion([], [], { pendiente: true, hoyHay: false, total: 14 }).regreso, "La siguiente sesión cuenta igual, sin compensar.");
assert.equal(partesMotivacion([], [], { total: 3, pendiente: false, hoyHay: true }).regreso, "Llevas 3 regresos. Cada uno contó igual.");
assert.equal(partesMotivacion([], [], null).regreso, "");

console.log("motivacion.test.js ok");
