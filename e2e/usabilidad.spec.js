import { expect, test } from "@playwright/test";

function overlap(a, b) {
  if (!a || !b) return false;
  const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return x > 2 && y > 2;
}

function contrastRatio(a, b) {
  const nums = (rgb) => (String(rgb).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  const lin = (c) => {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  const L = (rgb) => {
    const [r, g, b] = nums(rgb);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const hi = Math.max(L(a), L(b));
  const lo = Math.min(L(a), L(b));
  return (hi + 0.05) / (lo + 0.05);
}

async function box(locator) {
  const handle = locator.first();
  await handle.waitFor({ state: "visible" });
  return handle.boundingBox();
}

async function scrollAboveTabs(page, locator) {
  await page.evaluate(() => (document.fonts && document.fonts.ready) || Promise.resolve());
  const debug = await locator.evaluate((node) => {
    const sc = document.querySelector(".app-scroll");
    const chain = [];
    let p = node;
    while (p && chain.length < 6) { chain.push((p.className && String(p.className).slice(0, 40)) || p.tagName); p = p.parentElement; }
    node.scrollIntoView({ block: "center", inline: "nearest" });
    return { inScroll: !!(node.closest && node.closest(".app-scroll")), chain, scrollTop: sc ? sc.scrollTop : null };
  });
  for (let i = 0; i < 5; i++) {
    const tabs = await page.locator(".app-tabs").boundingBox();
    const el = await locator.boundingBox();
    if (!el || !tabs || el.y + el.height <= tabs.y - 8) return debug;
    await locator.evaluate((node, tabTop) => {
      const sc = node.closest(".app-scroll") || document.querySelector(".app-scroll");
      if (!sc) return;
      const r = node.getBoundingClientRect();
      sc.scrollTop += Math.max(40, r.bottom - (tabTop - 20));
    }, tabs.y);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  return debug;
}

async function openGym(page, { modo, dolor }) {
  await page.goto("/");
  await page.locator("[data-tab='pesas']").click();
  await page.getByRole("button", { name: /Push/ }).click();
  await page.getByRole("radio", { name: new RegExp(modo) }).click();
  const ask = page.locator("[data-hombro-ask]");
  if (await ask.count()) {
    await ask.getByRole("radio", { name: dolor ? "Sí" : "No" }).click();
    if (dolor) await ask.getByRole("button", { name: "2", exact: true }).click();
  }
  await page.getByRole("button", { name: "Empezar Push" }).click();
  await expect(page.locator(".sess-head")).toBeVisible();
}

test("home: header, footer y texto no se pisan", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-home-head]")).toBeVisible();
  const head = await box(page.locator("[data-home-head]"));
  const tabs = await box(page.locator(".app-tabs"));
  expect(overlap(head, tabs)).toBe(false);
  const title = page.locator("[data-hoy]").getByText("HOY TOCA", { exact: true });
  await expect(title).toBeVisible();
  const titleBox = await title.boundingBox();
  expect(overlap(titleBox, tabs)).toBe(false);
  expect(titleBox.y).toBeGreaterThanOrEqual(head.y);
  const clipped = await title.evaluate((el) => el.scrollWidth > el.clientWidth + 8);
  expect(clipped).toBe(false);
});

test("gym: inputs visibles, íconos sin tapar el texto, dolor en pec deck", async ({ page }, info) => {
  await openGym(page, { modo: "Normal", dolor: false });
  const head = await box(page.locator(".sess-head"));
  const tabs = await box(page.locator(".app-tabs"));
  const card = page.locator("[data-ex-id='a2']");
  await card.scrollIntoViewIfNeeded();
  const cardBox = await card.boundingBox();
  expect(overlap(head, cardBox)).toBe(false);

  await card.getByRole("button", { name: "Abrir ejercicio" }).click();
  await expect(card.locator("[data-dolor-ex]")).toBeVisible();

  const peso = card.locator("[data-set-input='peso']");
  await peso.click();
  await peso.fill("80");
  await expect(peso).toHaveValue("80");
  const pesoBox = await peso.boundingBox();
  expect(pesoBox.width).toBeGreaterThanOrEqual(40);
  expect(overlap(pesoBox, head)).toBe(false);
  expect(overlap(pesoBox, tabs)).toBe(false);
  const pesoFits = await peso.evaluate((el) => el.scrollWidth <= el.clientWidth + 2 && el.clientWidth >= 40);
  expect(pesoFits).toBe(true);

  await card.locator("textarea.note-field").click();
  const focused = page.locator("textarea.note-field:focus");
  await focused.fill("nota visible");
  await expect(focused).toHaveValue("nota visible");
  const panel = page.locator("[data-note-panel]").filter({ has: page.locator("textarea:focus") });
  const noteBox = await panel.locator("textarea").boundingBox();
  const icons = await panel.locator("[data-note-icons]").boundingBox();
  expect(overlap(noteBox, icons)).toBe(false);
  expect(icons.y).toBeGreaterThanOrEqual(noteBox.y + noteBox.height - 2);

  if (info.project.name.endsWith("-dark")) {
    const colors = await page.locator("[data-note-icon]").first().evaluate((el) => {
      const s = getComputedStyle(el);
      return { fg: s.color, bg: s.backgroundColor };
    });
    expect(contrastRatio(colors.fg, colors.bg)).toBeGreaterThanOrEqual(3);
  }
});

test("relajado día A: principales sin duplicados, reloj parado y dolor antes de avanzar", async ({ page }) => {
  await openGym(page, { modo: "Relajado", dolor: true });
  const headLine = page.locator("[data-modo-head]");
  await expect(headLine).toContainText("Relajado");
  await expect(headLine).toContainText("cuenta igual");
  const fits = await headLine.evaluate((el) => el.scrollWidth <= el.parentElement.clientWidth + 2);
  expect(fits).toBe(true);
  const headH = await page.locator(".sess-head").evaluate((el) => el.getBoundingClientRect().height);
  expect(headH).toBeLessThan(210);

  const ids = await page.locator("[data-ex-id]").evaluateAll((els) => els.map((el) => el.getAttribute("data-ex-id")));
  for (const id of ["h1", "h2", "h3", "h4", "h5", "a1r", "a2", "a6r", "a3r", "a9", "a10"]) {
    expect(ids, id).toContain(id);
  }
  expect(ids).not.toContain("a5r");
  expect(ids).not.toContain("a12r");
  expect(new Set(ids).size).toBe(ids.length);
  const names = await page.locator("[data-ex-id] button").evaluateAll((els) => els.map((el) => (el.textContent || "").toLowerCase()));
  const joined = names.join("\n");
  expect(joined.match(/escap/g) || []).toHaveLength(1);
  expect(joined.match(/face pull/g) || []).toHaveLength(1);
  expect(joined).toContain("shoulder press");
  expect(joined).toContain("fondos");
  expect(/sentadilla|peso muerto|good morning/i.test(joined)).toBe(false);

  const h4 = page.locator("[data-ex-id='h4']");
  await h4.getByRole("button", { name: "Técnica y notas" }).click();
  await expect(h4.locator("img")).toHaveAttribute("src", /dumbbell-side-lying-one-hand-raise/, { timeout: 8000 });
  const src = await h4.locator("img").getAttribute("src");
  expect(src).not.toContain("cable-one-arm-lateral-raise");

  const clock = h4.locator("[data-phase-clock]");
  await h4.getByRole("button", { name: "Empezar" }).click();
  await expect(h4.locator("[data-reloj-corriendo='1']")).toBeVisible();
  await page.waitForTimeout(1100);
  await h4.getByRole("button", { name: "Vuelta" }).click();
  await h4.getByRole("button", { name: "Vuelta" }).click();
  await page.waitForTimeout(1100);
  await h4.getByRole("button", { name: "Vuelta" }).click();
  await expect(h4.locator("[data-reloj-corriendo='0']")).toBeVisible();
  const frozen = await clock.innerText();
  await page.waitForTimeout(350);
  await expect(clock).toHaveText(frozen);
  await expect(h4.locator("[data-dolor-ex]")).toBeVisible();
  await expect(h4).toBeVisible();
  await h4.locator("[data-dolor-ex]").getByRole("button", { name: "1", exact: true }).click();
  await expect(h4.locator("[data-dolor-ex]")).toHaveCount(0);
});

test("running y estiramiento: sin tapas del header ni del footer", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-tab='trote']").click();
  await page.locator("[data-running-tipo='lib']").click();
  await page.locator("[data-run-accion='empezar']").click();
  await page.locator("[data-run-accion='termine']").click();
  await expect(page.getByRole("button", { name: "REGISTRAR" })).toBeVisible();
  const stretch = page.locator("[data-run-accion='empezar-estiramiento']");
  const debug = await scrollAboveTabs(page, stretch);
  const tabs = await box(page.locator(".app-tabs"));
  const stretchBox = await stretch.boundingBox();
  const metrics = await page.evaluate(() => {
    const sc = document.querySelector(".app-scroll");
    const s = getComputedStyle(sc);
    return { scrollTop: sc.scrollTop, scrollHeight: sc.scrollHeight, clientHeight: sc.clientHeight, pad: s.paddingBottom };
  });
  expect(overlap(stretchBox, tabs), JSON.stringify({ stretchBox, tabs, metrics, debug })).toBe(false);
  await stretch.click();
  await expect(page.locator("[data-cierre][data-reloj-corriendo='1']")).toBeVisible();
  const abierto = page.locator("[data-cierre-estado='abierto']");
  const name = abierto.locator("span").first();
  const clipped = await name.evaluate((el) => el.scrollWidth > el.clientWidth + 4);
  expect(clipped).toBe(false);
  const note = page.locator("textarea.note-field").first();
  await note.scrollIntoViewIfNeeded();
  await note.click();
  const focused = page.locator("textarea.note-field:focus");
  await focused.fill("sin dolor");
  await expect(focused).toHaveValue("sin dolor");
  const panel = page.locator("[data-note-panel]").filter({ has: page.locator("textarea:focus") });
  const noteBox = await panel.locator("textarea").boundingBox();
  const icons = await panel.locator("[data-note-icons]").boundingBox();
  expect(overlap(noteBox, icons)).toBe(false);
});

test("scroll y tap responden sin trabarse", async ({ page }) => {
  await openGym(page, { modo: "Relajado", dolor: true });
  const lag = await page.evaluate(() => new Promise((resolve) => {
    const sc = document.querySelector(".app-scroll");
    const t0 = performance.now();
    let first = 0;
    const onScroll = () => { if (!first) first = performance.now(); };
    sc.addEventListener("scroll", onScroll, { passive: true });
    sc.scrollTo({ top: 480, behavior: "auto" });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      sc.removeEventListener("scroll", onScroll);
      resolve({ ms: (first || performance.now()) - t0, top: sc.scrollTop });
    }));
  }));
  expect(lag.top).toBeGreaterThan(100);
  expect(lag.ms).toBeLessThan(250);

  const frames = await page.evaluate(() => new Promise((resolve) => {
    const sc = document.querySelector(".app-scroll");
    let n = 0;
    const t0 = performance.now();
    let y = 0;
    const id = setInterval(() => { y += 30; sc.scrollTop = y; }, 16);
    const step = () => {
      n += 1;
      if (performance.now() - t0 < 320) requestAnimationFrame(step);
      else { clearInterval(id); resolve(n); }
    };
    requestAnimationFrame(step);
  }));
  expect(frames).toBeGreaterThan(8);

  const t0 = Date.now();
  await page.locator(".sess-chips button").first().click();
  expect(Date.now() - t0).toBeLessThan(800);
});
