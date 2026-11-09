import { expect, test } from "@playwright/test";

/* Playwright no tiene micrófono. El reconocimiento se sustituye en la página
   para comprobar el cableado, los errores y que el texto cae en la nota justa.
   No demuestra que el hardware ni el motor de Apple/Google transcriban. */

function overlap(a, b) {
  if (!a || !b) return false;
  const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return x > 2 && y > 2;
}

async function abrirPush(page) {
  await page.goto("/");
  await page.locator("[data-tab='pesas']").click();
  await page.getByRole("button", { name: /Push/ }).click();
  await page.getByRole("radio", { name: /Normal/ }).click();
  const ask = page.locator("[data-hombro-ask]");
  if (await ask.count()) await ask.getByRole("radio", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Empezar Push" }).click();
  await expect(page.locator(".sess-head")).toBeVisible();
}

test("cada ejercicio muestra la nota sin abrir Más, y no pide máquina", async ({ page }, info) => {
  await abrirPush(page);
  const cards = page.locator("[data-ex-id]");
  const n = await cards.count();
  expect(n).toBeGreaterThan(2);
  const abierta = page.locator("[data-ex-id][data-abierto='1']").first();
  await expect(abierta.locator("textarea.note-field")).toBeVisible();
  await expect(abierta.locator("[data-mas]")).toHaveCount(0);
  const orden = await abierta.evaluate((el) => {
    const set = el.querySelector("[data-set-input]");
    const note = el.querySelector("textarea.note-field");
    const setR = set.getBoundingClientRect();
    const noteR = note.getBoundingClientRect();
    const despues = (set.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    return { despues, abajo: noteR.y >= setR.y + setR.height - 2 };
  });
  expect(orden.despues).toBe(true);
  expect(orden.abajo).toBe(true);
  const cerrada = page.locator("[data-ex-id][data-abierto='0']").first();
  const idCerrada = await cerrada.getAttribute("data-ex-id");
  await expect(cerrada.locator("textarea.note-field")).toHaveCount(0);
  await cerrada.getByRole("button", { name: "Abrir ejercicio" }).click();
  const recien = page.locator(`[data-ex-id='${idCerrada}']`);
  await expect(recien.locator("textarea.note-field")).toBeVisible();
  await expect(recien.locator("[data-mas]")).toHaveCount(0);
  const a = cards.first();
  const b = cards.nth(1);
  if (await b.locator("textarea.note-field").count() === 0) {
    await b.getByRole("button", { name: "Abrir ejercicio" }).click();
  }
  await a.locator("textarea.note-field").fill("nota del primero");
  await a.locator("textarea.note-field").blur();
  await b.locator("textarea.note-field").fill("nota del segundo");
  await b.locator("textarea.note-field").blur();
  await expect(a.locator("textarea.note-field")).toHaveValue("nota del primero");
  await expect(b.locator("textarea.note-field")).toHaveValue("nota del segundo");
  await a.locator("textarea.note-field").fill("Máquina: poleas altas");
  await a.locator("textarea.note-field").blur();
  await expect(a.locator("[data-maquina-linea]")).toHaveText("en poleas altas");
  await expect(b.locator("[data-maquina-linea]")).toHaveCount(0);
  const nota = await a.locator("textarea.note-field").boundingBox();
  const mic = await a.getByRole("button", { name: "Dictar nota" }).boundingBox();
  const tabs = await page.locator(".app-tabs").boundingBox();
  expect(overlap(nota, mic)).toBe(false);
  expect(overlap(nota, tabs)).toBe(false);
  const clipped = await a.locator("textarea.note-field").evaluate((el) => el.scrollWidth <= el.clientWidth + 4);
  expect(clipped).toBe(true);
  const encuadrar = async () => {
    await a.locator("textarea.note-field").evaluate((el) => {
      const sc = el.closest(".app-scroll");
      const tabs = document.querySelector(".app-tabs").getBoundingClientRect();
      const r = el.getBoundingClientRect();
      sc.scrollTop += r.bottom - tabs.top + 12;
    });
  };
  if (info.project.name === "iphone-14-dark-webkit") {
    await encuadrar();
    await page.screenshot({ path: "/opt/cursor/artifacts/notas-debajo-iphone14-oscuro.png" });
  }
  if (info.project.name === "iphone-se-light-webkit") {
    await encuadrar();
    await page.screenshot({ path: "/opt/cursor/artifacts/notas-debajo-iphone-se-claro.png" });
  }
});

test("el dictado emulado escribe en esa nota; un permiso denegado no finge éxito", async ({ page }) => {
  await page.addInitScript(() => {
    window.__dics = [];
    class FakeRec {
      constructor() { this.lang = ""; this._err = ""; window.__dics.push(this); }
      start() {
        const self = this;
        setTimeout(() => {
          if (self.onstart) self.onstart();
          const said = window.__dicSaid;
          if (self._err) { if (self.onerror) self.onerror({ error: self._err }); if (self.onend) self.onend(); return; }
          if (said && self.onresult) {
            const result = [{ transcript: said }];
            result.isFinal = true;
            self.onresult({ results: [result] });
          }
          if (self.onend) self.onend();
        }, 0);
      }
      abort() { if (this.onend) this.onend(); }
    }
    window.webkitSpeechRecognition = FakeRec;
    window.SpeechRecognition = FakeRec;
  });
  await abrirPush(page);
  const a = page.locator("[data-ex-id]").first();
  const b = page.locator("[data-ex-id]").nth(1);
  if (await b.locator("textarea.note-field").count() === 0) {
    await b.getByRole("button", { name: "Abrir ejercicio" }).click();
  }
  await page.evaluate(() => { window.__dicSaid = "banco plano"; });
  await a.getByRole("button", { name: "Dictar nota" }).click();
  await expect(a.locator("textarea.note-field")).toHaveValue("banco plano");
  await expect(b.locator("textarea.note-field")).toHaveValue("");
  await expect(a.locator("[data-maquina-linea]")).toHaveCount(0);

  await page.evaluate(() => { window.__dicSaid = ""; window.__dics.forEach(() => {}); });
  await page.evaluate(() => {
    const Proto = window.webkitSpeechRecognition;
    const orig = Proto.prototype.start;
    Proto.prototype.start = function () { this._err = "not-allowed"; return orig.call(this); };
  });
  await b.getByRole("button", { name: "Dictar nota" }).click();
  await expect(b.getByText("El micrófono está bloqueado")).toBeVisible();
  await expect(b.locator("textarea.note-field")).toHaveValue("");
  await expect(a.locator("textarea.note-field")).toHaveValue("banco plano");
});

test("un resultado interino de iOS se guarda al cerrar el reconocimiento", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRec {
      start() {
        const self = this;
        setTimeout(() => {
          if (self.onstart) self.onstart();
          const said = window.__dicSaid || "";
          const result = [{ transcript: said }];
          result.isFinal = false;
          if (self.onresult) self.onresult({ results: [result] });
          if (self.onend) self.onend();
        }, 0);
      }
      abort() { if (this.onend) this.onend(); }
    }
    window.webkitSpeechRecognition = FakeRec;
    window.SpeechRecognition = FakeRec;
  });
  await abrirPush(page);
  const card = page.locator("[data-ex-id]").first();
  await page.evaluate(() => { window.__dicSaid = "hombro izquierdo"; });
  await card.getByRole("button", { name: "Dictar nota" }).click();
  const nota = card.locator("textarea.note-field");
  await expect(nota).toHaveValue("hombro izquierdo");
  await nota.blur();
  await expect(card.locator(".note-docked")).toHaveCount(0);
  await card.getByRole("button", { name: "Cerrar ejercicio" }).click();
  await card.getByRole("button", { name: "Abrir ejercicio" }).click();
  await expect(card.locator("textarea.note-field")).toHaveValue("hombro izquierdo");
});

test("sin API de voz el micrófono avisa y el teclado sigue escribiendo", async ({ page }) => {
  await page.addInitScript(() => {
    delete window.webkitSpeechRecognition;
    delete window.SpeechRecognition;
  });
  await abrirPush(page);
  const card = page.locator("[data-ex-id]").first();
  await card.getByRole("button", { name: "Dictar nota" }).click();
  await expect(card.getByText("Usa el micrófono del teclado")).toBeVisible();
  const nota = card.locator("textarea.note-field");
  await expect(nota).toBeFocused();
  await nota.fill("escrito a mano");
  await expect(nota).toHaveValue("escrito a mano");
  await page.evaluate(() => {
    window.__entrenoKb = {
      innerHeight: window.innerHeight,
      layoutHeight: window.innerHeight,
      vv: { height: Math.round(window.innerHeight * 0.55), offsetTop: 0 },
      focused: true,
      useFallback: true,
    };
    window.__entrenoSyncKb();
  });
  const panel = page.locator("[data-note-panel]").filter({ has: page.locator("textarea:focus") });
  await expect(panel).toHaveCSS("position", "fixed");
  const box = await panel.boundingBox();
  const vv = page.viewportSize();
  expect(box.height).toBeLessThan(vv.height * 0.75);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.y + box.height).toBeLessThanOrEqual(vv.height + 1);
  await nota.blur();
  await page.evaluate(() => { delete window.__entrenoKb; window.__entrenoSyncKb(); });
  await expect(page.locator(".app-tabs")).toBeVisible();
});
