import assert from "node:assert/strict";
import { QUEUE_KEY, createTracker, localDateParts, sanitizeProps, trimQueue } from "./track.js";

const MX = "America/Mexico_City";

assert.equal(localDateParts(new Date("2026-10-09T05:30:00.000Z"), MX).local_date, "2026-10-08");
assert.equal(localDateParts(new Date("2026-10-09T06:00:00.000Z"), MX).local_date, "2026-10-09");
assert.equal(localDateParts(new Date("2026-09-10T01:28:50.750Z"), MX).local_date, "2026-09-09");
assert.equal(localDateParts(new Date("2026-10-08T04:00:00.000Z"), MX).local_date, "2026-10-07");
assert.equal(localDateParts(new Date("2026-10-09T05:30:00.000Z"), MX).tz, MX);
assert.equal(localDateParts(new Date("not-a-date"), "No/Such").tz, "UTC");

assert.deepEqual(sanitizeProps({
  pantalla: "home",
  nota: "me dolió la espalda",
  peso: 80,
  reps: 10,
  email: "a@b.c",
  token: "sek",
  en_regreso: true,
  duracion_min: 0,
  raro: { a: 1 },
  lista: [1],
  largo: "x".repeat(65),
  vacio: "",
  "Mal Key": "no",
}), { pantalla: "home", en_regreso: true, duracion_min: 0 });

function mem() {
  const m = new Map();
  return {
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { m.set(k, String(v)); },
    removeItem(k) { m.delete(k); },
  };
}

const store = mem();
const sent = [];
let online = false;
const tracker = createTracker({
  storage: store,
  post: async (row) => {
    if (!online) throw new Error("red");
    sent.push(row);
    return true;
  },
  now: () => new Date("2026-10-09T05:30:00.000Z"),
  timeZone: MX,
  sessionId: "sesion-test",
  version: "1.0.0",
  schedule: (fn) => { fn(); },
  maxQueue: 3,
  maxBytes: 5000,
});

assert.doesNotThrow(() => tracker.track("x", { pantalla: "home" }));
assert.doesNotThrow(() => tracker.track("MAYUS", {}));
assert.doesNotThrow(() => tracker.track("con espacio", {}));
assert.equal(store.getItem(QUEUE_KEY), null);

tracker.track("app_abierta", { pantalla: "home", nota: "secreto" });
const queued = JSON.parse(store.getItem(QUEUE_KEY));
assert.equal(queued.length, 1);
assert.equal(queued[0].event_name, "app_abierta");
assert.equal(queued[0].local_date, "2026-10-08");
assert.equal(queued[0].tz, MX);
assert.equal(queued[0].session_id, "sesion-test");
assert.equal(queued[0].app_version, "1.0.0");
assert.deepEqual(queued[0].props, { pantalla: "home" });
assert.equal(sent.length, 0);

await tracker.flush();
assert.equal(JSON.parse(store.getItem(QUEUE_KEY)).length, 1);

online = true;
await tracker.flush();
assert.equal(sent.length, 1);
assert.equal(sent[0].event_name, "app_abierta");
assert.equal(JSON.parse(store.getItem(QUEUE_KEY)).length, 0);

tracker.track("pantalla_vista", { pantalla: "gym" });
tracker.track("serie_completada", { ex: "c1", dia: "C" });
await tracker.flush();
assert.equal(sent.length, 3);

const boom = {
  getItem() { throw new Error("ls"); },
  setItem() { throw new Error("ls"); },
};
const broken = createTracker({
  storage: boom,
  post: async () => { throw new Error("post"); },
  schedule: (fn) => { fn(); },
});
assert.doesNotThrow(() => broken.track("app_abierta", null));
await assert.doesNotReject(() => broken.flush());

const tiny = mem();
const limited = createTracker({
  storage: tiny,
  post: async () => false,
  schedule: () => {},
  maxQueue: 2,
  maxBytes: 8000,
});
limited.track("app_abierta", { pantalla: "home" });
limited.track("pantalla_vista", { pantalla: "gym" });
limited.track("tema_cambiado", { modo: "dark" });
const kept = JSON.parse(tiny.getItem(QUEUE_KEY));
assert.equal(kept.length, 2);
assert.equal(kept[0].event_name, "pantalla_vista");
assert.equal(kept[1].event_name, "tema_cambiado");

const trimmed = trimQueue(
  [{ event_name: "a_a" }, { event_name: "b_b" }, { event_name: "c_c" }],
  2,
  80,
);
assert.ok(trimmed.length <= 2);
assert.equal(trimmed[trimmed.length - 1].event_name, "c_c");

const afterEmpty = mem();
const posted = [];
const retry = createTracker({
  storage: afterEmpty,
  post: async (row) => { posted.push(row.event_name); return true; },
  schedule: (fn) => { fn(); },
});
await retry.flush();
retry.track("app_abierta", { pantalla: "home" });
await retry.flush();
assert.deepEqual(posted, ["app_abierta"]);
assert.equal(JSON.parse(afterEmpty.getItem(QUEUE_KEY)).length, 0);

const rejectPost = createTracker({
  storage: mem(),
  post: async () => false,
  schedule: (fn) => { fn(); },
});
assert.doesNotThrow(() => rejectPost.track("error_guardado", { dia: "A" }));
await assert.doesNotReject(() => rejectPost.flush());

console.log("track.test.js ok");
