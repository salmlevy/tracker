import assert from "node:assert/strict";
import {
  HABITUAL_ID, MAQUINA_NAVY_A1, TECHNOGYM_ID, aUnidad, armarSugerencia, asegurarGyms, esCargaAxial,
  gymDeSerie, gymDeSesion, gymHabitual, incrementoDefault, inferirIncremento, marcaDeTexto, normalizarGym, notasTechnogymKg, pasoEnBanda, pesoSugerido,
  proponerGym, sellarSesion, sesionTechnogymInequivoca, textoSugerencia, usarHistorialPropio,
} from "./gyms.js";

const notaReal = "Estoy usando otra máquina de technogym todos los ejercicios están en kilos ";
const notaReal2 = "Está máquina se otro gym el peso es se siente más todas las máquinas son technogym para todos los ejercicis";

const nov3 = {
  date: "2026-11-03",
  day: "C",
  energy: "normal",
  note: "",
  logs: {
    c1: { v: "main", note: notaReal, sets: [{ f: true, r: 10, w: 286.6, done: true }] },
    c3: { v: "main", note: notaReal2, sets: [{ f: true, r: 12, w: 71.7, done: true }] },
  },
};
const habitual = {
  date: "2026-11-02",
  day: "A",
  logs: { a1: { v: "main", sets: [{ w: 80, r: 10, done: true, f: true }] } },
};
const snap = JSON.stringify([nov3, habitual]);

assert.equal(sesionTechnogymInequivoca(nov3), true);
assert.equal(notasTechnogymKg("technogym en lbs"), false);
assert.equal(sesionTechnogymInequivoca({ date: "2026-11-03", logs: { c1: { note: "kilos en otra máquina" } } }), false);
assert.equal(sesionTechnogymInequivoca({ date: "2026-11-03", logs: { c1: { note: "technogym pero en lb" } } }), false);
assert.equal(sesionTechnogymInequivoca({ date: "2026-11-04", logs: { c1: { note: "technogym kilos" } } }), false);
assert.equal(sesionTechnogymInequivoca({ date: "2026-11-03", note: "technogym kg", logs: { c1: { note: "también en libras" } } }), false);
assert.equal(sesionTechnogymInequivoca(habitual), false);

const gyms = asegurarGyms([], [nov3, habitual]);
assert.equal(gyms[0].id, HABITUAL_ID);
assert.equal(gyms[0].nombre, "EW");
const navy = gyms.find((g) => g.id === TECHNOGYM_ID);
assert.equal(navy.nombre, "Navy");
assert.equal(navy.marca, "Technogym");
assert.equal(navy.unidad, "kg");
assert.equal(navy.incremento, 5);
assert.equal(JSON.stringify([nov3, habitual]), snap, "no altera el historial");
assert.equal(nov3.logs.c1.sets[0].w, 286.6);
assert.equal(gymDeSesion(nov3, gyms), TECHNOGYM_ID);
assert.equal(gymDeSesion(habitual, gyms), HABITUAL_ID);
assert.equal(gymDeSesion({ date: "2026-08-01", day: "A", logs: {} }, gyms), HABITUAL_ID);
assert.equal(gymDeSerie(nov3.logs.c1.sets[0], nov3, gyms), TECHNOGYM_ID);

const otraVez = asegurarGyms(gyms, [nov3]);
assert.equal(otraVez.filter((g) => g.id === TECHNOGYM_ID).length, 1);

const propio = { id: "gym-custom", nombre: "Polo", marca: "Technogym", unidad: "kg", incremento: 2.5, lat: null, lng: null };
const conPropio = asegurarGyms([gymHabitual(), propio], [nov3]);
assert.equal(conPropio.some((g) => g.id === TECHNOGYM_ID), false);
assert.equal(gymDeSesion(nov3, conPropio), "gym-custom");

assert.equal(usarHistorialPropio([nov3, habitual], "C", "c1", "main", TECHNOGYM_ID, gyms), true);
assert.equal(usarHistorialPropio([nov3, habitual], "A", "a1", "main", TECHNOGYM_ID, gyms), true);
assert.equal(usarHistorialPropio([nov3], "A", "a1", "main", TECHNOGYM_ID, gyms), false);
assert.equal(usarHistorialPropio([nov3, habitual], "A", "a1", "main", HABITUAL_ID, gyms), true);

const viejo = asegurarGyms([{ id: HABITUAL_ID, nombre: "Habitual", marca: "", unidad: "lb", incremento: 5, lat: null, lng: null }, { id: TECHNOGYM_ID, nombre: "Technogym", marca: "Technogym", unidad: "kg", incremento: 5, lat: 1, lng: 2 }], [nov3]);
assert.equal(viejo.find((g) => g.id === HABITUAL_ID).nombre, "EW");
assert.equal(viejo.find((g) => g.id === TECHNOGYM_ID).nombre, "Navy");
assert.equal(viejo.find((g) => g.id === TECHNOGYM_ID).lat, 1);
assert.equal(JSON.stringify([nov3, habitual]), snap, "el renombre no toca el historial");

const gymKg = { id: TECHNOGYM_ID, nombre: "Navy", marca: "Technogym", unidad: "kg", incremento: 5 };
const sug = armarSugerencia({ prevSets: [[80, 10], [80, 9]], tipo: "weight", unidad: "lb", gym: gymKg, nombreOrigen: "EW", nSets: 2 });
assert.equal(sug.pesoGym, 25);
assert.equal(sug.unidad, "kg");
assert.ok(sug.pct >= 0.6 && sug.pct <= 0.7, "pct " + sug.pct);
assert.equal(Math.round(aUnidad(sug.peso, "lb", "kg") * 10) / 10, 25);
assert.match(sug.texto, /empieza en 25 kg/);
assert.match(sug.texto, /de tu último peso en EW/);
assert.match(sug.texto, /Ajústalo/);
assert.equal(sug.sets.length, 2);
assert.equal(sug.sets[0].r, 10);

for (const ref of [40, 80, 100, 115, 200]) {
  for (const inc of [2.5, 5, 10]) {
    const s = pesoSugerido(ref, "lb", { unidad: "kg", incremento: inc }, "weight");
    const enLb = aUnidad(s.pesoGym, "kg", "lb");
    assert.ok(enLb <= ref * 0.7 + 1e-6, ref + " lb inc " + inc + " pasa de 70%: " + s.pesoGym);
    const cabe = pasoEnBanda(aUnidad(ref, "lb", "kg"), inc, 0.6, 0.7);
    if (cabe > 0 && aUnidad(cabe, "kg", "lb") >= ref * 0.6 - 1e-6) {
      assert.ok(enLb >= ref * 0.6 - 1e-6, ref + " quedó bajo 60%");
    }
  }
}

const ayuda = pesoSugerido(40, "kg", { unidad: "lb", incremento: 5 }, "assist");
assert.ok(aUnidad(ayuda.pesoGym, "lb", "kg") >= 40 - 1e-6, "la ayuda no baja");
assert.equal(ayuda.pct, null);
assert.match(textoSugerencia(ayuda, "EW"), /de ayuda/);
assert.match(textoSugerencia(ayuda, "EW"), /de tu último peso en EW/);

assert.equal(armarSugerencia({ prevSets: [[0, 12]], tipo: "body", unidad: "lb", gym: gymKg, nSets: 1 }), null);
assert.equal(esCargaAxial("Sentadilla con barra"), true);
assert.equal(esCargaAxial("Peso muerto rumano"), true);
assert.equal(esCargaAxial("Press militar de pie"), true);
assert.equal(esCargaAxial("Prensa de pierna"), false);
assert.equal(esCargaAxial("Hip Thrust Máquina"), false);

const antes = JSON.parse(JSON.stringify(habitual));
const sellada = sellarSesion(habitual, TECHNOGYM_ID);
assert.equal(sellada.gymId, TECHNOGYM_ID);
assert.equal(sellada.logs.a1.sets[0].gymId, TECHNOGYM_ID);
assert.equal(sellada.logs.a1.sets[0].w, 80);
assert.deepEqual(habitual, antes, "sellar no muta la sesión original");
assert.equal(gymDeSerie({}, { date: "2026-08-01" }, gyms), HABITUAL_ID);

const aqui = { lat: 19.4326, lng: -99.1332 };
const lejos = { lat: 19.5, lng: -99.3 };
const conLugar = [
  gymHabitual(),
  { ...gymKg, lat: aqui.lat, lng: aqui.lng },
];
const propuesta = proponerGym(conLugar, aqui, HABITUAL_ID);
assert.equal(propuesta.gymId, TECHNOGYM_ID);
assert.equal(proponerGym(conLugar, aqui, TECHNOGYM_ID), null);
assert.equal(proponerGym(conLugar, lejos, HABITUAL_ID), null);
assert.equal(proponerGym([gymHabitual()], aqui, HABITUAL_ID), null);

assert.equal(MAQUINA_NAVY_A1, "poleas");
assert.equal(esCargaAxial(MAQUINA_NAVY_A1), false);
const navySemilla = gyms.find((g) => g.id === TECHNOGYM_ID);
assert.equal(navySemilla.maquinas.a1.nombre, MAQUINA_NAVY_A1);
assert.equal(navySemilla.maquinas.a1.semilla, true);
assert.equal(navySemilla.maquinas.a1.patron, "press horizontal");
assert.equal(gyms.find((g) => g.id === HABITUAL_ID).maquinas, undefined);
assert.equal(habitual.logs.a1.sets[0].w, 80);
assert.equal(habitual.logs.a1.maquina, undefined);
assert.equal(JSON.stringify([nov3, habitual]), snap, "la semilla no toca sesiones de EW");
const estable = asegurarGyms(gyms, [nov3, habitual]);
assert.equal(JSON.stringify(estable), JSON.stringify(gyms));
const conOtra = asegurarGyms([{ id: TECHNOGYM_ID, nombre: "Navy", marca: "Technogym", unidad: "kg", incremento: 5, lat: 1, lng: 2, maquinas: { a1: { nombre: "Press en poleas", patron: "press horizontal" }, a2: { nombre: "Apertura en poleas", patron: "apertura" } } }], []);
const guardada = conOtra.find((g) => g.id === TECHNOGYM_ID);
assert.equal(guardada.maquinas.a1.nombre, "Press en poleas");
assert.equal(guardada.maquinas.a1.semilla, undefined);
assert.equal(guardada.maquinas.a2.nombre, "Apertura en poleas");
assert.equal(guardada.lat, 1);
assert.equal(conPropio.find((g) => g.id === "gym-custom").maquinas, undefined);
const norm = normalizarGym({ id: TECHNOGYM_ID, nombre: "Navy", unidad: "kg", incremento: 5, maquinas: { a1: { nombre: "Peso muerto", semilla: true }, a2: { nombre: "Remo en polea", patron: "remo" } } });
assert.equal(norm.maquinas.a1, undefined);
assert.equal(norm.maquinas.a2.nombre, "Remo en polea");
assert.equal(incrementoDefault("Technogym", "kg"), 5);
assert.equal(incrementoDefault("Technogym", "lb"), 10);
assert.equal(incrementoDefault("Otra", "lb"), 10);
assert.equal(inferirIncremento([25, 30, 35], "kg"), 5);
assert.equal(inferirIncremento([20, 30, 40], "lb"), 10);
assert.equal(inferirIncremento([22.5, 25], "kg"), 2.5);
assert.equal(inferirIncremento([], "kg"), null);
assert.equal(normalizarGym({ nombre: "Casa", unidad: "lb" }).incremento, 10);
assert.equal(normalizarGym({ nombre: "Navy", marca: "Technogym", unidad: "kg", incremento: 5 }).incremento, 5);
assert.equal(normalizarGym({ nombre: "Navy", marca: "Technogym", unidad: "kg", incremento: 5 }).nombre, "Navy");
assert.equal(normalizarGym({ nombre: "Navy", marca: "Technogym", unidad: "kg", incremento: 5 }).marca, "Technogym");
assert.equal(marcaDeTexto("IMG_technogym_press.jpg"), "Technogym");
assert.equal(marcaDeTexto("foto del patio"), "");

console.log("gyms ok");
