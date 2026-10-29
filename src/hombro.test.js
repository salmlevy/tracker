import assert from "node:assert";
import { registrar, preguntaActiva, salidaCumplida, dayForHombro, adjW, semanaRehab, bumpRehab, rehabEx } from "./hombro.js";
assert.equal(adjW("a1"), 105); assert.equal(adjW("a6"), 75); assert.equal(adjW("a3"), 65);
assert.equal(adjW("b1"), 105); assert.equal(adjW("b2"), 105); assert.equal(adjW("b3"), 60); assert.equal(adjW("b4"), 30);
let r = null;
assert.ok(preguntaActiva(r, "A")); assert.ok(!preguntaActiva(r, "C"));
r = registrar(r, { fecha: "2026-10-20T10:00:00Z", dia: "A", dolor: true, intensidad: 3 });
r = registrar(r, { fecha: "2026-10-22T10:00:00Z", dia: "A", dolor: false });
r = registrar(r, { fecha: "2026-10-24T10:00:00Z", dia: "A", dolor: false });
r = registrar(r, { fecha: "2026-10-25T10:00:00Z", dia: "B", dolor: false });
assert.ok(preguntaActiva(r, "B"));
r = registrar(r, { fecha: "2026-10-27T10:00:00Z", dia: "B", dolor: false });
assert.ok(salidaCumplida(r)); assert.ok(!preguntaActiva(r, "A")); assert.ok(r.cerrado);
assert.equal(semanaRehab(r, new Date("2026-11-05T10:00:00Z")), 3);
const day = { secs: [{ t: "P", ids: ["a1", "a2"] }, { t: "H", ids: ["a3", "a4", "a5"] }], ex: [{ id: "a1", maxSets: 3 }, { id: "a2" }, { id: "a3" }, { id: "a4" }, { id: "a5" }] };
const d1 = dayForHombro(day, "A", { dolor: true, intensidad: 4, semana: 1 });
assert.ok(!d1.ex.find((e) => e.id === "a3" || e.id === "a3r"));
assert.equal(d1.ex.find((e) => e.id === "a1r").maxSets, 3);
assert.equal(d1.secs[0].ids.length, 5); assert.ok(d1.ex.find((e) => e.id === "a12r"));
const d3 = dayForHombro(day, "A", { dolor: true, semana: 3 });
assert.ok(d3.ex.find((e) => e.id === "a3r"));
const dn = dayForHombro(day, "A", { dolor: false });
assert.deepEqual(dn.secs[0].ids, ["h1", "h5"]);
const hist = [{ date: "2026-10-21T10:00:00Z", logs: { h3: { dolor: 0 } } }];
assert.ok(Math.abs(bumpRehab({ respuestas: [{ fecha: "2026-10-20T00:00:00Z", dia: "A", dolor: true }] }, hist, new Date("2026-10-28T00:00:00Z")) - 1.1) < 1e-9);

const R = rehabEx();
assert.equal(R.h1.lbl, "reps / lado");
assert.equal(R.h1.prev.length, 3);
assert.equal(R.h1.prev[0][1], 15);
assert.equal(R.h1.type, "body");
assert.equal(R.h1.alt.n, "Rotación externa en polea");
assert.equal(R.h1.alt.w, 10);
assert.equal(R.h1.alt.type, "weight");
assert.equal(R.h3.n, "Escapción con mancuerna hasta 60°");
assert.equal(R.h3.prev.length, 2);
assert.equal(R.h3.prev[0][1], 12);
assert.equal(R.h3.rng[0], 12);
assert.match(R.h3.yt, /XOAIGRH90RY/);
assert.equal(R.b10r.n, "Pull-up asistido · agarre neutro");
assert.equal(R.b10r.type, "assist");
assert.equal(R.b10r.u, "lb");
assert.equal(R.b10r.prev.length, 3);
assert.equal(R.b10r.prev[0][0], 90);
assert.equal(R.b10r.prev[0][1], 10);
assert.deepEqual(R.b10r.rng, [8, 12]);
assert.equal(R.b10r.alt.n, "Jalón · agarre neutro");
assert.equal(R.b10r.alt.type, "weight");
assert.equal(R.b10r.alt.w, 105);
assert.notEqual(R.b10r.n, R.b1r.n);

const dayB = {
  modo: "espartano",
  secs: [
    { t: "Espalda · anchura", ids: ["b1"] },
    { t: "Progresión pull-up", ids: ["b10", "b5"] },
  ],
  ex: [{ id: "b1" }, { id: "b10" }, { id: "b5" }],
};
const dolorB = dayForHombro(dayB, "B", { dolor: true, intensidad: 5, semana: 1 });
const pullSec = dolorB.secs.find((s) => s.ids.includes("b10r"));
assert.deepEqual(pullSec.ids, ["b10r"]);
assert.equal(dolorB.ex.filter((e) => e.id === "b10r").length, 1);
assert.ok(dolorB.ex.some((e) => e.id === "b1r"));
assert.ok(!dolorB.ex.some((e) => e.id === "b5" || e.id === "b10"));
assert.equal(dolorB.ex.find((e) => e.id === "b10r").prev.length, 3);
console.log("hombro ok");
