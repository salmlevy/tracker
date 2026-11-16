/* Ajustes de Navy que no reescriben el historial.
   14 nov: b5 y b10 son banda, sin máquina asistida.
   16 nov: c12 tiene Russian twist cuando las poleas están ocupadas.
   c8 en la prensa se etiqueta como total de las dos piernas. */

import { NOMBRE_NAVY, TECHNOGYM_ID } from "./gyms.js";

export function esNavy(gym) {
  if (!gym) return false;
  return gym.id === TECHNOGYM_ID || gym.nombre === NOMBRE_NAVY;
}

function pasosPull(nombre, agarre) {
  const supino = agarre === "supino";
  const barra = supino
    ? "Agarre supino: palmas hacia ti"
    : "Agarre prono: palmas hacia afuera";
  return [
    {
      id: "main",
      corto: "Banda",
      n: nombre + " con banda",
      lbl: "banda, sin peso",
      type: "band",
      rng: [3, 5],
      siguiente: "negativas",
      cues: [
        "Banda de goma en la barra y en las rodillas o el pie",
        barra,
        "Sin peso y sin lastre. Si llegas a 5 reps en todas, pasa a negativas",
      ],
    },
    {
      id: "neg",
      corto: "Negativas",
      n: nombre + " negativas",
      lbl: "reps",
      type: "body",
      rng: [3, 5],
      siguiente: "isométrico arriba",
      cues: [
        "Sube con un paso o un salto, sin disco ni chaleco",
        "Baja en 3 segundos, " + (supino ? "palmas hacia ti" : "palmas hacia afuera"),
        "Si haces 5 bajadas en todas las series, pasa al isométrico",
      ],
    },
    {
      id: "iso",
      corto: "Arriba",
      n: nombre + " arriba",
      lbl: "segundos",
      type: "time",
      rng: [5, 12],
      siguiente: "sin ayuda",
      cues: [
        "Mentón sobre la barra, sin balanceo",
        "Aguanta arriba. Sin peso extra",
        "Si sostienes 12 s en todas, prueba sin ayuda",
      ],
    },
    {
      id: "libre",
      corto: "Libre",
      n: nombre + " sin ayuda",
      lbl: "reps",
      type: "body",
      rng: [3, 8],
      siguiente: "",
      cues: [
        "Sin banda y sin peso",
        barra,
        "Baja lento, sin balanceo",
      ],
    },
  ];
}

export function pullEnNavy(ex, gym) {
  if (!ex || !esNavy(gym) || (ex.id !== "b5" && ex.id !== "b10")) return ex;
  const supino = ex.id === "b5";
  const pasos = pasosPull(supino ? "Chin-up" : "Pull-up", supino ? "supino" : "prono");
  const banda = pasos[0];
  const libre = pasos[3];
  return {
    ...ex,
    n: banda.n,
    lbl: banda.lbl,
    type: "band",
    rng: banda.rng,
    cues: banda.cues,
    siguiente: banda.siguiente,
    pasos,
    alt: { n: libre.n, lbl: libre.lbl, type: "body", factor: 0, cues: libre.cues },
  };
}

export function b5ConBanda(ex, gym) {
  return pullEnNavy(ex, gym);
}

export function c12EnNavy(ex, gym) {
  if (!ex || ex.id !== "c12" || !esNavy(gym)) return ex;
  return {
    ...ex,
    pasos: [
      { id: "main", corto: "Pallof", n: ex.n, lbl: ex.lbl, cues: ex.cues },
      { id: "alt", corto: "Vertical", n: ex.alt.n, lbl: "× lado", cues: ["La polea sale de abajo", "Empuja al frente sin girar", "Por lado"] },
      {
        id: "twist",
        corto: "Russian",
        n: "Russian twist",
        lbl: "mancuerna, × lado",
        type: "weight",
        cues: [
          "Sentado, pies en el suelo, una mancuerna",
          "El peso es por lado. Hoy: 16 kg × 7",
          "Gira el tronco, sin redondear la lumbar",
        ],
      },
    ],
  };
}

export function c8EnNavy(ex, gym) {
  if (!ex || ex.id !== "c8" || !esNavy(gym)) return ex;
  return {
    ...ex,
    n: "Pantorrilla en prensa",
    lbl: "total, 2 piernas",
    cues: [
      "Las dos piernas en la prensa, solo se mueven los tobillos",
      "El peso es el total de la máquina",
      "Pausa abajo, sin rebote",
    ],
  };
}

export function enNavy(ex, gym) {
  return c8EnNavy(c12EnNavy(pullEnNavy(ex, gym), gym), gym);
}
