import assert from "node:assert/strict";
import { parseNota, applyParsedProtocol, hydrateTroteFromNotas } from "./parseNota.js";

const R1 = "El lunes hice calentamiento de 7 min en 9km sin inclinación después ejercicios de calentamiento fuera de la banda y empezó el entrenamiento todo con inclinacion 1.5 hice 3 series de 3 min a 14 por 1 min de descanso 2 min a 15 por 1 min de descanso y 1 min a 16 por 2.5 min de descanso y cerré con 5 min a 7 de enfriamiento y estiramientos";

const R2 = "Ayer hice 7 min de calentamiento en 9km/h después calentamientos fuera de banda y después empezó el entrenamiento de 12 series a 12 km/h con inclinación 12 de 1 minuto por 1.5 min de descanso y al final un enfriamiento de 5 min a 6 sin inclinación y después estiramientos sin banda";

/* Dictado un poco distinto: uniforme, otros números. */
const R3 = "Hoy hice calentamiento de 8 min en 10km/h y después el entrenamiento de 8 series a 11 km/h con inclinación 4 de 2 minutos por 45 seg de descanso y al final un enfriamiento de 3 min a 8";

const COMPACT = "17 ago: 15x1'15\" @15 km/h incl 1, desc 45\" fuera. Cal 7'@8.5 incl 0, enf 5'@7 incl 0. (La escalera 3-2-1 del 4 ago queda como variante del coach.)";

const OLD_POT = "Ayer hice 7 minutos de calentamiento en velocidad 9 después hice un ronda de 10 minutos a velocidad 13 en inclinación 1,5 después una de 5 minutos en velocidad 12 en inclinación 3 después otra serie de 5 minutos a velocidad 11 en inclinación 4, después otra de 5 minutos en inclinación 5 y después una de 5 minutos a velocidad 13 en inclinación 1.5 y por último enfriamiento de 5 minutos a velocidad 6 sin inclinación";

function checkR1() {
  const p = parseNota(R1);
  assert.ok(p, "R1 debe parsear");
  assert.equal(p.cal, 7);
  assert.equal(p.cv, 9);
  assert.ok(Array.isArray(p.sets) && p.sets.length === 3, "R1 series variables, got " + JSON.stringify(p));
  assert.deepEqual(p.sets.map((s) => ({ t: s.t, v: s.v, inc: s.inc, dt: s.dt })), [
    { t: 180, v: 14, inc: 1.5, dt: 60 },
    { t: 120, v: 15, inc: 1.5, dt: 60 },
    { t: 60, v: 16, inc: 1.5, dt: 150 },
  ]);
  assert.equal(p.cool.min, 5);
  assert.equal(p.cool.v, 7);
  assert.equal(p.dv, 0);
}

function checkR2() {
  const p = parseNota(R2);
  assert.ok(p, "R2 debe parsear");
  assert.equal(p.cal, 7);
  assert.equal(p.cv, 9);
  assert.ok(!Array.isArray(p.sets), "R2 es uniforme, no sets[]. got " + JSON.stringify(p));
  assert.equal(p.n, 12);
  assert.equal(p.t, 60);
  assert.equal(p.v, 12);
  assert.equal(p.inc, 12);
  assert.equal(p.dt, 90);
  assert.equal(p.dv, 0);
  assert.equal(p.cool.min, 5);
  assert.equal(p.cool.v, 6);
}

function checkR3() {
  const p = parseNota(R3);
  assert.ok(p, "R3 debe parsear algo sensible");
  assert.equal(p.cal, 8);
  assert.equal(p.cv, 10);
  assert.equal(p.n, 8);
  assert.equal(p.t, 120);
  assert.equal(p.v, 11);
  assert.equal(p.inc, 4);
  assert.equal(p.dt, 45);
  assert.equal(p.cool.min, 3);
  assert.equal(p.cool.v, 8);
}

function checkCompact() {
  const p = parseNota(COMPACT);
  assert.ok(p, "compacto debe parsear");
  assert.equal(p.n, 15);
  assert.equal(p.t, 75);
  assert.equal(p.v, 15);
  assert.equal(p.inc, 1);
  assert.equal(p.dt, 45);
  assert.equal(p.cal, 7);
  assert.equal(p.cv, 8.5);
  assert.equal(p.cool.min, 5);
  assert.equal(p.cool.v, 7);
}

function checkOldPot() {
  const p = parseNota(OLD_POT);
  assert.ok(p, "nota vieja de potencia debe parsear");
  assert.equal(p.cal, 7);
  assert.equal(p.cv, 9);
  assert.ok(Array.isArray(p.sets) && p.sets.length >= 4, "rondas variables " + JSON.stringify(p));
  assert.equal(p.sets[0].t, 600);
  assert.equal(p.sets[0].v, 13);
  assert.equal(p.sets[0].inc, 1.5);
  assert.equal(p.sets[3].v, 11, "inclinación 5 sin vel: arrastra 11, no la 13 de la siguiente. " + JSON.stringify(p.sets));
  assert.equal(p.sets[3].inc, 5);
  assert.equal(p.cool.min, 5);
  assert.equal(p.cool.v, 6);
}

const LEGACY = "7 min calentamiento a 8.5, 15 repeticiones de 1 min 15 secs a velocidad 15 inclinacion 1 con 45 secs de descanso, enfriamiento 5 min a velocidad 7.";

function checkLegacy() {
  const p = parseNota(LEGACY);
  assert.ok(p, "estilo viejo del mensaje de error");
  assert.equal(p.cal, 7);
  assert.equal(p.cv, 8.5);
  assert.equal(p.n, 15);
  assert.equal(p.t, 75);
  assert.equal(p.v, 15);
  assert.equal(p.inc, 1);
  assert.equal(p.dt, 45);
  assert.equal(p.cool.min, 5);
  assert.equal(p.cool.v, 7);
  assert.ok(!Array.isArray(p.sets) || p.sets.length === 15, "no debe tragar el calentamiento como serie " + JSON.stringify(p));
}

function checkMergeStripsSets() {
  const leftover = {
    cal: 7, cv: 8.5, t: 180, dt: 60, dv: 0, cool: { min: 5, v: 6.5 },
    sets: [{ v: 10, inc: 1.5 }, { v: 11, inc: 1.5 }],
    nota: R2,
  };
  const next = applyParsedProtocol(leftover, parseNota(R2));
  assert.equal(next.v, 12, "VEL no puede quedar undefined/leftover");
  assert.ok(next.v !== undefined);
  assert.ok(!Array.isArray(next.sets), "debe salir de series variables");
  assert.equal(next.n, 12);
  assert.equal(next.t, 60);
  assert.equal(next.inc, 12);
  assert.equal(next.dt, 90);
  assert.equal(next.cv, 9);
  assert.equal(next.cool.v, 6);
  assert.equal(next.nota, R2);
}

function checkHydrateKeepsOtherWeeks() {
  const trote = {
    weeks: {
      "2026-08-17": { res: { p: { cal: 7, cv: 8.5, n: 15, t: 75, v: 15, inc: 1, dt: 45, dv: 0, cool: { min: 5, v: 7 }, nota: COMPACT } } },
      "2026-08-24": {
        res: { p: { cal: 7, cv: 8.5, n: 3, t: 75, v: 15, inc: 1.5, dt: 45, dv: 0, cool: { min: 5, v: 7 }, nota: R1 }, nx: "keep-me" },
        pot: { p: { cal: 7, cv: 8.5, t: 180, dt: 60, dv: 0, cool: { min: 5, v: 6.5 }, n: 12, inc: 12, nota: R2 } },
      },
    },
    runs: [{ id: "x" }],
  };
  const h = hydrateTroteFromNotas(trote);
  assert.equal(h.weeks["2026-08-24"].res.nx, "keep-me");
  assert.equal(h.weeks["2026-08-24"].res.p.nota, R1);
  assert.equal(h.weeks["2026-08-24"].pot.p.nota, R2);
  assert.equal(h.weeks["2026-08-24"].pot.p.v, 12);
  assert.ok(Array.isArray(h.weeks["2026-08-24"].res.p.sets));
  assert.equal(h.weeks["2026-08-24"].res.p.sets[2].dt, 150);
  assert.equal(h.weeks["2026-08-17"].res.p.n, 15);
  assert.equal(h.weeks["2026-08-17"].res.p.v, 15);
  assert.deepEqual(h.runs, [{ id: "x" }]);
}

const tests = [
  ["R1 resistencia variable", checkR1],
  ["R2 potencia uniforme VEL=12", checkR2],
  ["R3 dictado distinto", checkR3],
  ["compacto coach", checkCompact],
  ["nota vieja potencia (rondas)", checkOldPot],
  ["estilo legacy 1 min 15 secs", checkLegacy],
  ["merge quita leftover sets y pone v", checkMergeStripsSets],
  ["hydrate no borra notas ni otras semanas", checkHydrateKeepsOtherWeeks],
];

let failed = 0;
tests.forEach(([name, fn]) => {
  try {
    fn();
    console.log("ok  " + name);
  } catch (e) {
    failed++;
    console.log("FAIL " + name);
    console.log("    " + (e && e.stack ? e.stack : e));
  }
});
if (failed) {
  console.log("\n" + failed + " failed");
  process.exit(1);
}
console.log("\n" + tests.length + " passed");
