import assert from "node:assert/strict";
import {
  VARIANTES, chipDoneMap, constanciaStats, fechaCorta, flattenCatalog, hitosState,
  fraterHoy, lineaHoy, markReaccion, pickHoy, pickVariante, reaccionVisible, recentRecords, weekMonday,
} from "./logros.js";

const TZ = "America/Mexico_City";
const cat = flattenCatalog({
  A: { ex: [
    { id: "a1", n: "Chest Press", u: "lb", prev: [] },
    { id: "a10", n: "Fondos Asistidos", u: "kg", type: "assist", alt: { n: "Fondos en banco" } },
  ] },
  B: { ex: [
    { id: "b5", n: "Chin-up asistido", u: "kg", type: "assist" },
  ] },
});

assert.equal(pickVariante(0), "records");
assert.equal(pickVariante(0.34), "constancia");
assert.equal(pickVariante(0.67), "hitos");
assert.equal(pickVariante(0.999), "hitos");
assert.equal(VARIANTES.length, 3);
assert.equal(weekMonday("2026-10-14T00:55:44.757Z", TZ), "2026-10-12");
assert.equal(fechaCorta("2026-10-14T00:55:44.757Z", TZ), "13 oct");

function ses(date, day, logs) {
  return { date, day, logs };
}
function sets(...rows) {
  return rows.map(([w, r]) => ({ w, r, f: true, done: true }));
}

const hist = [
  ses("2026-09-10T18:00:00.000Z", "A", { a1: { v: "main", sets: sets([100, 10]) }, a10: { v: "main", sets: sets([40, 6]) } }),
  ses("2026-10-13T18:00:00.000Z", "A", { a1: { v: "main", sets: sets([100, 12], [110, 8]) }, a10: { v: "main", sets: sets([0, 6]) } }),
];
const runs = [
  { id: "r1", date: "2026-07-19", km: 13.25, min: 91, pace: "6:53" },
  { id: "r2", date: "2026-10-12", km: 3.2, min: 21 },
];
const assign = { r1: "lar", r2: "res" };

const rec = recentRecords(hist, cat, runs, TZ);
assert.equal(rec.empty, false);
assert.equal(rec.items.some((x) => x.title === "Chest Press" && x.badge === "record" && x.detail === "100×12 lb"), true);
assert.equal(rec.items.some((x) => x.title === "Fondos Asistidos" && x.detail === "sin ayuda × 6"), true);
assert.equal(rec.items.some((x) => x.title === "Distancia" && x.badge === "record"), false);
assert.equal(rec.items.some((x) => x.title === "Ritmo" && x.badge === "record"), false);

const onlyFirst = recentRecords([hist[0]], cat, [], TZ);
assert.equal(onlyFirst.items.every((x) => x.badge === "mejor"), true);
assert.equal(onlyFirst.items.some((x) => x.detail === "100×10 lb"), true);

const none = recentRecords([], [], [], TZ);
assert.equal(none.empty, true);
assert.equal(none.items.length, 0);

const hoy = pickHoy({ hist, runs, assign, today: "2026-10-14", timeZone: TZ });
assert.deepEqual({ kind: hoy.kind, id: hoy.id }, { kind: "run", id: "pot" });
const jue = pickHoy({ hist, runs, assign, today: "2026-10-15", timeZone: TZ });
assert.deepEqual({ kind: jue.kind, id: jue.id }, { kind: "gym", id: "B" });
assert.equal(fraterHoy("2026-10-22", TZ), true);
assert.equal(fraterHoy("2026-10-29", TZ), false);
assert.equal(fraterHoy("2026-11-05", TZ), true);
assert.equal(fraterHoy("2026-10-21", TZ), false);
const chips = chipDoneMap(hist, runs, assign, "2026-10-14", TZ);
assert.equal(chips.A, true);
assert.equal(chips.B, false);
assert.equal(chips.res, true);
assert.equal(chips.lar, false);

const line = lineaHoy({
  target: jue, hist, runs, assign, today: "2026-10-14", timeZone: TZ,
  ret: { active: true, week: 1, program: { weeks: 3, levels: [{ pct: 80 }, { pct: 90 }, { pct: 100 }] }, anchor: "2026-10-13", baselineDate: "2026-09-10" },
});
assert.equal(line, "Semana 1 de 3 del regreso, vas bien.");

const fresh = lineaHoy({
  target: { kind: "gym", id: "B", done: false },
  hist: [], runs: [], assign: {}, today: "2026-10-14", timeZone: TZ,
  ret: { active: true, pending: true, week: 1, program: { weeks: 3, levels: [{ pct: 80 }, { pct: 90 }, { pct: 100 }] }, baselineDate: "2026-09-10" },
});
assert.equal(fresh, "Semana 1 de 3 del regreso. Hoy al 80%.");

const cons = constanciaStats(hist, runs, assign, "2026-10-14", {
  active: true, week: 1, program: { weeks: 3, levels: [{ pct: 80 }, { pct: 90 }, { pct: 100 }] },
}, TZ);
assert.equal(cons.streak, 0);
assert.equal(cons.weekDone, 2);
assert.equal(cons.weekTotal, 5);
assert.equal(cons.monthCount >= 2, true);
assert.equal(cons.regreso.title, "Regreso · semana 1 de 3");
assert.equal(cons.empty, false);
assert.equal(constanciaStats([], [], {}, "2026-10-14", null, TZ).empty, true);

const fullWeekHist = ["A", "B", "C"].map((day, i) => ses("2026-10-0" + (5 + i) + "T18:00:00.000Z", day, { a1: { v: "main", sets: sets([50, 8]) } }));
const fullRuns = [
  { id: "a", date: "2026-10-05", km: 0, min: 30 },
  { id: "b", date: "2026-10-06", km: 0, min: 30 },
];
const fullAssign = { a: "res", b: "pot" };
const streak = constanciaStats(fullWeekHist, fullRuns, fullAssign, "2026-10-14", null, TZ);
assert.equal(streak.streak, 1);

const h = hitosState(hist, runs, {
  active: true, week: 1, program: { weeks: 3, levels: [{ pct: 80 }, { pct: 90 }, { pct: 100 }] }, anchor: "2026-10-13",
}, TZ);
assert.equal(h.done.some((x) => x.id === "cinco_km"), true);
assert.equal(h.done.some((x) => x.id === "fondos_libre"), true);
assert.equal(h.done.some((x) => x.id === "chin_libre"), false);
assert.equal(h.done.some((x) => x.id === "regreso_100"), false);
assert.equal(h.next.id === "sesiones_10" || h.done.some((x) => x.id === "sesiones_10"), true);

const closed = [
  ses("2026-06-01T18:00:00.000Z", "A", { a1: { v: "main", sets: sets([80, 8]) } }),
  ses("2026-07-06T18:00:00.000Z", "A", { a1: { v: "main", sets: sets([70, 8]) } }),
  ses("2026-07-13T18:00:00.000Z", "B", { a1: { v: "main", sets: sets([70, 8]) } }),
  ses("2026-07-20T18:00:00.000Z", "C", { a1: { v: "main", sets: sets([70, 8]) } }),
];
const closedH = hitosState(closed, [], { active: false }, TZ);
assert.equal(closedH.done.some((x) => x.id === "regreso_100"), true);

const emptyH = hitosState([], [], null, TZ);
assert.equal(emptyH.done.length, 0);
assert.equal(emptyH.next.id, "sesiones_10");
assert.equal(emptyH.next.progress, 0);
assert.match(emptyH.next.detail, /0 de 10/);

const cont = pickHoy({ hist: [], runs: [], assign: {}, today: "2026-10-14", draftDay: "B", draftSets: 4, timeZone: TZ });
assert.equal(cont.continue, true);
assert.equal(cont.id, "B");
assert.equal(lineaHoy({ target: cont, hist: [], runs: [], assign: {}, today: "2026-10-14", timeZone: TZ }), "La sesión sigue abierta.");

assert.equal(reaccionVisible({}, "records", "2026-10-14", TZ), true);
const onceRx = markReaccion({}, "records", "2026-10-14", "motiva", TZ);
assert.equal(reaccionVisible(onceRx, "records", "2026-10-14", TZ), false);
assert.equal(reaccionVisible(onceRx, "hitos", "2026-10-14", TZ), true);
assert.equal(reaccionVisible(onceRx, "records", "2026-10-15", TZ), true);
const closedRx = markReaccion(onceRx, "hitos", "2026-10-14", "x", TZ);
assert.equal(closedRx["2026-10-14"].hitos, "x");
assert.equal(reaccionVisible(closedRx, "hitos", "2026-10-14", TZ), false);

console.log("logros.test.js ok");
