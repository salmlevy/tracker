import { expect, test } from "@playwright/test";

function overlap(a, b) {
  if (!a || !b) return false;
  const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return x > 2 && y > 2;
}

async function medirBarra(page) {
  return page.evaluate(() => {
    const tabs = document.querySelector(".app-tabs");
    const r = tabs.getBoundingClientRect();
    const vv = window.visualViewport;
    const bottom = vv ? (vv.offsetTop || 0) + vv.height : window.innerHeight;
    const shell = document.querySelector(".app-shell").getBoundingClientRect();
    const cs = getComputedStyle(document.documentElement);
    const sab = parseFloat(cs.getPropertyValue("--sab")) || 0;
    const btn = tabs.querySelector("button").getBoundingClientRect();
    return {
      gap: Math.round((bottom - r.bottom) * 10) / 10,
      shellGap: Math.round((bottom - shell.bottom) * 10) / 10,
      sab,
      btnClear: Math.round((bottom - sab - btn.bottom) * 10) / 10,
      visible: getComputedStyle(tabs).display !== "none",
    };
  });
}

async function alFinal(page) {
  return page.locator(".app-scroll").evaluate(async (sc) => {
    let guard = 0;
    let height = -1;
    while (guard < 8 && sc.scrollHeight !== height) {
      height = sc.scrollHeight;
      sc.scrollTop = sc.scrollHeight;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      guard += 1;
    }
    const tabs = document.querySelector(".app-tabs").getBoundingClientRect();
    const kids = [...sc.querySelectorAll("button, input, textarea, [data-cierre], [data-meta-semanal], [data-running-tipo]")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.height > 8 && r.width > 8 && getComputedStyle(el).visibility !== "hidden";
    });
    let last = null;
    kids.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!last || r.bottom > last.bottom) last = r;
    });
    const overflows = sc.scrollHeight > sc.clientHeight + 8;
    return {
      hole: last ? tabs.top - last.bottom : 0,
      overflows,
      pad: parseFloat(getComputedStyle(sc).paddingBottom) || 0,
    };
  });
}

test("la barra llega al fondo visible, con y sin safe-area", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.locator(".app-tabs")).toBeVisible();
  let m = await medirBarra(page);
  expect(m.gap, "sin safe-area").toBeLessThanOrEqual(1);
  expect(m.gap).toBeGreaterThanOrEqual(-1);
  expect(m.shellGap).toBeLessThanOrEqual(1);

  await page.evaluate(() => document.documentElement.style.setProperty("--sab-override", "34px"));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
  m = await medirBarra(page);
  expect(m.sab).toBeGreaterThanOrEqual(34);
  expect(m.gap, "con safe-area").toBeLessThanOrEqual(1);
  expect(m.gap).toBeGreaterThanOrEqual(-1);
  expect(m.btnClear, "el toque queda sobre el home indicator").toBeGreaterThanOrEqual(-1);
  if (info.project.name === "iphone-14-dark-webkit") {
    await page.screenshot({ path: "/opt/cursor/artifacts/hueco-despues-safe-iphone14-oscuro.png" });
  }
  await page.evaluate(() => document.documentElement.style.removeProperty("--sab-override"));
});

test("el viewport corto no deja hueco si la nota no está abierta, y al cerrarla vuelve la barra", async ({ page }) => {
  await page.goto("/");
  const base = await page.evaluate(() => window.innerHeight);
  await page.evaluate((h) => {
    window.__entrenoKb = {
      innerHeight: h,
      layoutHeight: h,
      vv: { height: h - 120, offsetTop: 0 },
      focused: false,
      useFallback: false,
    };
    window.__entrenoSyncKb();
  }, base);
  await expect(page.locator("html")).not.toHaveClass(/kb-open/);
  const quieto = await page.locator(".app-scroll").evaluate((el) => ({
    pad: parseFloat(getComputedStyle(el).paddingBottom),
    kb: getComputedStyle(document.documentElement).getPropertyValue("--kb").trim(),
  }));
  expect(quieto.kb).toBe("0px");
  expect(quieto.pad).toBeLessThanOrEqual(16);
  expect((await medirBarra(page)).visible).toBe(true);
  await page.evaluate(() => { delete window.__entrenoKb; window.__entrenoSyncKb(); });

  await page.locator("[data-tab='pesas']").click();
  await page.getByRole("button", { name: /Push/ }).click();
  await page.getByRole("radio", { name: /Normal/ }).click();
  const ask = page.locator("[data-hombro-ask]");
  if (await ask.count()) await ask.getByRole("radio", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Empezar Push" }).click();
  await page.getByRole("button", { name: "Más de la sesión" }).click();
  const nota = page.locator("textarea.note-field").last();
  await expect(nota).toBeVisible();
  await nota.click();
  await page.evaluate((h) => {
    window.__entrenoKb = {
      innerHeight: h,
      layoutHeight: h,
      vv: { height: Math.round(h * 0.55), offsetTop: 0 },
      focused: true,
      useFallback: true,
    };
    window.__entrenoSyncKb();
  }, base);
  await expect(page.locator("html")).toHaveClass(/kb-open/);
  await expect(page.locator(".app-tabs")).toBeHidden();
  await nota.fill("se sintió bien");
  await expect(nota).toHaveValue("se sintió bien");
  await nota.blur();
  await page.evaluate(() => {
    delete window.__entrenoKb;
    window.__entrenoSyncKb();
  });
  await expect(page.locator("html")).not.toHaveClass(/kb-open/);
  const despues = await page.locator(".app-scroll").evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
  expect(despues).toBeLessThanOrEqual(16);
  const m = await medirBarra(page);
  expect(m.visible).toBe(true);
  expect(Math.abs(m.gap)).toBeLessThanOrEqual(1);
});

test("home, gym y running: último control junto a la barra, escribible y sin solape", async ({ page }, info) => {
  test.setTimeout(90000);
  await page.goto("/");
  const tabs = () => page.locator(".app-tabs");
  let fin = await alFinal(page);
  expect(Math.abs((await medirBarra(page)).gap), "home").toBeLessThanOrEqual(1);
  if (fin.overflows) {
    expect(fin.hole, "home").toBeLessThan(48);
    expect(fin.hole).toBeGreaterThan(-8);
  }

  await page.locator("[data-tab='pesas']").click();
  await page.getByRole("button", { name: /Push/ }).click();
  const nombre = page.locator("[data-gym-nombre]");
  if (await nombre.count()) {
    await nombre.click();
    await nombre.fill("Casa");
    await expect(nombre).toHaveValue("Casa");
  }
  await page.getByRole("radio", { name: /Normal/ }).click();
  const ask = page.locator("[data-hombro-ask]");
  if (await ask.count()) await ask.getByRole("radio", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Empezar Push" }).click();
  await expect(page.locator(".sess-head")).toBeVisible();
  const peso = page.locator("[data-set-input='peso']").first();
  if (await peso.count()) {
    await peso.click();
    await peso.fill("40");
    await expect(peso).toHaveValue("40");
    expect(overlap(await peso.boundingBox(), await page.locator(".sess-head").boundingBox())).toBe(false);
    expect(overlap(await peso.boundingBox(), await tabs().boundingBox())).toBe(false);
  }
  fin = await alFinal(page);
  expect(fin.hole, "gym").toBeLessThan(48);
  expect(fin.hole).toBeGreaterThan(-8);
  const terminar = page.getByRole("button", { name: "Terminar sesión" });
  await expect(terminar).toBeVisible();
  const tb = await terminar.boundingBox();
  const bar = await tabs().boundingBox();
  expect(overlap(tb, bar)).toBe(false);
  const m = await medirBarra(page);
  expect(Math.abs(m.gap)).toBeLessThanOrEqual(1);
  if (info.project.name === "iphone-14-dark-webkit") {
    await page.screenshot({ path: "/opt/cursor/artifacts/hueco-despues-iphone14-oscuro.png" });
  }
  if (info.project.name === "iphone-se-light-webkit") {
    await page.screenshot({ path: "/opt/cursor/artifacts/hueco-despues-iphone-se-claro.png" });
  }

  await page.locator("[data-tab='trote']").click();
  await page.locator("[data-running-tipo='lib']").click();
  const correr = page.locator("[data-run-accion='empezar']");
  await expect(correr).toBeVisible();
  fin = await alFinal(page);
  expect(Math.abs((await medirBarra(page)).gap), "running").toBeLessThanOrEqual(1);
  if (fin.overflows) {
    expect(fin.hole, "running").toBeLessThan(48);
    expect(fin.hole).toBeGreaterThan(-8);
  }
  expect(overlap(await correr.boundingBox(), await tabs().boundingBox())).toBe(false);
});

test("modo instalado: la barra sigue en el fondo visible", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", { configurable: true, get: () => true });
    const orig = window.matchMedia.bind(window);
    window.matchMedia = (q) => {
      if (String(q).includes("display-mode")) {
        return { matches: String(q).includes("standalone"), media: String(q), addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } };
      }
      return orig(q);
    };
  });
  await page.goto("/");
  const m = await medirBarra(page);
  expect(Math.abs(m.gap)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.documentElement.style.setProperty("--sab-override", "34px"));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
  const con = await medirBarra(page);
  expect(con.sab).toBeGreaterThanOrEqual(34);
  expect(Math.abs(con.gap)).toBeLessThanOrEqual(1);
  expect(con.btnClear).toBeGreaterThanOrEqual(-1);
});

test("la app instalada recupera el alto que WebKit deja fuera", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", { configurable: true, get: () => true });
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/pwa/);
  const antes = await medirBarra(page);
  expect(Math.abs(antes.gap)).toBeLessThanOrEqual(1);
  await page.evaluate(() => {
    const vv = window.visualViewport;
    const bottom = (vv.offsetTop || 0) + vv.height;
    window.__entrenoScreenH = bottom + 16;
    window.__entrenoSyncKb();
  });
  const m = await page.evaluate(() => {
    const tabs = document.querySelector(".app-tabs").getBoundingClientRect();
    const shell = document.querySelector(".app-shell").getBoundingClientRect();
    return {
      tabBottom: Math.round(tabs.bottom * 10) / 10,
      shellBottom: Math.round(shell.bottom * 10) / 10,
      screenH: window.__entrenoScreenH,
      h: getComputedStyle(document.documentElement).getPropertyValue("--vv-h").trim(),
    };
  });
  expect(Math.abs(m.shellBottom - m.screenH)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.tabBottom - m.screenH)).toBeLessThanOrEqual(1);
  expect(m.h).toBe(m.screenH + "px");
});
