import assert from "node:assert/strict";
import { DAYS } from "./dias.js";
import { TECHNOGYM_ID } from "./gyms.js";
import { enNavy } from "./b5.js";
import {
  POLEAS_NAVY, aKg, ajustarSerie, anotarPeso, cerrarPlan, moverPeso, perfilEquipo, placasRegistradas, valoresEscalera, verPeso,
} from "./equipo.js";

const navy = { id: TECHNOGYM_ID, unidad: "kg" };
const A = DAYS.A.ex;
const ex = (id) => A.find((e) => e.id === id) || DAYS.B.ex.find((e) => e.id === id) || DAYS.C.ex.find((e) => e.id === id);

function hecho(w, r) {
  return { w, r, f: true, done: true };
}

const a5 = ex("a5");
const a3 = ex("a3");
const a8 = ex("a8");
const a1 = ex("a1");
const perfilDb = perfilEquipo(TECHNOGYM_ID, a5, "main");
const perfilA3 = perfilEquipo(TECHNOGYM_ID, a3, "main");
const perfilA8 = perfilEquipo(TECHNOGYM_ID, a8, "main");
const perfilCable = perfilEquipo(TECHNOGYM_ID, a1, "main");

assert.equal(perfilDb.tipo, "escalera");
assert.equal(perfilDb.max, 32);
assert.equal(perfilDb.paso, 2);
assert.equal(perfilA3.tipo, "tope");
assert.equal(perfilA3.max, 50);
assert.equal(perfilA8.paso, 4);
assert.equal(perfilA8.max, 64);
assert.equal(perfilCable.tipo, "registrado");
assert.equal(perfilEquipo("habitual", a5, "main"), null);
assert.equal(perfilEquipo(TECHNOGYM_ID, a3, "alt").id, "mancuerna");
assert.ok(POLEAS_NAVY && typeof POLEAS_NAVY === "object");

const escalera = valoresEscalera(perfilDb);
assert.deepEqual(escalera.slice(0, 4), [2, 4, 6, 8]);
assert.equal(escalera[escalera.length - 1], 32);
assert.ok(escalera.every((w) => w % 2 === 0 && w <= 32 && w >= 2));

/* 20 kg al tope de reps sube a la siguiente mancuerna, no a un kilo inventado. */
const kg20 = 20 / 0.45359237;
const sube = ajustarSerie(kg20, 15, { w: kg20 + 5, r: 12 }, { perfil: perfilDb, regs: [], ex: a5 });
assert.equal(sube.wv, 22);
assert.equal(sube.u, "kg");
assert.equal(verPeso(sube, a5, "kg"), 22);
assert.ok(sube.wv % 2 === 0 && sube.wv <= 32);

/* En el tope de la rack no pasa de 32 ni baja las reps. */
const kg32 = 32 / 0.45359237;
const tope = ajustarSerie(kg32, 15, { w: kg32 + 5, r: 12 }, { perfil: perfilDb, regs: [], ex: a5 });
assert.equal(tope.wv, 32);
assert.equal(tope.r, 15);

/* Un peso imposible (31 kg, o 25 lb) cae en una mancuerna par. */
const raro = ajustarSerie(25, 15, { w: 25, r: 15 }, { perfil: perfilDb, regs: [], ex: a5 });
assert.equal(raro.wv % 2, 0);
assert.ok(raro.wv <= 32 && raro.wv >= 2);

/* Todas las sugerencias de la escalera, subiendo desde cada peldaño, siguen siendo pares y <= 32. */
escalera.forEach((kg) => {
  const w = kg / 0.45359237;
  const next = ajustarSerie(w, 15, { w: w + 5, r: 12 }, { perfil: perfilDb, regs: [], ex: a5 });
  assert.equal(next.wv % 2, 0);
  assert.ok(next.wv <= 32);
  assert.ok(next.wv >= kg);
});

/* a3: 135 lb se veía como 61 kg. El tope de la máquina es 50. */
const sobre = ajustarSerie(135, 12, { w: 140, r: 8 }, { perfil: perfilA3, regs: [{ w: 135, kg: aKg(135, "lb") }], ex: a3 });
assert.equal(sobre.wv, 50);
assert.ok(verPeso(sobre, a3, "kg") <= 50);

/* 45 kg registrados y ganas de subir: no inventa 50 si nunca lo cargó. */
const kg45 = 45 / 0.45359237;
const queda = ajustarSerie(kg45, 12, { w: kg45 + 5, r: 8 }, { perfil: perfilA3, regs: [{ w: kg45, kg: 45 }], ex: a3 });
assert.equal(queda.wv, 45);
assert.equal(queda.r, 12);

/* Cable sin escalón: no pasa del mayor peso registrado. */
const regsCable = [{ w: 80, kg: aKg(80, "lb") }, { w: 90, kg: aKg(90, "lb") }];
const cable = ajustarSerie(80, 12, { w: 85, r: 8 }, { perfil: perfilCable, regs: regsCable, ex: a1 });
assert.equal(cable.w, 90);
const mas = ajustarSerie(90, 12, { w: 95, r: 8 }, { perfil: perfilCable, regs: regsCable, ex: a1 });
assert.equal(mas.w, 90);
assert.equal(mas.r, 12);

/* El total de las dos mancuernas es 2 × una placa par. 20 kg se queda en 20. */
const total = ajustarSerie(44.1, 10, { w: 44.1, r: 11 }, { perfil: perfilA8, regs: [], ex: a8 });
assert.equal(total.wv, 20);
assert.equal(total.u, "kg");

/* Ida y vuelta kg → lb → kg conserva la placa. */
const ida = verPeso(sube, a5, "lb");
const vuelta = anotarPeso(ida, "lb", sube, a5, perfilDb, []);
assert.equal(verPeso(vuelta, a5, "kg"), 22);
assert.equal(vuelta.u, "kg");
assert.equal(vuelta.wv, 22);

/* + y − recorren la rack, sin pasar de 32 ni bajar de 2. */
const arriba = moverPeso(sube, 1, a5, perfilDb, []);
assert.equal(arriba.wv, 24);
const abajo = moverPeso({ wv: 2, u: "kg", w: 2 / 0.45359237 }, -1, a5, perfilDb, []);
assert.equal(abajo.wv, 2);

/* Lo que escribe en kg se guarda en kg. 21 no existe: cae en 20. */
const escrito = anotarPeso(21, "kg", null, a5, perfilDb, []);
assert.equal(escrito.wv, 20);
assert.equal(escrito.u, "kg");
const otra = anotarPeso(verPeso(escrito, a5, "lb"), "lb", escrito, a5, perfilDb, []);
assert.equal(verPeso(otra, a5, "kg"), 20);

/* 55 kg en a3 no se guarda: la máquina llega a 50. */
const cap = anotarPeso(55, "kg", null, a3, perfilA3, []);
assert.ok(verPeso(cap, a3, "kg") <= 50);

/* El plan completo de mancuernas queda en placas pares. */
const plan = cerrarPlan(
  [{ w: 30, r: 12 }, { w: 30, r: 12 }, { w: 30, r: 12 }],
  [[25, 15], [25, 15], [25, 15]],
  { perfil: perfilDb, regs: [], ex: a5 },
);
assert.ok(plan.every((s) => s.wv % 2 === 0 && s.wv <= 32));

/* Russian twist en Navy es una mancuerna, no un stack inventado. */
const c12 = enNavy(ex("c12"), navy);
assert.equal(perfilEquipo(TECHNOGYM_ID, c12, "twist").id, "mancuerna");

/* Registrar lee el historial sin cambiarlo. */
const hist = [{ date: "2026-11-12", day: "A", gymId: TECHNOGYM_ID, logs: { a5: { v: "main", sets: [hecho(25, 15)] } } }];
const copia = JSON.stringify(hist);
const placas = placasRegistradas(hist, a5, "main", TECHNOGYM_ID, [navy]);
assert.equal(placas.length, 1);
assert.equal(JSON.stringify(hist), copia);

console.log("equipo ok");
