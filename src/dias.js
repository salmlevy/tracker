import { stampVariante } from "./variantes.js";

/* ============ CATÁLOGO ============ */
export const DAYS = {
  A: {
    name: "Push", mus: "Pecho · Hombros · Tríceps",
    secs: [
      { t: "Pecho · fuerza base", ids: ["a1", "a2"] },
      { t: "Hombros", note: "Entran frescos a propósito: el orden importa", ids: ["a3", "a4", "a5"] },
      { t: "Pecho · ángulo superior", ids: ["a6", "a7"] },
      { t: "Tríceps", ids: ["a8", "a9"] },
      { t: "Cierre · peso corporal", ids: ["a10", "a11"] },
    ],
    ex: [
      { id: "a1", n: "Chest Press TRUE", lbl: "stack total", u: "lb", step: 5, rng: [8, 12], cues: ["Escápulas retraídas y pegadas", "Codos a 45°, no abiertos", "Espalda completa al respaldo"], prev: [[115,11],[115,11],[115,11],[115,11]], alt: { n: "Press Mancuernas Plano", lbl: "× mano", factor: 0.4 } },
      { id: "a2", n: "Pec Deck", lbl: "stack", u: "lb", step: 5, rng: [8, 12], cues: ["ROM completo", "1 seg de squeeze al centro", "No bloquees en la apertura"], prev: [[120,11],[120,11],[120,11],[120,11]], alt: { n: "Aperturas en Cable", lbl: "× lado", factor: 0.3 } },
      { id: "a3", n: "Shoulder Press TRUE", lbl: "× lado", u: "lb", step: 5, rng: [8, 12], cues: ["Lumbar apoyada siempre", "Sube sin bloquear codos", "Hombro fresco: aprovéchalo"], prev: [[80,11],[80,11],[80,11]], alt: { n: "Press Arnold Mancuerna", lbl: "× mano", factor: 0.5 } },
      { id: "a4", n: "Elev. Frontales", lbl: "lbs", u: "lb", step: 5, rng: [12, 15], cues: ["Sin inercia, sube controlado", "Hasta altura de hombro", "Técnica sobre peso"], prev: [[30,13],[30,13],[30,13]], alt: { n: "Cable Frontal Un Brazo", lbl: "× lado", factor: 0.5 } },
      { id: "a5", n: "Elev. Laterales", lbl: "× mano", u: "lb", step: 5, rng: [12, 15], cues: ["Codo suave, no rígido", "Cero trapecio: no encojas", "Bajada lenta"], prev: [[20,15],[20,15],[20,15]], alt: { n: "Cable Lateral Un Brazo", lbl: "× lado", factor: 0.5 } },
      { id: "a6", n: "Press Inclinado Barra", lbl: "total con barra", u: "lb", step: 5, rng: [8, 12], cues: ["Banco a 30°", "Agarre un poco más ancho que los hombros", "Baja la barra al pecho alto, sin rebotar"], prev: [[65,11],[70,11],[70,8]], alt: { n: "Press Máquina Inclinado", lbl: "stack", factor: 2.2 } },
      { id: "a7", n: "Crossover mancuernas", lbl: "× mano", u: "lb", step: 5, rng: [12, 15], cues: ["Mancuernas de abajo hacia arriba", "Codos semiflexionados fijos", "Aprieta 1 seg al cruzar arriba"], prev: [[25,13],[25,13],[25,13]], alt: { n: "Aperturas DB Planas", lbl: "× mano", factor: 1 } },
      { id: "a8", n: "Rompecocos", lbl: "barra EZ", u: "lb", step: 5, rng: [8, 12], cues: ["Codos fijos al techo", "Baja a la frente controlado", "Cierra con press explosivo, misma barra"], prev: [[60,9],[60,9],[60,9]], alt: { n: "Extensión Sobre Cabeza DB", lbl: "mancuerna", factor: 0.8 } },
      { id: "a9", n: "Extensión Polea", lbl: "stack", u: "lb", step: 4, rng: [12, 15], cues: ["Codos pegados al torso", "Abre la cuerda al final", "Salto de +4 lbs"], prev: [[42,13],[42,13],[42,13]], alt: { n: "Patada de Tríceps DB", lbl: "× mano", factor: 0.4 } },
      { id: "a10", n: "Fondos Asistidos", lbl: "asistencia", u: "kg", step: 5, rng: [6, 10], type: "assist", cues: ["Torso ligeramente al frente", "Codos hacia atrás", "Menos asistencia = progreso"], prev: [[31.8,7],[27.2,7],[22.7,7]], alt: { n: "Fondos en banco", lbl: "reps", factor: 0 } },
      { id: "a11", n: "Push-ups (rodillas)", lbl: "reps", u: "lb", type: "body", rng: [6, 12], cues: ["Rodillas apoyadas, cadera en línea", "Manos elevadas", "Core apretado"], prev: [[0,8],[0,8],[0,8]], alt: { n: "Push-ups", lbl: "reps", factor: 1 } },
    ],
  },
  B: {
    name: "Pull", mus: "Espalda · Bíceps",
    secs: [
      { t: "Espalda · anchura", ids: ["b1"] },
      { t: "Espalda · densidad", ids: ["b2", "b3", "b4"] },
      { t: "Progresión pull-up", note: "Fase 3: rumbo al pull-up estricto", ids: ["b10", "b5"] },
      { t: "Bíceps", ids: ["b6", "b7", "b8"] },
      { t: "Core lumbar seguro", ids: ["b9", "b11"] },
    ],
    ex: [
      { id: "b1", n: "Jalón", lbl: "stack", u: "lb", step: 15, rng: [8, 12], cues: ["Pecho arriba", "Codos al bolsillo", "Sin balanceo del torso"], prev: [[132.3,11],[132.3,11],[132.3,11],[132.3,11]], alt: { n: "Pull-over en Polea", lbl: "stack", factor: 0.6 } },
      { id: "b2", n: "Low Row", lbl: "stack", u: "lb", step: 5, rng: [8, 12], cues: ["Tiro horizontal de cable", "Escápulas atrás al final", "Sin impulso lumbar"], prev: [[132.3,11],[132.3,11],[132.3,11],[132.3,11]], alt: { n: "Remo Máquina", lbl: "stack", factor: 1 } },
      { id: "b3", n: "Remo Mancuerna", lbl: "× lado", u: "lb", step: 5, rng: [8, 12], cues: ["Rodilla y mano al banco", "Espalda neutra siempre", "Codo pegado al cuerpo"], prev: [[80,11],[80,11],[80,11]], alt: { n: "Remo Cable Un Brazo", lbl: "× lado", factor: 0.6 } },
      { id: "b4", n: "Remo pecho apoyado", lbl: "× mano", u: "lb", step: 5, rng: [8, 12], cues: ["Pecho pegado al pad inclinado", "Dos mancuernas a la vez", "Jala con la espalda, no el brazo"], prev: [[55,12],[55,12],[55,12]], alt: { n: "Remo pecho 1 brazo", lbl: "× lado", factor: 1 } },
      /* b5 stays chin-up so past logs keep the same key. New primary in this block is b10. */
      { id: "b5", n: "Chin-up asistido", lbl: "asistencia", u: "kg", step: 5, rng: [5, 8], type: "assist", cues: ["Agarre supino (palmas a ti)", "Pecho a la barra", "Baja lento: ahí está el progreso"], prev: [[45,8],[40,6],[40,6]], alt: { n: "Chin-up con banda", lbl: "reps", factor: 0 } },
      { id: "b10", n: "Pull-up asistido", lbl: "asistencia", u: "kg", step: 5, rng: [5, 8], type: "assist", cues: ["Agarre prono (palmas adelante)", "Hombros abajo, pecho a la barra", "Baja lento: ahí está el progreso"], prev: [[45,8],[40,6],[40,6]], fresh: true, alt: { n: "Pull-up con banda", lbl: "reps", factor: 0 } },
      { id: "b6", n: "Curl EZ", lbl: "barra", u: "lb", step: 5, rng: [8, 12], cues: ["Codos fijos a los costados", "Si aparece balanceo: baja peso, no calidad", "Aprieta 1 seg arriba"], prev: [[70,11],[70,10],[70,8]], alt: { n: "Curl Barra en Polea", lbl: "stack", factor: 0.8 } },
      { id: "b7", n: "Curl Martillo", lbl: "× mano", u: "lb", step: 5, rng: [8, 12], cues: ["Muñeca neutra", "Control total en bajada", "Sin impulso de hombro"], prev: [[35,8],[35,8],[35,8]], alt: { n: "Curl Cuerda en Polea", lbl: "stack", factor: 1.2 } },
      { id: "b8", n: "Curl Inclinado", lbl: "× mano", u: "lb", step: 5, rng: [12, 15], nSets: 3, cues: ["Banco a 45°", "Estiramiento completo abajo", "Sube sin mover el codo"], prev: [[20,10],[15,9],[15,9]], alt: { n: "Curl concentrado", lbl: "× mano", factor: 1 } },
      { id: "b9", n: "Bird-dog", lbl: "reps / lado", u: "lb", type: "body", rng: [10, 15], cues: ["Manos y rodillas, lumbar quieta", "Brazo y pierna opuestos a la vez", "Lento: no gires la cadera"], prev: [[0,15],[0,15],[0,15]], alt: { n: "Dead-bug", lbl: "reps / lado", factor: 1 } },
      { id: "b11", n: "Hiperextensión", lbl: "disco", u: "lb", step: 5, rng: [10, 15], cues: ["Cadera en el pad, lumbar neutra", "Sube hasta la línea del cuerpo, no más", "Baja controlado, sin rebote"], prev: [[0,12],[0,12],[0,12]], fresh: true, alt: { n: "Hiperextensión máquina", lbl: "stack", factor: 1 } },
    ],
  },
  C: {
    name: "Legs + Core", mus: "Piernas · Core",
    secs: [
      { t: "Base pesada", note: "Lo más demandante primero, con energía completa", ids: ["c1", "c2"] },
      { t: "Cuádriceps", ids: ["c3"] },
      { t: "Glúteo y cadera", note: "Bloque reforzado: glúteo era tu grupo con menos volumen semanal", ids: ["c4", "c11", "c5", "c6"] },
      { t: "Pantorrilla", ids: ["c8"] },
      { t: "Core · cierre", ids: ["c7", "c12", "c9", "c10"] },
    ],
    ex: [
      { id: "c1", n: "Prensa de Pierna", lbl: "× lado", u: "lb", step: 5, rng: [8, 12], cues: ["Lumbar pegada al respaldo", "No bloquees rodillas", "Baja hasta 90° controlado"], prev: [[170,12],[215,12],[260,12],[285,12]], alt: { n: "Prensa 1 Pierna", lbl: "× pierna", factor: 0.5 } },
      { id: "c2", n: "Curl Femoral", lbl: "stack", u: "lb", step: 5, rng: [12, 15], cues: ["Cadera pegada al banco", "No la despegues al subir", "Control en la bajada"], prev: [[90,14],[90,14],[90,14],[90,14]], alt: { n: "Curl Femoral de Pie", lbl: "× pierna", factor: 0.5 } },
      { id: "c3", n: "Ext. Cuádriceps", lbl: "stack", u: "lb", step: 5, rng: [12, 15], cues: ["Pausa 1 seg arriba", "Baja controlado", "Sin latigazo de rodilla"], prev: [[120,15],[120,15],[120,15],[120,15]], alt: { n: "Ext. 1 pierna", lbl: "× pierna", factor: 0.5 } },
      { id: "c4", n: "Hip Thrust Máquina", lbl: "stack", u: "lb", step: 5, rng: [12, 15], cues: ["Barbilla al pecho", "Aprieta glúteo 1 seg arriba", "Sin arquear la lumbar"], prev: [[180,13],[180,13],[180,13]], alt: { n: "Puente Glúteo DB", lbl: "mancuerna", factor: 0.6 } },
      { id: "c5", n: "Abductor (abre)", lbl: "stack", u: "lb", step: 5, rng: [12, 15], cues: ["ABductor = ABre hacia afuera", "Trabaja glúteo medio (externo)", "Torso quieto, sin rebotes"], prev: [[120,14],[120,14],[120,14]], alt: { n: "Elev. lateral de pierna", lbl: "× pierna", factor: 0.3 } },
      { id: "c6", n: "Aductor (cierra)", lbl: "stack", u: "lb", step: 5, rng: [12, 15], cues: ["ADuctor = junta hacia aDentro", "Trabaja cara interna del muslo", "Rango completo antes que carga"], prev: [[95,14],[95,14],[95,14]], alt: { n: "Aducción en polea", lbl: "× pierna", factor: 0.4 } },
      { id: "c7", n: "Ab Crunch (tempo)", lbl: "stack · máquina al tope", u: "lb", step: 10, rng: [12, 20], cues: ["Piernas suben y tronco baja; codos libres", "Baja en 3 seg, pausa 1 seg abajo", "Máquina en su tope: el tempo sustituye al peso"], prev: [[200,21],[200,16],[200,16]], alt: { n: "Crunch en Polea Alta", lbl: "stack", factor: 0.5 } },
      { id: "c8", n: "Talones Sentado", lbl: "stack", u: "lb", step: 5, rng: [12, 15], cues: ["Pausa abajo en estiramiento", "Sube al máximo", "Sin rebote"], prev: [[130,13],[130,13],[130,13]], alt: { n: "Talones de pie", lbl: "stack", factor: 1 } },
      { id: "c11", n: "Extensión de Cadera en Máquina", lbl: "× lado", u: "lb", step: 5, rng: [12, 15], cues: ["De pie: la otra pierna solo apoya en el piso", "Empuja el rodillo atrás y aprieta glúteo 1 seg", "Tronco quieto, sin arquear la lumbar"], prev: [[45,12],[45,12],[40,12]], fresh: true, alt: { n: "Patada de Glúteo en Polea", lbl: "× pierna", factor: 0.5 } },
      { id: "c12", n: "Press Pallof (oblicuos)", lbl: "× lado", u: "lb", step: 4, rng: [10, 15], cues: ["Anti-rotación: resiste el giro, no gires", "Brazos extendidos al frente, core firme", "Cero flexión lumbar: ideal para tu columna", "Salto de +4 lbs"], prev: [[20,12],[20,12],[20,12]], alt: { n: "Pallof vertical", lbl: "× lado", factor: 0.8 } },
      { id: "c9", n: "Plancha", lbl: "segundos", u: "lb", type: "time", rng: [40, 60], cues: ["Glúteo apretado", "Cadera arriba, lumbar neutra", "Respira"], prev: [[0,95],[0,60],[0,45]], alt: { n: "Plancha sobre rodillas", lbl: "segundos", factor: 1 } },
      { id: "c10", n: "Reverse Crunch", lbl: "reps", u: "lb", type: "body", rng: [8, 15], cues: ["Banca inclinada ~10°: en plana ya tocaste el tope de reps", "Lumbar pegada al banco", "Sube pelvis con control", "Lento cuenta doble"], prev: [[0,12],[0,12],[0,12]], opts: [{ id: "flat", n: "Plana" }, { id: "dec10", n: "Declive ~10°" }], optDefault: "dec10", alt: { n: "Knee tucks", lbl: "reps", factor: 1 } },
    ],
  },
};
export const ORDER = ["A", "B", "C"];
Object.values(DAYS).forEach((day) => day.ex.forEach(stampVariante));
