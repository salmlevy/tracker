import assert from "node:assert/strict";
import { DAYS } from "./dias.js";
import { HABITUAL_ID, TECHNOGYM_ID } from "./gyms.js";
import { previewSrc } from "./clips.js";
import { pasoSiguiente, textoSiguiente } from "./progresion.js";
import { b5ConBanda, esNavy } from "./b5.js";
import { metaCarga } from "./motivacion.js";

const b5 = DAYS.B.ex.find((e) => e.id === "b5");
const ew = b5ConBanda(b5, { id: HABITUAL_ID, nombre: "EW" });
assert.equal(ew.type, "assist");
assert.equal(ew.n, "Chin-up asistido");
assert.equal(esNavy({ id: TECHNOGYM_ID }), true);
assert.equal(esNavy({ nombre: "Navy" }), true);
assert.equal(esNavy({ id: HABITUAL_ID, nombre: "EW" }), false);

const navy = b5ConBanda(b5, { id: TECHNOGYM_ID, nombre: "Navy" });
assert.equal(navy.type, "band");
assert.equal(navy.n, "Chin-up con banda");
assert.equal(navy.lbl, "banda, sin peso");
assert.equal(navy.alt.n, "Chin-up sin banda");
assert.equal(navy.alt.type, "body");
assert.ok(navy.cues[0].includes("Banda"));
assert.ok(previewSrc(navy, "main").includes("band-assisted-pull-up"));
assert.ok(previewSrc(navy, "alt").includes("chin-up.gif"));
assert.ok(previewSrc(b5, "main").includes("lever-assisted-chin-up"));

const opt = { lo: 5, hi: 8, step: 5, type: "band" };
assert.deepEqual(pasoSiguiente(31.8, 6, opt), { w: 0, r: 7 });
assert.deepEqual(pasoSiguiente(31.8, 4, opt), { w: 0, r: 4 });
assert.deepEqual(pasoSiguiente(31.8, 8, opt), { w: 0, r: 8 });
assert.equal(textoSiguiente([[31.8, 6]], { w: 0, r: 7 }, "band", 8), "siguiente: +1 rep");
assert.equal(textoSiguiente([[31.8, 4]], { w: 0, r: 4 }, "band", 8), "");
assert.equal(textoSiguiente([[0, 8]], { w: 0, r: 8 }, "band", 8), "siguiente: banda más ligera");
assert.equal(pasoSiguiente(31.8, 8, { lo: 5, hi: 8, step: 5, type: "assist" }).w < 31.8, true);
assert.equal(metaCarga(b5, { gymId: "gym-technogym", logs: { b5: { v: "main", sets: [{ w: 31.8, r: 6, done: true }] } } }), "Suma una rep en Chin-up con banda, o usa una banda más ligera.");
assert.equal(metaCarga(b5, { gymId: "gym-technogym", logs: { b5: { v: "main", sets: [{ w: 0, r: 8, done: true }] } } }), "En Chin-up con banda, la siguiente es una banda más ligera.");
assert.match(metaCarga(b5, { gymId: "habitual", logs: { b5: { v: "main", sets: [{ w: 40, r: 8, done: true }] } } }), /ayuda/);

console.log("b5 ok");
