import assert from "node:assert/strict";
import { DAYS } from "./dias.js";
import { rehabEx } from "./hombro.js";
import { pasoSiguiente, textoSiguiente } from "./progresion.js";

const opt = { lo: 8, hi: 12, step: 5, type: "weight" };
assert.deepEqual(pasoSiguiente(130, 12, opt), { w: 135, r: 8 });
assert.deepEqual(pasoSiguiente(130, 10, opt), { w: 130, r: 11 });
assert.deepEqual(pasoSiguiente(130, 6, opt), { w: 130, r: 6 });
assert.equal(textoSiguiente([[130, 10]], { w: 130, r: 11 }), "siguiente: +1 rep");
assert.equal(textoSiguiente([[130, 12]], { w: 135, r: 8 }), "siguiente: sube peso");
assert.equal(textoSiguiente([[130, 6]], { w: 130, r: 6 }), "");
assert.deepEqual(pasoSiguiente(40, 10, { lo: 6, hi: 10, step: 5, type: "assist" }), { w: 35, r: 6 });
assert.equal(textoSiguiente([[40, 10]], { w: 35, r: 6 }), "siguiente: baja ayuda");
assert.equal(textoSiguiente([[31.8, 6]], { w: 0, r: 7 }, "band", 8), "siguiente: +1 rep");
assert.equal(textoSiguiente([[0, 8]], { w: 0, r: 8 }, "band", 8), "siguiente: banda más ligera");

const faltan = [];
for (const day of Object.values(DAYS)) {
  for (const ex of day.ex) if (!ex.alt || !ex.alt.n) faltan.push(ex.id);
}
for (const ex of Object.values(rehabEx())) if (!ex.alt || !ex.alt.n) faltan.push(ex.id);
assert.deepEqual(faltan, []);

console.log("progresion ok");
