import assert from "node:assert/strict";
import {
  CAMBIOS, cambioForEx, cambiosDeGym, cambiosDeHome, cambiosDeRunning, cambiosDeSesion, dismissCambio, feedbackEventProps,
  pendingCambios, recordFeedback, saveCambioTexto,
} from "./cambios.js";

assert.equal(CAMBIOS.filter((c) => c.cuando === "ejercicio").length, 7);
assert.deepEqual(CAMBIOS.map((c) => c.ex).filter(Boolean).sort(), ["a6", "b10r", "c11", "c4", "c9", "h1", "h3"]);
assert.equal(cambioForEx({}, "a6").id, "a6_barra_total");
assert.equal(cambioForEx({}, "a6").nombre, "Press inclinado: peso total con barra");

assert.equal(cambioForEx({}, "c4").id, "c4_gif_maquina");
assert.equal(cambioForEx({}, "c1"), null);
assert.equal(cambiosDeSesion({}).length, 13);
assert.equal(CAMBIOS.find((c) => c.id === "h1_por_lado_polea").nombre, "Rotación externa: reps por lado, gif y polea");
assert.equal(CAMBIOS.find((c) => c.id === "h3_gif_video").nombre, "Escapción: gif y video del ejercicio");
assert.equal(CAMBIOS.find((c) => c.id === "b10r_pullup_neutro").nombre, "Pull-up asistido con agarre neutro");
assert.equal(CAMBIOS.find((c) => c.id === "timer_trabajo_grande").cuando, "sesion");
assert.equal(CAMBIOS.find((c) => c.id === "header_scroll").cuando, "sesion");
assert.equal(CAMBIOS.find((c) => c.id === "sesion_pintura").cuando, "sesion");
assert.equal(CAMBIOS.find((c) => c.id === "catalogo_gif_video").cuando, "sesion");
assert.equal(CAMBIOS.find((c) => c.id === "hombro_rehab").nombre, "Modo rehab de hombro derecho");
assert.equal(CAMBIOS.find((c) => c.id === "modo_al_empezar").nombre, "Elegir modo al empezar (Relajado, Normal, Espartano)");
assert.equal(cambiosDeSesion({}).some((c) => c.id === "notas_adjuntos"), true);
assert.equal(CAMBIOS.find((c) => c.id === "notas_adjuntos").nombre, "Adjuntar foto");
assert.equal(cambiosDeHome({}).length, 6);
assert.equal(CAMBIOS.find((c) => c.id === "metas_hoy").nombre, "Hoy toca arriba y metas chicas de hoy");
assert.equal(CAMBIOS.find((c) => c.id === "motivacion_en_tarjeta").cuando, "home");
assert.equal(CAMBIOS.find((c) => c.id === "notas_iconos").cuando, "sesion");
assert.equal(cambiosDeGym({}).length, 1);
assert.equal(cambiosDeGym({})[0].id, "dias_calendario");
assert.equal(cambiosDeRunning({}).length, 2);
assert.equal(cambiosDeRunning({})[0].nombre, "Elegir Potencia, Resistencia, Largo o Libre");
assert.equal(cambiosDeRunning({})[1].id, "cierre_running");
assert.equal(CAMBIOS.find((c) => c.id === "elegir_fecha").nombre, "Elegir fecha y hora al guardar");
assert.equal(CAMBIOS.find((c) => c.id === "meta_semanal").cuando, "home");
assert.equal(CAMBIOS.find((c) => c.id === "little_wins_regreso").nombre, "Little wins y regreso sin culpa");
assert.equal(cambiosDeHome({})[0].nombre, "Little wins y regreso sin culpa");
assert.equal(cambiosDeHome({})[1].nombre, "Inicio sin Logros, solo lo que toca hoy");
assert.equal(cambiosDeSesion({}).some((c) => c.id === "inicio_solo_hoy"), false);
assert.equal(CAMBIOS.every((c) => typeof c.nombre === "string" && c.nombre.length > 0), true);

const once = recordFeedback({}, { id: "c4_gif_maquina", util: true });
assert.equal(cambioForEx(once, "c4"), null);
assert.equal(pendingCambios(once).length, CAMBIOS.length - 1);

const no = recordFeedback({}, { id: "c9_tiempo_real", util: false, texto: "el timer se adelanta" });
assert.equal(no.texto.c9_tiempo_real, "el timer se adelanta");
assert.equal(no.answered.c9_tiempo_real.util, false);
const withText = saveCambioTexto(no, "c9_tiempo_real", "  que el check siga a mano  ");
assert.equal(withText.texto.c9_tiempo_real, "que el check siga a mano");

const gone = dismissCambio({}, "notas_teclado");
assert.equal(cambiosDeSesion(gone).some((c) => c.id === "notas_teclado"), false);
assert.equal(gone.answered.notas_teclado, undefined);

const props = feedbackEventProps(CAMBIOS[0], false);
assert.deepEqual(props, { cambio_id: "c4_gif_maquina", util: false, ex: "c4" });
assert.equal("texto" in props, false);
const sesion = feedbackEventProps(cambiosDeSesion({})[0], true);
assert.equal(sesion.ex, undefined);
assert.equal(sesion.util, true);
assert.equal(sesion.cambio_id, "reapertura_ejercicio");

console.log("cambios.test.js ok");
