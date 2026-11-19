import assert from "node:assert/strict";
import { firmaLogs, logsRepetidos, sinCopias } from "./firmaLogs.js";

const c = {
  day: "C",
  date: "2026-11-16",
  logs: { c1: { v: "main", sets: [{ w: 100, r: 10, done: true }] } },
};
const copia = {
  day: "C",
  date: "2026-11-18",
  logs: { c1: { v: "main", sets: [{ w: 100, r: 10, done: true }] } },
};
const a = {
  day: "A",
  date: "2026-11-18",
  logs: { a1: { v: "main", sets: [{ w: 40, r: 8, done: true }] } },
};

assert.equal(firmaLogs(c.logs), firmaLogs(copia.logs));
assert.notEqual(firmaLogs(c.logs), firmaLogs(a.logs));
assert.equal(logsRepetidos([c], copia.logs), true);
assert.equal(logsRepetidos([c], a.logs), false);
assert.equal(logsRepetidos([c], { c1: { v: "main", sets: [{ w: 100, r: 10, done: false }] } }), false);

const quedaron = sinCopias([c, copia, a]);
assert.deepEqual(quedaron.map((s) => s.day), ["C", "A"]);
assert.equal(quedaron[0].date, "2026-11-16");

console.log("firmaLogs ok");
