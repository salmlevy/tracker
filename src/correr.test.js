import assert from "node:assert/strict";
import {
  completarPlan, esRegistro, lectorDe, minutosPlan, planDelSlot, presetPotencia, presetResistencia,
  volumenPrincipal,
} from "./correr.js";

const res = presetResistencia();
const pot = presetPotencia();
assert.equal(res.cal, 7);
assert.equal(res.sets.length, 3);
assert.equal(pot.n, 12);
assert.equal(pot.v, 12);
assert.equal(pot.cool.min, 5);

const lleno = completarPlan(pot);
assert.equal(lleno.relleno.cal, false);
assert.equal(lleno.relleno.principal, false);
assert.equal(lleno.relleno.final, false);
assert.equal(volumenPrincipal(lleno.plan), volumenPrincipal(pot));
assert.equal(lleno.plan.n, 12);
assert.equal(lleno.plan.cal, 7);
assert.equal(lleno.plan.cool.min, 5);

const sinFinal = completarPlan({ ...pot, cool: undefined });
assert.equal(sinFinal.relleno.final, true);
assert.equal(sinFinal.plan.cool.min, 4);
assert.equal(sinFinal.plan.cool.v, 6);
assert.equal(volumenPrincipal(sinFinal.plan), volumenPrincipal(pot));
assert.equal(sinFinal.plan.v, 12);
assert.equal(sinFinal.plan.inc, 12);

const sinCal = completarPlan({ n: 12, t: 60, v: 12, inc: 12, dt: 90, cool: { min: 5, v: 6 } });
assert.equal(sinCal.relleno.cal, true);
assert.equal(sinCal.plan.cal, 5);
assert.ok(sinCal.plan.cv <= 8);
assert.ok(sinCal.plan.cv < 12);
assert.equal(sinCal.plan.n, 12);
assert.equal(sinCal.plan.t, 60);

const sinPrin = completarPlan({ cal: 7, cv: 9, cinc: 0, cool: { min: 5, v: 7 } });
assert.equal(sinPrin.relleno.principal, true);
assert.equal(sinPrin.plan.cal, 7);
assert.equal(sinPrin.plan.cool.min, 5);
assert.equal(sinPrin.plan.t, 480);
assert.equal(sinPrin.plan.v, 9);
assert.equal(sinPrin.plan.inc, 0);
assert.equal(volumenPrincipal(sinPrin.plan), 480);

const lector = lectorDe({ n: 12, t: 60, v: 12, inc: 12, dt: 90 });
assert.deepEqual(lector.secciones.map((s) => s.titulo), ["Calentamiento", "Principal", "Final"]);
assert.match(lector.secciones[1].texto, /12 ×/);
assert.match(lector.secciones[0].texto, /5 min/);
assert.equal(lector.relleno.cal, true);
assert.equal(lector.relleno.final, true);
assert.equal(volumenPrincipal(lector.plan), 12 * 60);

const weeks = {
  "2026-08-17": { pot: { p: { n: 8, t: 60, v: 11, inc: 4, dt: 45, cal: 6, cv: 8, cool: { min: 3, v: 6 } } } },
  "2026-10-19": { res: { p: { nota: "solo texto" } }, pot: { p: { n: 10, t: 60, v: 12, inc: 10, dt: 60, cal: 7, cv: 9 } } },
};
assert.equal(planDelSlot(weeks, "pot").n, 10);
assert.equal(planDelSlot(weeks, "res").cal, 7);
assert.equal(planDelSlot({}, "res").sets.length, 3);
assert.ok(minutosPlan(lector.plan) > 0);
assert.equal(minutosPlan(pot) >= 7 + 5, true);
assert.equal(esRegistro("lar"), true);
assert.equal(esRegistro("lib"), true);
assert.equal(esRegistro("pot"), false);

console.log("correr.test.js ok");
