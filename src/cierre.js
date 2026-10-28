/* Estiramiento final de Running: core y movilidad, 10 a 15 min.
   Hernia L5-S1 y degeneración L4-L5: sin carga axial y sin flexión con rotación.
   La plancha sube de a 5 s si la vez anterior quedó hecha, con tope. */
import { partesZona } from "./calendario.js";

export const CIERRE = [
  {
    id: "deadbug",
    n: "Dead bug",
    dosis: "8 por lado",
    seg: 80,
    texto: "Acostado, apoyas la zona lumbar suave en el suelo. Bajas un brazo y la pierna contraria. Si la espalda se despega, acortas el recorrido.",
  },
  {
    id: "birddog",
    n: "Bird dog",
    dosis: "6 por lado",
    seg: 80,
    texto: "En cuatro puntos, estiras un brazo y la pierna contraria. Mantienes la cadera quieta y vuelves despacio. No gires el tronco.",
  },
  {
    id: "plancha",
    n: "Plancha frontal",
    tipo: "tiempo",
    base: 30,
    paso: 5,
    tope: 45,
    seg: 45,
    texto: "Te apoyas en los antebrazos, con glúteos activos y costillas abajo. Respiras. Si la zona lumbar tiembla, apoyas las rodillas. Si sale fácil, la próxima suma 5 segundos.",
  },
  {
    id: "lateral",
    n: "Plancha lateral",
    tipo: "tiempo",
    lado: true,
    base: 20,
    paso: 5,
    tope: 30,
    seg: 65,
    texto: "Te pones de lado, con la cadera arriba y el cuerpo en línea. No gires el tronco. Si el hombro molesta, apoyas la rodilla de abajo. Si sale fácil, la próxima suma 5 segundos por lado.",
  },
  {
    id: "puente",
    n: "Puente de glúteo",
    dosis: "12 reps",
    seg: 65,
    texto: "Acostado, con los pies en el suelo, subes la cadera apretando glúteos. Pausas un segundo arriba. No empujas con la zona lumbar.",
  },
  {
    id: "pallof",
    n: "Pallof press",
    dosis: "8 por lado",
    seg: 80,
    texto: "De rodillas, con una banda a la altura del pecho, empujas al frente y aguantas sin girar. No pongas peso sobre la espalda.",
  },
  {
    id: "cadera",
    n: "Cadera 90/90",
    dosis: "40 s por lado",
    seg: 100,
    texto: "Sentado en el suelo, dejas una rodilla al frente y la otra al lado. El pecho queda alto. Mueves la cadera, no la espalda baja.",
  },
  {
    id: "flexor",
    n: "Flexores de cadera",
    dosis: "40 s por lado",
    seg: 100,
    texto: "Una rodilla en el suelo y el otro pie al frente. Llevas la cadera un poco adelante sin arquear la zona lumbar.",
  },
  {
    id: "isquio",
    n: "Isquios en el suelo",
    dosis: "40 s por lado",
    seg: 100,
    texto: "Acostado, subes una pierna hacia el techo. La zona lumbar sigue en el suelo. No redondeas la espalda para llegar más lejos.",
  },
  {
    id: "gato",
    n: "Gato camello",
    dosis: "6 reps suaves",
    seg: 60,
    texto: "En cuatro puntos, redondeas y arqueas la espalda en un rango corto. Sin girar y sin forzar el final.",
  },
];

export function textoCierre(min) {
  const n = Number(min) || 0;
  return "Unos " + n + " min de core y movilidad, al terminar de correr. Sin peso sobre la columna. Si la zona lumbar molesta, paras ese ejercicio.";
}

export function cierreDe(run) {
  const c = run && run.cierre;
  if (!c || !Array.isArray(c.items)) return null;
  const items = [];
  c.items.forEach((it) => {
    if (!it || typeof it !== "object") return;
    const id = String(it.id || "").trim();
    const n = String(it.n || "").trim();
    if (!id || !n) return;
    items.push({ id, n, dosis: String(it.dosis || "").trim(), hecho: !!it.hecho });
  });
  if (!items.length) return null;
  const min = Number(c.min);
  return { min: min > 0 ? Math.round(min) : 0, items };
}

export function cuentaCierre(run) {
  const c = cierreDe(run);
  if (!c) return null;
  return { hechos: c.items.filter((it) => it.hecho).length, total: c.items.length, min: c.min };
}

export function vecesHecho(runs, id) {
  let n = 0;
  (runs || []).forEach((r) => {
    const c = cierreDe(r);
    if (c && c.items.some((it) => it.id === id && it.hecho)) n += 1;
  });
  return n;
}

export function segundosDe(ex, veces) {
  if (!ex || ex.tipo !== "tiempo" || ex.base == null) return null;
  const n = Math.max(0, Number(veces) || 0);
  const paso = Number(ex.paso) || 0;
  const tope = Number(ex.tope) > 0 ? Number(ex.tope) : ex.base;
  return Math.min(tope, ex.base + paso * n);
}

export function planCierre(runs) {
  return CIERRE.map((ex) => {
    const sec = ex.tipo === "tiempo" ? segundosDe(ex, vecesHecho(runs, ex.id)) : null;
    const dosis = sec == null ? ex.dosis : (ex.lado ? sec + " s por lado" : sec + " s");
    const extra = sec == null ? 0 : (sec - ex.base) * (ex.lado ? 2 : 1);
    return { id: ex.id, n: ex.n, dosis, texto: ex.texto, seg: ex.seg + extra };
  });
}

export function minutosCierre(plan) {
  const seg = (plan || []).reduce((a, x) => a + (Number(x.seg) > 0 ? Number(x.seg) : 0), 0);
  return Math.max(0, Math.round(seg / 60));
}

export function cierreParaGuardar(plan, hechos) {
  const mark = hechos && typeof hechos === "object" ? hechos : {};
  const items = (plan || []).map((x) => ({
    id: x.id,
    n: x.n,
    dosis: x.dosis,
    hecho: !!mark[x.id],
  }));
  return { min: minutosCierre(plan), items };
}

export function cierreExport(cierre) {
  const c = cierreDe({ cierre });
  if (!c) return null;
  const out = {
    estiramiento_final: c.items.map((it) => ({
      id: it.id,
      nombre: it.n,
      dosis: it.dosis,
      hecho: it.hecho,
    })),
  };
  if (c.min > 0) out.estiramiento_min = c.min;
  return out;
}

export function cierreImport(row) {
  if (!row || !Array.isArray(row.estiramiento_final)) return null;
  const items = [];
  row.estiramiento_final.forEach((it) => {
    if (!it || typeof it !== "object") return;
    const id = String(it.id || "").trim();
    const n = String(it.nombre || it.n || "").trim();
    if (!id || !n) return;
    items.push({ id, n, dosis: String(it.dosis || "").trim(), hecho: !!it.hecho });
  });
  if (!items.length) return null;
  const min = Number(row.estiramiento_min);
  return { ...(min > 0 ? { min: Math.round(min) } : {}), items };
}

export function horaGuardada(savedAt, timeZone) {
  if (!savedAt) return "";
  const d = new Date(savedAt);
  if (Number.isNaN(d.getTime())) return "";
  const p = partesZona(d, timeZone || "UTC");
  return p.hm || "";
}
