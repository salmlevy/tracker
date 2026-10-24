/* Registro de cambios nuevos. Un id por cambio, para preguntar una sola vez.
   El texto de “qué mejoraría” vive en estado.datos, nunca en el evento. */

export const CAMBIOS = [
  { id: "c4_gif_maquina", ex: "c4", fecha: "2026-10-09", cuando: "ejercicio", nombre: "Hip thrust en máquina" },
  { id: "c11_de_pie", ex: "c11", fecha: "2026-10-09", cuando: "ejercicio", nombre: "Patada de pie" },
  { id: "c9_tiempo_real", ex: "c9", fecha: "2026-10-09", cuando: "ejercicio", nombre: "Tiempo de la plancha" },
  { id: "reapertura_ejercicio", ex: "", fecha: "2026-10-09", cuando: "sesion", nombre: "Reabrir el ejercicio" },
  { id: "notas_teclado", ex: "", fecha: "2026-10-09", cuando: "sesion", nombre: "Nota sobre el teclado" },
  { id: "notas_adjuntos", ex: "", fecha: "2026-10-13", cuando: "sesion", nombre: "Adjuntar foto" },
  { id: "a6_barra_total", ex: "a6", fecha: "2026-10-14", cuando: "ejercicio", nombre: "Press inclinado: peso total con barra" },
  { id: "modo_al_empezar", ex: "", fecha: "2026-10-20", cuando: "sesion", nombre: "Elegir modo al empezar (Relajado, Normal, Espartano)" },
  { id: "hombro_rehab", ex: "", fecha: "2026-10-20", cuando: "sesion", nombre: "Modo rehab de hombro derecho" },
  { id: "hombro_rehab_ajustes", ex: "", fecha: "2026-10-20", cuando: "sesion", nombre: "Rehab de hombro: días más cortos y jalón en lugar de pull-ups" },
  { id: "hombro_no_normal_corto", ex: "", fecha: "2026-10-20", cuando: "sesion", nombre: "Normal más corto los días sin dolor de hombro" },
  { id: "little_wins_regreso", ex: "", fecha: "2026-10-22", cuando: "home", nombre: "Little wins y regreso sin culpa" },
  { id: "inicio_solo_hoy", ex: "", fecha: "2026-10-19", cuando: "home", nombre: "Inicio sin Logros, solo lo que toca hoy" },
  { id: "hoy_por_dia_frater", ex: "", fecha: "2026-10-21", cuando: "home", nombre: "Hoy toca según el día y trote corto de frater" },
  { id: "dias_calendario", ex: "", fecha: "2026-10-24", cuando: "gym", nombre: "Los días cuentan por fecha" },
  { id: "elegir_fecha", ex: "", fecha: "2026-10-24", cuando: "sesion", nombre: "Elegir fecha y hora al guardar" },
  { id: "running_tipos", ex: "", fecha: "2026-10-24", cuando: "running", nombre: "Elegir Potencia, Resistencia, Largo o Libre" },
  { id: "meta_semanal", ex: "", fecha: "2026-10-24", cuando: "home", nombre: "Meta semanal arriba" },
  { id: "motivacion_en_tarjeta", ex: "", fecha: "2026-10-24", cuando: "home", nombre: "Little wins y regreso dentro de la meta" },
  { id: "metas_hoy", ex: "", fecha: "2026-10-24", cuando: "home", nombre: "Hoy toca arriba y metas chicas de hoy" },
  { id: "notas_iconos", ex: "", fecha: "2026-10-24", cuando: "sesion", nombre: "Foto, archivo y dictado en las notas" },
  { id: "h1_por_lado_polea", ex: "h1", fecha: "2026-10-24", cuando: "ejercicio", nombre: "Rotación externa: reps por lado, gif y polea" },
  { id: "h3_gif_video", ex: "h3", fecha: "2026-10-24", cuando: "ejercicio", nombre: "Escapción: gif y video del ejercicio" },
  { id: "b10r_pullup_neutro", ex: "b10r", fecha: "2026-10-24", cuando: "ejercicio", nombre: "Pull-up asistido con agarre neutro" },
  { id: "catalogo_gif_video", ex: "", fecha: "2026-10-24", cuando: "sesion", nombre: "Sustituto, gif y video en cada ejercicio" },
  { id: "timer_trabajo_grande", ex: "", fecha: "2026-10-24", cuando: "sesion", nombre: "El trabajo del contador en grande" },
  { id: "header_scroll", ex: "", fecha: "2026-10-24", cuando: "sesion", nombre: "Header visible al subir" },
  { id: "sesion_pintura", ex: "", fecha: "2026-10-24", cuando: "sesion", nombre: "La sesión ya no se pone negra al bajar" },
];

function blank(feedback) {
  const fb = feedback || {};
  return {
    answered: { ...(fb.answered || {}) },
    dismissed: { ...(fb.dismissed || {}) },
    texto: { ...(fb.texto || {}) },
  };
}

export function pendingCambios(feedback, { ex, cuando } = {}) {
  const fb = blank(feedback);
  return CAMBIOS.filter((c) => {
    if (cuando && c.cuando !== cuando) return false;
    if (ex && c.ex !== ex) return false;
    if (fb.answered[c.id] || fb.dismissed[c.id]) return false;
    return true;
  });
}

export function cambioForEx(feedback, exId) {
  return pendingCambios(feedback, { ex: exId, cuando: "ejercicio" })[0] || null;
}

export function cambiosDeSesion(feedback) {
  return pendingCambios(feedback, { cuando: "sesion" });
}

export function cambiosDeHome(feedback) {
  return pendingCambios(feedback, { cuando: "home" });
}

export function cambiosDeGym(feedback) {
  return pendingCambios(feedback, { cuando: "gym" });
}

export function cambiosDeRunning(feedback) {
  return pendingCambios(feedback, { cuando: "running" });
}

export function recordFeedback(feedback, { id, util, texto }) {
  const fb = blank(feedback);
  fb.answered[id] = { util: !!util };
  delete fb.dismissed[id];
  if (util) delete fb.texto[id];
  else if (texto && String(texto).trim()) fb.texto[id] = String(texto).trim().slice(0, 280);
  return fb;
}

export function saveCambioTexto(feedback, id, texto) {
  const fb = blank(feedback);
  const t = String(texto || "").trim().slice(0, 280);
  if (t) fb.texto[id] = t;
  else delete fb.texto[id];
  return fb;
}

export function dismissCambio(feedback, id) {
  const fb = blank(feedback);
  fb.dismissed[id] = true;
  return fb;
}

/* Props del evento. Sin el texto. */
export function feedbackEventProps(cambio, util) {
  const props = { cambio_id: cambio.id, util: !!util };
  if (cambio.ex) props.ex = cambio.ex;
  return props;
}
