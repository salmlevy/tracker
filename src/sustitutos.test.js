import assert from "node:assert/strict";
import { DAYS } from "./dias.js";
import { CORPORAL, diaDeSesion } from "./escala.js";
import { esCargaAxial } from "./gyms.js";
import { crearSustituto, equivalentesDe, lineaMaquina, maquinaDeGym, mediaMaquina, patronDe, registrarMaquina, validarSustituto } from "./sustitutos.js";

const ids = new Set();
for (const dia of ["A", "B", "C"]) {
  for (const modo of ["relajado", "normal", "espartano"]) {
    for (const molestia of [false, true]) {
      diaDeSesion(dia, modo, { molestia, semana: 1 }).ex.forEach((e) => {
        if (String(e.id).startsWith("h") || CORPORAL.has(e.id)) return;
        ids.add(e.id);
      });
    }
  }
}
for (const id of ids) {
  const eq = equivalentesDe(id);
  assert.ok(eq.length >= 2 && eq.length <= 4, id + " tiene " + eq.length);
  assert.ok(patronDe(id), id);
  eq.forEach((e) => {
    assert.equal(esCargaAxial(e.n), false, e.n);
    assert.equal(e.patron, patronDe(id));
  });
}
assert.ok(/columna/.test(validarSustituto("Sentadilla con barra", [])));
assert.ok(/sesión/.test(validarSustituto("Press en poleas", ["Press en poleas"])));
assert.equal(validarSustituto("Press en poleas", ["Remo en polea"]), "");
const creado = crearSustituto({ exId: "a1", nombre: "Press en poleas sentado", tipo: "polea", patron: "press horizontal", usados: [] });
assert.equal(creado.tipo, "polea");
assert.equal(creado.patron, "press horizontal");
const mal = crearSustituto({ exId: "a1", nombre: "Peso muerto", tipo: "maquina", usados: [] });
assert.ok(mal.error);
for (const d of Object.values(DAYS)) {
  d.ex.forEach((e) => assert.equal(esCargaAxial(e.n + " " + ((e.alt && e.alt.n) || "")), false, e.id));
}
const cat = registrarMaquina({}, { nombre: "Press en poleas", patron: "press horizontal", gymId: "habitual", gymNombre: "EW", exId: "a1", peso: 80, unidad: "lb", reps: 10 });
const cat2 = registrarMaquina(cat, { nombre: "Press en poleas", patron: "press horizontal", gymId: "gym-technogym", gymNombre: "Navy", exId: "a1", peso: 25, unidad: "kg", reps: 10 });
assert.equal(cat2[Object.keys(cat2)[0]].gyms.habitual.peso, 80);
assert.equal(cat2[Object.keys(cat2)[0]].gyms["gym-technogym"].peso, 25);
assert.equal(mediaMaquina("Press en poleas", { n: "Chest Press", alt: { n: "Press en poleas" } }).gif, true);
assert.equal(mediaMaquina("Máquina rara del fondo", { n: "Chest Press", alt: { n: "Press mancuernas" } }).gif, false);
const chest = { n: "Chest Press TRUE", alt: { n: "Press Mancuernas Plano" } };
assert.equal(mediaMaquina("Chest press con poleas", chest).gif, false);
assert.equal(lineaMaquina("poleas"), "en poleas");
assert.equal(lineaMaquina("en poleas"), "en poleas");
assert.equal(lineaMaquina("Press en poleas"), "Máquina: Press en poleas");
assert.equal(esCargaAxial("Chest press con poleas"), false);
assert.deepEqual(maquinaDeGym({ maquinas: { a1: { nombre: "Chest press con poleas", semilla: true } } }, "a1"), { nombre: "Chest press con poleas", confirmada: false });
assert.deepEqual(maquinaDeGym({ maquinas: { a1: { nombre: "Press en poleas" } } }, "a1"), { nombre: "Press en poleas", confirmada: true });
assert.equal(maquinaDeGym({ maquinas: { a2: { nombre: "Pec deck" } } }, "a1").nombre, "");
console.log("sustitutos ok", ids.size);
