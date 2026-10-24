import assert from "node:assert/strict";
import { TEXTO_REGRESO, TEXTO_WINS, partesMotivacion, textoCorridaMasLarga } from "./motivacion.js";

assert.equal(TEXTO_WINS, "Logros chicos y reales de tus sesiones: una serie más, más peso, una corrida más larga.");
assert.equal(TEXTO_REGRESO, "Si faltaste, la siguiente sesión cuenta igual, sin compensar.");

const hist = [{
  date: "2026-10-24T00:05:25.060Z",
  day: "B",
  wins: [
    { tipo: "ligera", texto: "Viniste aunque fuera en versión ligera (Relajado). Cuenta igual." },
    { tipo: "regreso", texto: "Regreso número 14. Volviste después de faltar." },
    { tipo: "completa", texto: "Completaste la sesión: 10 de 10 ejercicios." },
  ],
}];
const runs = [
  { date: "2026-10-12", min: 21, km: 3.2 },
  { date: "2026-10-19", min: 45, km: 6 },
  { date: "2026-10-24", min: 30, km: 0 },
];
const m = partesMotivacion(hist, runs, { total: 14, pendiente: false, hoyHay: false });
assert.equal(m.wins[0], "Viniste aunque fuera en versión ligera (Relajado). Cuenta igual.");
assert.equal(m.wins[1], "Completaste la sesión: 10 de 10 ejercicios.");
assert.equal(m.wins[2], "Corrida más larga: 6 km en 45 min (antes 3.2 km en 21 min).");
assert.equal(m.regreso, "Regreso número 14. Volviste después de faltar.");

assert.equal(textoCorridaMasLarga([{ date: "2026-10-19", min: 45, km: 6 }, { date: "2026-10-24", min: 30, km: 0 }]), "");
assert.deepEqual(partesMotivacion([], [], null), { wins: [], regreso: "" });
assert.equal(partesMotivacion([], [], { pendiente: true, hoyHay: false, total: 14 }).regreso, "La siguiente sesión cuenta igual, sin compensar.");
assert.equal(partesMotivacion([], [], { total: 3, pendiente: false, hoyHay: true }).regreso, "Llevas 3 regresos. Cada uno contó igual.");

console.log("motivacion.test.js ok");
