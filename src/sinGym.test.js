import assert from "node:assert/strict";
import { previewSrc } from "./clips.js";
import { esCargaAxial } from "./gyms.js";
import { META_SESIONES, metaSemanal } from "./meta.js";
import { analyzeReturn } from "./regreso.js";
import {
  SIN_GYM_ID, SIN_GYM_MIN, diaSinGym, ejerciciosSinGym, esSinGym, minutosSinGym,
} from "./sinGym.js";

const day = diaSinGym();
const porId = Object.fromEntries(day.ex.map((e) => [e.id, e]));
const trabajo = ["sg1", "sg2", "sg3", "sg4", "sg5"];
const movilidad = ["sg6", "sg7", "sg8", "sg9"];
const prohibido = /sentadilla|peso muerto|deadlift|good morning|burpee|salto|jump|crunch|sit-?up|russian|press militar|pila|stack/i;

assert.equal(META_SESIONES, 4);
assert.equal(day.name, "Sin gym");
assert.equal(esSinGym(SIN_GYM_ID), true);
assert.equal(esSinGym({ day: "S", sinGym: true }), true);
assert.equal(esSinGym({ day: "A" }), false);
assert.deepEqual(day.secs[0].ids, movilidad);
assert.deepEqual(day.secs[1].ids, trabajo);
assert.equal(day.ex.length, 9);

for (const id of trabajo) {
  assert.equal(porId[id].nSets, 3, id);
  assert.equal(porId[id].prev.length, 3, id);
}
for (const id of movilidad) {
  assert.equal(porId[id].nSets, 2, id);
}
assert.equal(porId.sg5.type, "time");
assert.deepEqual(porId.sg5.rng, [20, 30]);
assert.equal(porId.sg2.alt.n, "Flexiones contra un mueble");
assert.equal(porId.sg7.type, "time");
assert.equal(porId.sg9.type, "time");

for (const ex of ejerciciosSinGym()) {
  assert.ok(ex.type === "body" || ex.type === "time", ex.id + " " + ex.type);
  assert.equal(esCargaAxial(ex.n + " " + ((ex.alt && ex.alt.n) || "")), false, ex.n);
  assert.equal(prohibido.test(ex.n + " " + ((ex.alt && ex.alt.n) || "")), false, ex.n);
  if (ex.alt) assert.equal(ex.alt.type, ex.type, ex.id);
  assert.ok(!ex.lbl || !/kg|lb|pila|stack/i.test(ex.lbl), ex.lbl);
}

assert.ok(previewSrc(porId.sg1, "main").includes("low-glute-bridge-on-floor"));
assert.ok(previewSrc(porId.sg2, "main").includes("push-up"));
assert.ok(previewSrc(porId.sg2, "alt").includes("incline-push-up"));
assert.ok(previewSrc(porId.sg3, "main").includes("/previews/b9.gif"));
assert.ok(previewSrc(porId.sg4, "main").includes("bodyweight-standing-calf-raise"));
assert.ok(previewSrc(porId.sg5, "main").includes("weighted-front-plank"));
assert.ok(previewSrc(porId.sg7, "main").includes("butterfly-yoga-pose"));
assert.ok(previewSrc(porId.sg6, "main").includes("/previews/sg6.gif"));
assert.ok(previewSrc(porId.sg8, "main").includes("/previews/sg8.gif"));
assert.ok(previewSrc(porId.sg9, "main").includes("/previews/sg9.gif"));
for (const ex of ejerciciosSinGym()) {
  assert.ok(previewSrc(ex, "main"), ex.id + " sin demo");
}

const min = minutosSinGym();
assert.ok(min >= 35 && min <= 50, "minutos " + min);
assert.ok(Math.abs(min - SIN_GYM_MIN) <= 10, "lejos de 40: " + min);

const hecho = (r) => ({ w: 0, r, f: true, done: true });
const sinGym = {
  date: "2026-10-20",
  day: "S",
  sinGym: true,
  logs: { sg1: { v: "main", sets: [hecho(12), hecho(12), hecho(12)], note: "en el piso" } },
};
const gymViejo = {
  date: "2026-10-01",
  day: "A",
  logs: { a1: { v: "main", sets: [{ w: 100, r: 8, f: true, done: true }] } },
};
const MX = "America/Mexico_City";

/* Una sesión en casa no cuenta como gym con carga: el hueco de fuerza sigue abierto. */
const sinMedio = {
  date: "2026-10-10",
  day: "S",
  sinGym: true,
  logs: { sg5: { v: "main", sets: [hecho(25)] } },
};
assert.equal(analyzeReturn([gymViejo, sinMedio], "2026-10-20", MX).active, true);
assert.equal(analyzeReturn([gymViejo], "2026-10-10", MX).active, false);

const meta = metaSemanal([gymViejo, sinGym], [], "2026-10-20", MX);
assert.equal(meta.meta, 4);
assert.equal(meta.hechas, 1);

const mismoDia = metaSemanal([
  { date: "2026-10-20", day: "A", logs: { a1: { v: "main", sets: [{ w: 80, r: 10, done: true }] } } },
  sinGym,
], [], "2026-10-20", MX);
assert.equal(mismoDia.hechas, 2);

const vacia = metaSemanal([{ date: "2026-10-20", day: "S", sinGym: true, logs: { sg1: { sets: [{ w: 0, r: 12, done: false }] } } }], [], "2026-10-20", MX);
assert.equal(vacia.hechas, 0);

console.log("sin gym ok");
