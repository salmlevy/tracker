import assert from "node:assert/strict";
import { ANIMO_EXTREMOS, ANIMO_PREGUNTA, ANIMO_VALORES, animoEnRun, animoEnSesion, animoEventProps, conAnimo, isAnimo, runParaAnimo } from "./animo.js";
import { sanitizeProps } from "./track.js";

const TZ = "America/Mexico_City";

assert.equal(ANIMO_PREGUNTA, "¿Cómo terminaste de energía y ánimo?");
assert.deepEqual(ANIMO_VALORES, [1, 2, 3, 4, 5]);
assert.deepEqual(ANIMO_EXTREMOS, { 1: "sin pila", 5: "poderoso" });
assert.equal(/[\u{1F300}-\u{1FAFF}]/u.test(ANIMO_PREGUNTA + Object.values(ANIMO_EXTREMOS).join("")), false);

[1, 2, 3, 4, 5].forEach((v) => assert.equal(isAnimo(v), true));
[0, 6, 2.5, "3", null, undefined, NaN].forEach((v) => assert.equal(isAnimo(v), false));

/* Sesión de gym: solo agrega animo, sin tocar nada más */
const ses = { date: "2026-10-22T23:00:00.000Z", day: "A", energy: "relajado", logs: { a1: { v: "main", sets: [{ w: 100, r: 8, done: true }] } }, note: "", wins: [] };
assert.deepEqual(conAnimo(ses, 4), { ...ses, animo: 4 });
assert.equal(conAnimo(ses, 9), ses);
assert.equal("animo" in ses, false);

/* Historial viejo sin animo queda intacto; solo cambia la sesión con esa fecha */
const vieja = { date: "2026-10-20T14:10:20.392Z", day: "C", energy: "normal", logs: {} };
const hist = [vieja, ses];
const h2 = animoEnSesion(hist, ses.date, 5);
assert.equal(h2[0], vieja);
assert.deepEqual(h2[1], { ...ses, animo: 5 });
assert.equal(animoEnSesion(hist, "no-existe", 3), hist);
assert.equal(animoEnSesion(hist, ses.date, 0), hist);
assert.equal(animoEnSesion(h2, ses.date, 2)[1].animo, 2);

/* Trote: solo la corrida indicada, assign y semanas iguales */
const trote = {
  runs: [{ id: "r1", date: "2026-10-19", min: 45 }, { id: "m1761190000000", date: "2026-10-22", km: 0, min: 30, pace: null, re: 0, indoor: false, nota: "Trote corto (jueves de frater)" }],
  assign: { r1: "res", m1761190000000: "corto" },
  weeks: { "2026-10-19": { res: { p: { nota: "x" } } } },
};
const t2 = animoEnRun(trote, "m1761190000000", 3);
assert.equal(t2.runs[0], trote.runs[0]);
assert.deepEqual(t2.runs[1], { ...trote.runs[1], animo: 3 });
assert.equal(t2.assign, trote.assign);
assert.equal(t2.weeks, trote.weeks);
assert.equal(animoEnRun(trote, "nope", 3), trote);
assert.equal(animoEnRun(trote, "r1", 7), trote);
assert.equal(animoEnRun({}, "r1", 3).runs, undefined);

/* A qué corrida se le pregunta */
const hoy = new Date("2026-10-23T01:30:00Z"); // 22 oct 19:30 CDMX
assert.equal(runParaAnimo(trote.runs, hoy, TZ).id, "m1761190000000");
assert.equal(runParaAnimo(trote.runs, hoy, TZ, { slot: "corto", assign: trote.assign }).id, "m1761190000000");
assert.equal(runParaAnimo(trote.runs, hoy, TZ, { slot: "res", assign: trote.assign }), null);
assert.equal(runParaAnimo(t2.runs, hoy, TZ), null);
assert.equal(runParaAnimo(t2.runs, hoy, TZ, { respondidas: { m1761190000000: 3 } }).id, "m1761190000000");
assert.equal(runParaAnimo(trote.runs, hoy, TZ, { omitidas: { m1761190000000: true } }), null);
assert.equal(runParaAnimo(trote.runs, new Date("2026-10-24T18:00:00Z"), TZ), null);
assert.equal(runParaAnimo([{ id: "strava1", date: "2026-10-22", min: 40 }], hoy, TZ), null);
assert.equal(runParaAnimo(undefined, hoy, TZ), null);

/* Evento: mismas reglas que el resto de track() */
assert.deepEqual(animoEventProps(4, "gym"), { valor: 4, tipo: "gym" });
assert.deepEqual(animoEventProps(1, "run"), { valor: 1, tipo: "run" });
assert.deepEqual(sanitizeProps(animoEventProps(5, "run")), { valor: 5, tipo: "run" });

console.log("animo.test.js ok");
