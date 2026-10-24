import assert from "node:assert/strict";
import { MODOS, dayForModo, capSets, estimateMin, preselectModo, priorityGroups, modoSeries } from "./modo.js";
import { DAYS } from "./dias.js";

for (const d of ["A", "B", "C"]) {
  const full = new Set(DAYS[d].ex.map((e) => e.id));
  const fullSets = modoSeries(dayForModo(DAYS[d], d, "espartano"));
  for (const m of MODOS) {
    const x = dayForModo(DAYS[d], d, m);
    x.ex.forEach((e) => assert.ok(full.has(e.id), `${d}/${m} agrega ${e.id}`));
    assert.ok(estimateMin(x) >= 40, `${d}/${m} dura menos de 40`);
    assert.ok(modoSeries(x) <= fullSets);
    assert.deepEqual(x.secs.flatMap((s) => s.ids).sort(), x.ex.map((e) => e.id).sort());
  }
  const r = dayForModo(DAYS[d], d, "relajado");
  assert.ok(r.ex.every((e) => e.maxSets === 2));
  const n = estimateMin(dayForModo(DAYS[d], d, "normal"));
  assert.ok(n >= 45 && n <= 50, `${d} normal ${n}`);
  assert.equal(dayForModo(DAYS[d], d, "espartano").ex.length, DAYS[d].ex.length);
}
assert.deepEqual(capSets([1, 2, 3, 4], { maxSets: 2 }), [1, 2]);
assert.deepEqual(capSets([1, 2, 3], {}), [1, 2, 3]);

assert.equal(preselectModo([]), "normal");
assert.equal(preselectModo([{ energy: "espartano" }]), "espartano");
assert.equal(preselectModo([{ energy: "relajado" }]), "relajado");
assert.equal(preselectModo([{ energy: "relajado" }, { energy: "regular" }, { energy: "relajado" }]), "normal");

const now = new Date("2026-10-21T12:00:00");
const hist = [{ date: "2026-10-20T10:00:00", day: "B", logs: { b9: { sets: [{ done: true }, { done: true }] }, b1: { sets: [{ done: true }, { done: true }, { done: true }, { done: true }] } } }];
assert.deepEqual(priorityGroups(hist, DAYS, "C", now), []); /* core 2 < 4 pero piernas/glúteo 0: todos bajos → orden normal */
const hist2 = [{ date: "2026-10-19T10:00:00", day: "C", logs: { c1: { sets: Array(4).fill({ done: true }) }, c3: { sets: Array(4).fill({ done: true }) }, c4: { sets: Array(4).fill({ done: true }) }, c8: { sets: Array(4).fill({ done: true }) } } }];
assert.deepEqual(priorityGroups(hist2, DAYS, "C", now), ["core"]);
const c = dayForModo(DAYS.C, "C", "normal", ["core"]);
assert.equal(c.secs[0].g[0], "core");
console.log("modo ok");
