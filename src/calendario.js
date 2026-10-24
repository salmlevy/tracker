/* Días de calendario del dispositivo. Una sesión del vie 23 18:05
   no es "hoy" el sáb 24 10:00: pasaron horas, pero ya es otro día. */
import { dateKey, daysBetween } from "./regreso.js";
import { deviceTimeZone } from "./track.js";

const WD = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export function partesZona(date, timeZone) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const tz = timeZone || "UTC";
  let parts = [];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);
  } catch {
    parts = [];
  }
  const bag = {};
  parts.forEach((p) => { if (p.type !== "literal") bag[p.type] = p.value; });
  let hour = bag.hour || "00";
  if (hour === "24") hour = "00";
  const minute = bag.minute || "00";
  const key = bag.year && bag.month && bag.day ? bag.year + "-" + bag.month + "-" + bag.day : "";
  return { key, hour, minute, hm: hour + ":" + minute };
}

export function diaCorto(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key || "")) return "";
  const [y, m, d] = key.split("-").map(Number);
  return WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] || "";
}

/* Días civiles entre la sesión y ahora. 0 es el mismo día local. */
export function daysSince(iso, now, timeZone) {
  const tz = timeZone || deviceTimeZone();
  const when = now instanceof Date ? now : (now ? new Date(now) : new Date());
  const thenK = dateKey(iso, tz);
  const todayK = dateKey(when, tz);
  if (!thenK || !todayK) return null;
  return daysBetween(thenK, todayK, tz);
}

export function textoDias(ds) {
  if (ds == null) return "sin registro";
  if (ds === 0) return "entrenado hoy";
  if (ds === 1) return "última vez hace 1 día";
  if (ds > 1) return "última vez hace " + ds + " días";
  return "fecha por delante";
}

export function textoHaceCorto(ds) {
  if (ds == null) return "sin registro";
  if (ds <= 0) return "hoy";
  return "hace " + ds + " d";
}

export function localInputValue(date, timeZone) {
  const p = partesZona(date, timeZone);
  if (!p.key) return "";
  return p.key + "T" + p.hm;
}

export function clampLocal(value, now, timeZone) {
  const max = localInputValue(now || new Date(), timeZone);
  const v = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return max;
  return v > max ? max : v;
}

/* "2026-10-23T18:05" en la zona pedida → instante UTC. */
export function instanteLocal(localValue, timeZone) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(localValue || "");
  if (!m) return "";
  const y = +m[1].slice(0, 4);
  const mo = +m[1].slice(5, 7);
  const d = +m[1].slice(8, 10);
  const hh = +m[2];
  const mm = +m[3];
  const tz = timeZone || "UTC";
  const want = Date.UTC(y, mo - 1, d, hh, mm);
  let utc = want;
  for (let i = 0; i < 2; i++) {
    const shown = partesZona(new Date(utc), tz);
    if (!shown.key) break;
    const got = Date.UTC(+shown.key.slice(0, 4), +shown.key.slice(5, 7) - 1, +shown.key.slice(8, 10), +shown.hour, +shown.minute);
    if (got === want) break;
    utc += want - got;
  }
  return new Date(utc).toISOString();
}

/* date = día civil elegido. savedAt = esa hora real, en UTC. */
export function selloDe(localValue, now, timeZone) {
  const local = clampLocal(localValue, now, timeZone);
  return {
    date: local.slice(0, 10),
    savedAt: instanteLocal(local, timeZone),
    local,
  };
}

export function hechaEtiqueta(localValue, now, timeZone) {
  const local = clampLocal(localValue, now, timeZone);
  const day = local.slice(0, 10);
  const hm = local.slice(11, 16);
  const today = dateKey(now || new Date(), timeZone);
  const cuando = day && day === today ? "hoy" : (diaCorto(day) + " " + Number(day.slice(8, 10)));
  return "Hecha: " + cuando + " " + hm;
}

/* Cambia solo date. savedAt y el resto quedan. No acepta un día futuro. */
export function editarFecha(item, nuevaFecha, cuando, timeZone) {
  if (!item || typeof item !== "object") return item;
  const tz = timeZone || deviceTimeZone();
  const day = dateKey(nuevaFecha, tz);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return item;
  const now = cuando instanceof Date ? cuando : new Date(cuando || Date.now());
  const hoy = dateKey(now, tz);
  if (hoy && day > hoy) return item;
  if (dateKey(item.date, tz) === day) return item;
  return {
    ...item,
    date: day,
    fechaEditada: { antes: item.date, cuando: now.toISOString() },
  };
}
