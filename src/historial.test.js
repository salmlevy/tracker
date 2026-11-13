import assert from "node:assert/strict";
import { HABITUAL_ID, TECHNOGYM_ID, asegurarGyms, usarHistorialPropio } from "./gyms.js";
import { lastTwoGym, pesoEnVista, sesionTocaGym, textoSesionPasada, varianteDeUltima } from "./historial.js";

const nota = "Estoy usando otra máquina de technogym todos los ejercicios están en kilos ";
const hecho = (w, r) => ({ w, r, done: true, f: true });

/* 20 oct, EW, sin gymId. Día C. */
const ew = {
  date: "2026-10-20",
  day: "C",
  logs: {
    c1: { v: "main", sets: [180, 215, 250, 275].map((w) => hecho(w, 10)) },
    c2: { v: "main", sets: [85, 85, 85, 85].map((w) => hecho(w, 11)) },
    c4: { v: "main", sets: [180, 180, 180].map((w) => hecho(w, 10)) },
    c8: { v: "main", sets: [125, 125, 125].map((w) => hecho(w, 12)) },
    c11: { v: "main", sets: [60, 60].map((w) => hecho(w, 12)) },
    c12: { v: "main", sets: [hecho(20, 12)] },
  },
};

/* 3 nov, Navy. Ni la sesión ni los sets traen gymId. */
const navy = {
  date: "2026-11-03",
  day: "C",
  note: "",
  logs: {
    c1: { v: "main", note: nota, sets: [286.6, 330.7, 374.8, 418.9].map((w) => hecho(w, 10)) },
    c2: { v: "alt", note: nota, sets: [50, 71.7, 77.2, 82.7].map((w) => hecho(w, 14)) },
    c3: { v: "main", sets: [hecho(71.7, 12), hecho(60.6, 12), hecho(60.6, 12)] },
    c4: { v: "main", sets: [hecho(126.8, 7), hecho(126.8, 7)] },
    c5: { v: "main", sets: [hecho(82.7, 8), hecho(88.2, 8)] },
    c6: { v: "main", sets: [hecho(66.1, 8), hecho(77.2, 8)] },
    c8: { v: "main", sets: [hecho(264.6, 9), hecho(308.6, 9)] },
    c11: { v: "main", sets: [hecho(40, 9), hecho(40, 9)] },
    c12: { v: "main", sets: [hecho(28, 15)] },
  },
};

/* Otro día, ya en Navy, no puede colarse en el día C. */
const otroDia = {
  date: "2026-11-08",
  day: "B",
  gymId: TECHNOGYM_ID,
  logs: { c1: { v: "main", sets: [hecho(999, 10)] } },
};

/* Un día C posterior en EW tampoco. */
const ewDespues = {
  date: "2026-11-09",
  day: "C",
  logs: { c1: { v: "main", sets: [hecho(999, 8)] } },
};

const hist = [ew, navy, otroDia, ewDespues];
const gyms = asegurarGyms([], hist);
const ex = (id) => ({ id });

const c1 = lastTwoGym(hist, "C", ex("c1"), "main", TECHNOGYM_ID, gyms);
assert.equal(c1.length, 1, "solo hay un día C en Navy");
assert.deepEqual(c1[0].map((s) => s[0]), [286.6, 330.7, 374.8, 418.9]);
assert.equal(textoSesionPasada(c1[0], "lb", "kg", "weight"), "sesión pasada: 130×10 · 150×10 · 170×10 · 190×10 kg");
assert.doesNotMatch(textoSesionPasada(c1[0], "lb", "kg", "weight"), /180|275|999/);

const c2 = lastTwoGym(hist, "C", ex("c2"), "alt", TECHNOGYM_ID, gyms);
assert.deepEqual(c2[0].map((s) => s[0]), [50, 71.7, 77.2, 82.7]);
assert.equal(textoSesionPasada(c2[0], "lb", "kg", "weight"), "sesión pasada: 22.5×14 · 32.5×14 · 35×14 · 37.5×14 kg");
assert.equal(lastTwoGym(hist, "C", ex("c2"), "main", TECHNOGYM_ID, gyms).length, 0);
assert.equal(varianteDeUltima(hist, "C", "c2", TECHNOGYM_ID, gyms), "alt");
assert.equal(varianteDeUltima(hist, "C", "c1", TECHNOGYM_ID, gyms), "main");

assert.equal(usarHistorialPropio(hist, "C", "c1", "main", TECHNOGYM_ID, gyms), true);
assert.equal(usarHistorialPropio(hist, "C", "c2", "alt", TECHNOGYM_ID, gyms), true);
assert.equal(usarHistorialPropio(hist, "C", "c2", "main", TECHNOGYM_ID, gyms), false);
assert.deepEqual(lastTwoGym(hist, "C", ex("c4"), "main", TECHNOGYM_ID, gyms)[0].map((s) => s[0]), [126.8, 126.8]);
assert.deepEqual(lastTwoGym(hist, "C", ex("c8"), "main", TECHNOGYM_ID, gyms)[0].map((s) => s[0]), [264.6, 308.6]);
assert.deepEqual(lastTwoGym(hist, "C", ex("c11"), "main", TECHNOGYM_ID, gyms)[0].map((s) => s[0]), [40, 40]);
assert.deepEqual(lastTwoGym(hist, "C", ex("c12"), "main", TECHNOGYM_ID, gyms)[0].map((s) => s[0]), [28]);

/* La sesión ya trae gymId y los sets viejos no. Se heredan. */
const conGym = {
  date: "2026-11-03",
  day: "C",
  gymId: TECHNOGYM_ID,
  logs: { c1: { v: "main", sets: [hecho(286.6, 10), { ...hecho(999, 10), gymId: HABITUAL_ID }, hecho(418.9, 10)] } },
};
assert.equal(sesionTocaGym(conGym, TECHNOGYM_ID, gyms), true);
assert.deepEqual(lastTwoGym([ew, conGym], "C", ex("c1"), "main", TECHNOGYM_ID, gyms)[0].map((s) => s[0]), [286.6, 418.9]);
assert.equal(JSON.stringify(navy.logs.c1.sets[0].gymId), undefined);
assert.equal(navy.gymId, undefined);

/* En EW, la referencia sigue siendo la de EW, no la de Navy. */
assert.deepEqual(lastTwoGym(hist, "C", ex("c1"), "main", HABITUAL_ID, gyms)[0].map((s) => s[0]), [999]);

/* 12 nov, a8: 20 kg anotados como total de las dos mancuernas. No se parte ni se dobla. */
assert.equal(pesoEnVista(44.1, "lb", "kg"), 20);
assert.equal(textoSesionPasada([[44.1, 10], [44.1, 10], [44.1, 10]], "lb", "kg", "weight"), "sesión pasada: 20×10 · 20×10 · 20×10 kg");
assert.notEqual(pesoEnVista(44.1, "lb", "kg"), 10);
assert.notEqual(pesoEnVista(44.1, "lb", "kg"), 40);

console.log("historial ok");
