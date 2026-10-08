import assert from "node:assert/strict";
import {
  analyzeReturn, assistStepsForPct, baselineSets, buildReturnPlan, chipModel,
  daysBetween, dismissEpisode, episodeId, presentReturn, prescribeReturn,
  returnProgram, roundToStep, runHintText, sessionHasWork, skipEpisode,
  suggestRunReturn,
} from "./regreso.js";

const press = { id: "a1", step: 5, rng: [8, 12], u: "lb" };
const assist = { id: "a10", type: "assist", step: 5, rng: [6, 10], u: "kg" };
const plank = { id: "c9", type: "time", step: 5, rng: [40, 60] };
const push = { id: "a11", type: "body", step: 5, rng: [6, 12] };

function ses(date, day, logs) {
  return { date, day, logs };
}

function sets(rows) {
  return rows.map(([w, r]) => ({ w, r, done: true }));
}

function checkGapDays() {
  assert.equal(daysBetween("2026-09-10", "2026-10-07"), 27);
  assert.equal(daysBetween("2026-09-10T20:00:00", "2026-10-07T08:00:00"), 27);
  assert.equal(daysBetween("2026-09-10", "2026-10-08"), 28);
  assert.equal(daysBetween("2026-09-04", "2026-10-07"), 33);
}

function checkPrograms() {
  assert.equal(returnProgram(13), null);
  assert.equal(returnProgram(14).weeks, 2);
  assert.deepEqual(returnProgram(14).levels.map((l) => l.pct), [85, 100]);
  assert.equal(returnProgram(26).weeks, 2);
  assert.equal(returnProgram(27).weeks, 3);
  assert.deepEqual(returnProgram(27).levels.map((l) => l.pct), [80, 90, 100]);
  assert.equal(returnProgram(27).levels[0].dropSet, true);
  assert.equal(returnProgram(27).levels[0].rir, 3);
  assert.equal(returnProgram(27).levels[1].rir, 2);
  assert.equal(returnProgram(27).levels[1].dropSet, false);
  assert.equal(returnProgram(55).weeks, 3);
  assert.equal(returnProgram(56).weeks, 4);
  assert.deepEqual(returnProgram(56).levels.map((l) => l.pct), [70, 80, 90, 100]);
  assert.equal(returnProgram(56).levels[0].dropSet, true);
  assert.equal(returnProgram(56).levels[1].dropSet, false);
}

function checkSep10ToOct7() {
  const hist = [
    ses("2026-09-10T18:30:00", "A", {
      a1: { v: "main", sets: sets([[115, 11], [115, 11], [115, 10]]) },
      a10: { v: "main", sets: sets([[40, 8], [40, 7], [40, 6]]) },
      a11: { v: "main", sets: sets([[0, 10], [0, 10], [0, 8]]) },
    }),
    ses("2026-09-08T12:00:00", "C", {
      c9: { v: "main", sets: sets([[0, 60], [0, 50], [0, 45]]) },
    }),
    /* Sesión vacía no cuenta: no cierra el hueco. */
    ses("2026-10-01T12:00:00", "B", {
      b1: { v: "main", sets: [{ w: 130, r: 8, done: false }] },
    }),
  ];
  const snap = JSON.stringify(hist);
  const ret = analyzeReturn(hist, "2026-10-07");
  assert.equal(JSON.stringify(hist), snap, "no muta el historial");
  assert.equal(ret.active, true);
  assert.equal(ret.pending, true);
  assert.equal(ret.gapDays, 27);
  assert.equal(ret.week, 1);
  assert.equal(ret.anchor, null);
  assert.equal(ret.baselineDate, "2026-09-10");
  assert.equal(ret.program.weeks, 3);
  assert.deepEqual(ret.program.levels.map((l) => l.pct), [80, 90, 100]);

  const chip = chipModel(presentReturn(ret, {}));
  assert.equal(chip.label, "Regreso · semana 1 de 3 · 80%");

  const plan = buildReturnPlan(hist, press, "main", presentReturn(ret, {}));
  assert.equal(plan.week, 1);
  assert.equal(plan.level.pct, 80);
  /* 115 × 0.80 = 92 → step 5 → 90. Reps con 3 de sobra. Una serie menos. */
  assert.deepEqual(plan.sets, [
    { w: 90, r: 8 },
    { w: 90, r: 8 },
  ]);

  const dip = buildReturnPlan(hist, assist, "main", presentReturn(ret, {}));
  /* Asistencia sube 1 step (40 → 45), no baja a 32. Una serie menos. */
  assert.deepEqual(dip.sets, [
    { w: 45, r: 5 },
    { w: 45, r: 4 },
  ]);

  const body = buildReturnPlan(hist, push, "main", presentReturn(ret, {}));
  assert.deepEqual(body.sets, [
    { w: 0, r: 10 },
    { w: 0, r: 10 },
  ]);

  const time = buildReturnPlan(hist, plank, "main", presentReturn(ret, {}));
  assert.deepEqual(time.sets, [
    { w: 0, r: 48 },
    { w: 0, r: 40 },
    { w: 0, r: 36 },
  ]);

  /* El mismo caso el 8 oct (28 días) sigue en semana 1 al 80%. */
  const oct8 = analyzeReturn(hist, "2026-10-08");
  assert.equal(oct8.active, true);
  assert.equal(oct8.gapDays, 28);
  assert.equal(oct8.program.weeks, 3);
  assert.equal(chipModel(presentReturn(oct8, {})).label, "Regreso · semana 1 de 3 · 80%");
}

function checkWeeksAndEasy() {
  const base = ses("2026-09-10T18:00:00", "A", {
    a1: { v: "main", sets: sets([[100, 10], [100, 10], [100, 10]]) },
  });
  const wk1 = ses("2026-10-07T18:00:00", "A", {
    a1: { v: "main", sets: sets([[80, 8], [80, 8]]) },
  });
  const hist = [base, wk1];
  const ret = presentReturn(analyzeReturn(hist, "2026-10-08"), {});
  assert.equal(ret.anchor, "2026-10-07");
  assert.equal(ret.week, 1);
  assert.equal(ret.baselineDate, "2026-09-10");
  const plan = buildReturnPlan(hist, press, "main", ret);
  assert.equal(plan.level.pct, 80);
  assert.equal(plan.sets[0].w, 80);

  const wk2 = presentReturn(analyzeReturn(hist, "2026-10-14"), {});
  assert.equal(wk2.week, 2);
  const p2 = buildReturnPlan(hist, press, "main", wk2);
  /* 100 × 0.90 = 90. Reps 10 − 2 = 8. Todas las series. */
  assert.equal(p2.level.pct, 90);
  assert.deepEqual(p2.sets, [
    { w: 90, r: 8 },
    { w: 90, r: 8 },
    { w: 90, r: 8 },
  ]);

  /* Semana 3 cae 14 días después del ancla: sigue el plan, no recalcula. */
  const wk3 = presentReturn(analyzeReturn(hist, "2026-10-21"), {});
  assert.equal(wk3.week, 3);
  assert.equal(wk3.baselineDate, "2026-09-10");
  const p3 = buildReturnPlan(hist, press, "main", wk3);
  assert.deepEqual(p3.sets, [
    { w: 100, r: 10 },
    { w: 100, r: 10 },
    { w: 100, r: 10 },
  ]);

  const finished = [
    base,
    wk1,
    ses("2026-10-14T18:00:00", "A", { a1: { v: "main", sets: sets([[90, 8], [90, 8], [90, 8]]) } }),
    ses("2026-10-21T18:00:00", "A", { a1: { v: "main", sets: sets([[100, 10], [100, 10], [100, 10]]) } }),
  ];
  const done = analyzeReturn(finished, "2026-10-29");
  assert.equal(done.active, false);

  /* Tope de reps en la semana 1: la siguiente sesión salta de nivel. */
  const easy = ses("2026-10-07T18:00:00", "A", {
    a1: { v: "main", sets: [{ w: 80, r: 12, done: true }, { w: 80, r: 12, done: true }] },
  });
  const jumped = presentReturn(analyzeReturn([base, easy], "2026-10-08"), {});
  const pj = buildReturnPlan([base, easy], press, "main", jumped);
  assert.equal(pj.week, 2);
  assert.equal(pj.level.pct, 90);

  /* Técnica rota no cuenta como fácil. */
  const ugly = ses("2026-10-07T18:00:00", "A", {
    a1: { v: "main", sets: [{ w: 80, r: 12, done: true, f: false }, { w: 80, r: 12, done: true }] },
  });
  const stay = buildReturnPlan([base, ugly], press, "main", presentReturn(analyzeReturn([base, ugly], "2026-10-08"), {}));
  assert.equal(stay.week, 1);
}

function checkRecalcKeepsBaseline() {
  const full = ses("2026-09-10T18:00:00", "A", {
    a1: { v: "main", sets: sets([[100, 10], [100, 10]]) },
  });
  const deload = ses("2026-10-07T18:00:00", "A", {
    a1: { v: "main", sets: sets([[80, 8], [80, 8]]) },
  });
  const hist = [full, deload];
  const snap = JSON.stringify(hist);
  /* 7 oct → 3 nov = 27 días. Recalcula a 3 semanas, pero el 80% sale de 100, no de 80. */
  const ret = presentReturn(analyzeReturn(hist, "2026-11-03"), {});
  assert.equal(JSON.stringify(hist), snap);
  assert.equal(ret.active, true);
  assert.equal(ret.pending, true);
  assert.equal(ret.gapDays, 27);
  assert.equal(ret.baselineDate, "2026-09-10");
  assert.equal(ret.program.weeks, 3);
  const plan = buildReturnPlan(hist, press, "main", ret);
  assert.equal(plan.sets[0].w, 80, "80% de 100, no 80% de la serie ya bajada");
  assert.equal(baselineSets(hist, "a1", "main", ret.baselineDate)[0].w, 100);
}

function checkShortGapAndRounding() {
  const hist = [ses("2026-09-28T18:00:00", "A", {
    a1: { v: "main", sets: sets([[115, 11], [115, 11]]) },
  })];
  const none = analyzeReturn(hist, "2026-10-07");
  assert.equal(daysBetween("2026-09-28", "2026-10-07"), 9);
  assert.equal(none.active, false);

  const mid = analyzeReturn(hist, "2026-10-12");
  assert.equal(daysBetween("2026-09-28", "2026-10-12"), 14);
  assert.equal(mid.program.weeks, 2);
  const p = buildReturnPlan(hist, press, "main", presentReturn(mid, {}));
  /* 115 × 0.85 = 97.75 → 100. Sin quitar serie. */
  assert.deepEqual(p.sets, [
    { w: 100, r: 11 },
    { w: 100, r: 11 },
  ]);

  assert.equal(roundToStep(92, 5), 90);
  assert.equal(roundToStep(132.3 * 0.8, 15), 105);
  assert.equal(assistStepsForPct(80), 1);
  assert.equal(assistStepsForPct(70), 2);
  assert.equal(assistStepsForPct(90), 0);
  assert.equal(assistStepsForPct(100), 0);

  const deep = prescribeReturn([[200, 12], [200, 12], [200, 10]], { step: 10, rng: [8, 12] }, returnProgram(60).levels[0], 1);
  assert.equal(deep.length, 2);
  assert.equal(deep[0].w, 140);
  assert.equal(deep[0].r, 9);
}

function checkDismissAndSkip() {
  const hist = [ses("2026-09-10T18:00:00", "A", {
    a1: { v: "main", sets: sets([[100, 10], [100, 10], [100, 10]]) },
  })];
  const raw = analyzeReturn(hist, "2026-10-07");
  const id = episodeId(raw);
  assert.equal(id, "2026-09-10:3");
  const off = presentReturn(raw, dismissEpisode({}, id));
  assert.equal(off.active, false);
  assert.equal(off.dismissed, true);
  assert.equal(buildReturnPlan(hist, press, "main", off), null);

  const skipped = presentReturn(raw, skipEpisode({}, id));
  assert.equal(skipped.skip, 1);
  const chip = chipModel(skipped);
  assert.equal(chip.label, "Regreso · semana 2 de 3 · 90%");
  const plan = buildReturnPlan(hist, press, "main", skipped);
  assert.equal(plan.level.pct, 90);
  assert.equal(plan.sets.length, 3);

  /* Otro parón más largo es otro episodio: el dismiss anterior no lo apaga. */
  const later = analyzeReturn(hist, "2026-11-20");
  assert.equal(later.program.weeks, 4);
  assert.notEqual(episodeId(later), id);
  assert.equal(presentReturn(later, dismissEpisode({}, id)).active, true);
}

function checkRuns() {
  const runs = [
    { id: "a", date: "2026-08-10", min: 100 },
    { id: "b", date: "2026-09-04", min: 30 },
    { id: "zero", date: "2026-09-08", min: 0 },
  ];
  const snap = JSON.stringify(runs);
  const sug = suggestRunReturn(runs, "2026-10-07");
  assert.equal(JSON.stringify(runs), snap, "no muta las corridas");
  assert.equal(sug.minutes, 20);
  assert.equal(sug.fromMin, 30);
  assert.equal(sug.fromDate, "2026-09-04");
  assert.equal(sug.week, 1);
  assert.equal(sug.replacesPlan, false);
  assert.equal(runHintText(sug), "Regreso · ~20 min (2/3 de 30) · la nota manda");
  assert.ok(sug.gapDays >= 14);

  const oct8 = suggestRunReturn(runs, "2026-10-08");
  assert.equal(oct8.minutes, 20);

  /* 13 días: nada. */
  assert.equal(suggestRunReturn([{ date: "2026-09-25", min: 30 }], "2026-10-07"), null);

  /* Primera salida del regreso no cambia la base. A la semana siguiente, +5. */
  const withReturn = runs.concat([{ id: "r", date: "2026-10-07", min: 20 }]);
  const still = suggestRunReturn(withReturn, "2026-10-08");
  assert.equal(still.week, 1);
  assert.equal(still.minutes, 20);
  assert.equal(still.fromMin, 30);
  const next = suggestRunReturn(withReturn, "2026-10-14");
  assert.equal(next.week, 2);
  assert.equal(next.minutes, 25);
  assert.equal(runHintText(next), "Regreso · ~25 min · semana 2 · la nota manda");

  /* Si lo deja a la mitad, no hace 2/3 del trote corto. */
  const again = suggestRunReturn(withReturn, "2026-11-03");
  assert.equal(again.week, 1);
  assert.equal(again.fromMin, 30);
  assert.equal(again.minutes, 20);

  /* Un trote que ya volvió a 30 cierra el regreso. */
  const back = withReturn.concat([{ date: "2026-10-21", min: 30 }]);
  assert.equal(suggestRunReturn(back, "2026-10-22"), null);
}

function checkEmptySession() {
  assert.equal(sessionHasWork({ date: "2026-10-01", logs: { a1: { v: "main", sets: [{ w: 10, r: 8, done: false }] } } }), false);
  assert.equal(sessionHasWork({ date: "2026-10-01", logs: { a1: [{ w: 10, r: 8, done: true }] } }), true);
}

checkGapDays();
checkPrograms();
checkSep10ToOct7();
checkWeeksAndEasy();
checkRecalcKeepsBaseline();
checkShortGapAndRounding();
checkDismissAndSkip();
checkRuns();
checkEmptySession();
console.log("regreso.test.js ok");
