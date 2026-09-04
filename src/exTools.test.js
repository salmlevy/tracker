import assert from "node:assert/strict";
import { applyVuelta, fmtClock, lastOptFor, optLabel, resolveOpt } from "./exTools.js";

function checkClock() {
  assert.equal(fmtClock(0), "0:00");
  assert.equal(fmtClock(1000), "0:01");
  assert.equal(fmtClock(59000), "0:59");
  assert.equal(fmtClock(60000), "1:00");
  assert.equal(fmtClock(125000), "2:05");
  assert.equal(fmtClock(-5), "0:00");
}

function checkVuelta() {
  const t0 = 1_000_000;
  const start = applyVuelta(null, t0);
  assert.deepEqual(start, { startedAt: t0, phase: "work", phaseAt: t0 });

  const rest = applyVuelta(start, t0 + 45_000);
  assert.equal(rest.startedAt, t0, "clock keeps the original start");
  assert.equal(rest.phase, "rest");
  assert.equal(rest.phaseAt, t0 + 45_000);

  const work2 = applyVuelta(rest, t0 + 90_000);
  assert.equal(work2.startedAt, t0, "still the same continuous clock");
  assert.equal(work2.phase, "work");
  assert.equal(work2.phaseAt, t0 + 90_000);

  const rest2 = applyVuelta(work2, t0 + 140_000);
  assert.equal(rest2.phase, "rest");
  assert.equal(rest2.startedAt, t0);
}

function checkOpt() {
  const ex = {
    id: "c10",
    opts: [{ id: "flat", n: "Plana" }, { id: "dec10", n: "Declive ~10°" }],
    optDefault: "dec10",
  };
  assert.equal(resolveOpt(null, null, ex), "dec10");
  assert.equal(resolveOpt("flat", "dec10", ex), "flat");
  assert.equal(resolveOpt(null, "flat", ex), "flat");
  assert.equal(resolveOpt("nope", "flat", ex), "flat");
  assert.equal(optLabel(ex, "dec10"), "Declive ~10°");
  assert.equal(optLabel(ex, "flat"), "Plana");

  const hist = [
    { day: "C", logs: { c10: { v: "main", opt: "flat", sets: [] } } },
  ];
  assert.equal(lastOptFor(hist, "C", ex, "main"), "flat");
  assert.equal(lastOptFor([], "C", ex, "main"), null);
  assert.equal(lastOptFor(hist, "A", ex, "main"), null);
}

checkClock();
checkVuelta();
checkOpt();
console.log("exTools ok");
