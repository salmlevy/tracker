/* Sesión Sin gym: en casa o de viaje, ~40 min, peso corporal.
   Cero equipo y cero carga axial. No es un modo de intensidad del gym:
   la lista es fija (movilidad suave + 3 series de 5 ejercicios).
   Una sesión terminada vive en el mismo historial y cuenta para la meta
   semanal. No cierra el hueco de fuerza del gym (eso lo filtra regreso). */

import { estimateMin } from "./modo.js";

export const SIN_GYM_ID = "S";
export const SIN_GYM_MIN = 40;

const rep = (n, r) => Array.from({ length: n }, () => [0, r]);

const TRABAJO = ["sg1", "sg2", "sg3", "sg4", "sg5"];
const MOVILIDAD = ["sg6", "sg7", "sg8", "sg9"];

export const SIN_GYM_DAY = {
  name: "Sin gym",
  mus: "Sin equipo · peso corporal",
  sinGym: true,
  secs: [
    {
      t: "Movilidad",
      note: "En el piso, suave. Sin peso, sin saltos y sin cargar la columna.",
      ids: MOVILIDAD,
    },
    {
      t: "Circuito",
      note: "3 series. Peso corporal. Descansa lo que necesites entre series.",
      ids: TRABAJO,
    },
  ],
  ex: [
    {
      id: "sg6",
      n: "Gato-camello",
      lbl: "reps",
      u: "lb",
      type: "body",
      nSets: 2,
      rng: [6, 8],
      cues: [
        "En cuatro puntos, manos bajo los hombros",
        "Redondea y arquea en un rango corto, sin forzar el final",
        "La cadera no gira: solo sube y baja la espalda",
      ],
      prev: rep(2, 6),
    },
    {
      id: "sg7",
      n: "Apertura de cadera",
      lbl: "segundos",
      u: "lb",
      type: "time",
      nSets: 2,
      rng: [30, 40],
      cues: [
        "Sentado en el piso, plantas juntas o rodillas abiertas",
        "El pecho queda alto. Si tira, te sientas sobre un cojín",
        "Mueves la cadera, no la zona lumbar",
      ],
      prev: rep(2, 30),
      alt: {
        n: "Estiramiento de piriforme sentado",
        lbl: "segundos",
        factor: 0,
        type: "time",
        cues: [
          "Sentado, un tobillo sobre la rodilla contraria",
          "El pecho sigue alto, sin redondear la lumbar",
          "Si no llegas, flexiona menos la cadera",
        ],
      },
    },
    {
      id: "sg8",
      n: "Rotación torácica en cuatro puntos",
      lbl: "reps / lado",
      u: "lb",
      type: "body",
      nSets: 2,
      rng: [6, 8],
      cues: [
        "En cuatro puntos, la cadera quieta mirando al piso",
        "Una mano en la nuca y giras solo el pecho hacia el techo",
        "No es un crunch: la lumbar no se flexiona ni se carga",
      ],
      prev: rep(2, 6),
    },
    {
      id: "sg9",
      n: "Postura del niño",
      lbl: "segundos",
      u: "lb",
      type: "time",
      nSets: 2,
      rng: [20, 30],
      cues: [
        "Rodillas abiertas, cadera hacia los talones",
        "Brazos largos al frente, frente hacia el piso",
        "Si la lumbar molesta, no llegues tan atrás",
      ],
      prev: rep(2, 20),
    },
    {
      id: "sg1",
      n: "Puente de glúteo",
      lbl: "reps",
      u: "lb",
      type: "body",
      nSets: 3,
      rng: [12, 15],
      cues: [
        "Boca arriba, pies en el piso, rodillas flexionadas",
        "Sube la cadera apretando glúteos y pausa un segundo arriba",
        "La lumbar no empuja: si arqueas, acorta el rango",
      ],
      prev: rep(3, 12),
      alt: {
        n: "Puente a una pierna",
        lbl: "reps / lado",
        factor: 0,
        type: "body",
        cues: [
          "La pierna que descansa queda estirada, sin cruzar el cuerpo",
          "La cadera no se cae ni gira",
          "Si la lumbar empuja, vuelve al puente con las dos piernas",
        ],
      },
    },
    {
      id: "sg2",
      n: "Flexiones",
      lbl: "reps",
      u: "lb",
      type: "body",
      nSets: 3,
      rng: [8, 12],
      cues: [
        "Manos en el piso, cuerpo en una línea",
        "Baja el pecho con control y empuja el piso",
        "Si el hombro pincha, pásate a la variante contra un mueble",
      ],
      prev: rep(3, 8),
      alt: {
        n: "Flexiones contra un mueble",
        lbl: "reps",
        factor: 0,
        type: "body",
        cues: [
          "Manos en una mesa, barra o respaldo firme",
          "El cuerpo sigue en línea, de los pies a la cabeza",
          "Cuanto más vertical, más fácil. Sin saltar al bajar",
        ],
      },
    },
    {
      id: "sg3",
      n: "Bird-dog",
      lbl: "reps / lado",
      u: "lb",
      type: "body",
      nSets: 3,
      rng: [8, 8],
      cues: [
        "En cuatro puntos, lumbar quieta",
        "Brazo y pierna opuestos a la vez, lento",
        "No gires la cadera para subir más la pierna",
      ],
      prev: rep(3, 8),
      alt: {
        n: "Dead-bug",
        lbl: "reps / lado",
        factor: 0,
        type: "body",
        cues: [
          "Boca arriba, lumbar apoyada suave en el piso",
          "Bajas el brazo y la pierna contraria",
          "Si la espalda se despega, acortas el recorrido",
        ],
      },
    },
    {
      id: "sg4",
      n: "Elevaciones de pantorrilla",
      lbl: "reps",
      u: "lb",
      type: "body",
      nSets: 3,
      rng: [12, 15],
      cues: [
        "De pie, te apoyas en una pared si hace falta el equilibrio",
        "Sube sobre las puntas y baja lento, sin rebote",
        "Las rodillas siguen casi rectas, sin saltar",
      ],
      prev: rep(3, 12),
      alt: {
        n: "Pantorrilla a una pierna en el piso",
        lbl: "reps / lado",
        factor: 0,
        type: "body",
        cues: [
          "Una mano en la pared, un pie trabaja y el otro descansa",
          "Sube y baja solo el tobillo, sin impulsar con la rodilla",
          "Si pierdes el equilibrio, vuelve a las dos piernas",
        ],
      },
    },
    {
      id: "sg5",
      n: "Plancha",
      lbl: "segundos",
      u: "lb",
      type: "time",
      nSets: 3,
      rng: [20, 30],
      cues: [
        "Antebrazos en el piso, glúteo apretado",
        "Cadera arriba, lumbar neutra, y respiras",
        "Si la lumbar tiembla, apoya las rodillas",
      ],
      prev: rep(3, 20),
      alt: {
        n: "Plancha sobre rodillas",
        lbl: "segundos",
        factor: 0,
        type: "time",
        cues: [
          "Rodillas y antebrazos en el piso",
          "La cadera queda en línea con el tronco, no caída",
          "Sigues respirando. Es un sostén, no un crunch",
        ],
      },
    },
  ],
};

export function esSinGym(value) {
  if (!value) return false;
  if (typeof value === "string") return value === SIN_GYM_ID;
  return value.sinGym === true || value.day === SIN_GYM_ID;
}

export function diaSinGym() {
  return SIN_GYM_DAY;
}

export function minutosSinGym() {
  return estimateMin(SIN_GYM_DAY);
}

export function ejerciciosSinGym() {
  return SIN_GYM_DAY.ex.slice();
}
