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

test("home: header, footer y texto no se pisan", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.locator("[data-home-head]")).toBeVisible();
  const head = await box(page.locator("[data-home-head]"));
  const tabs = await box(page.locator(".app-tabs"));
  expect(overlap(head, tabs)).toBe(false);
  const title = page.locator("[data-hoy]").getByText("HOY TOCA", { exact: true });
  await expect(title).toBeVisible();
  await expect(page.locator("[data-hoy]").getByRole("button", { name: /EMPEZAR|SEGUIR/ })).toBeVisible();
  await expect(page.locator("[data-meta-semanal]")).toBeVisible();
  const titleBox = await title.boundingBox();
  expect(overlap(titleBox, tabs)).toBe(false);
  expect(titleBox.y).toBeGreaterThanOrEqual(head.y);
  const clipped = await title.evaluate((el) => el.scrollWidth > el.clientWidth + 8);
  expect(clipped).toBe(false);
  if (info.project.name.startsWith("iphone-14-light")) await page.screenshot({ path: "/opt/cursor/artifacts/home-hoy-claro.png" });
});

test("gym: inputs visibles, íconos sin tapar el texto, dolor en pec deck", async ({ page }, info) => {
  await openGym(page, { modo: "Normal", dolor: false });
  const head = await box(page.locator(".sess-head"));
  const tabs = await box(page.locator(".app-tabs"));
  const card = page.locator("[data-ex-id='a2']");
  await card.scrollIntoViewIfNeeded();
  const cardBox = await card.boundingBox();
  expect(overlap(head, cardBox)).toBe(false);
  await expect(card.locator("textarea.note-field")).toBeVisible();
  await expect(card.getByRole("button", { name: "Dictar nota" })).toBeVisible();
  await expect(card.locator("[data-maquina]")).toHaveCount(0);

  await card.getByRole("button", { name: "Abrir ejercicio" }).click();
  await expect(card.locator("[data-dolor-ex]")).toHaveCount(0);
  const mini = card.locator("[data-gif-mini]");
  await expect(mini).toBeVisible();
  const miniBox = await mini.boundingBox();
  expect(miniBox.width).toBeGreaterThanOrEqual(64);
  expect(miniBox.width).toBeLessThanOrEqual(80);
  expect(miniBox.height).toBeLessThanOrEqual(80);
  const stepperDentro = await card.locator("[data-set-input='peso']").evaluate((el) => {
    const row = el.closest(".rounded-xl") && el.closest(".rounded-xl").parentElement;
    const box = row ? row.getBoundingClientRect() : el.getBoundingClientRect();
    const w = document.documentElement.clientWidth;
    return box.left >= -1 && box.right <= w + 1;
  });
  expect(stepperDentro).toBe(true);
  const shootGif = async (file) => {
    await page.evaluate(() => {
      const node = document.querySelector("[data-ex-id='a2']");
      const sc = document.querySelector(".app-scroll");
      const head = document.querySelector(".sess-head");
      if (!node || !sc) return;
      const headH = head ? head.getBoundingClientRect().height : 0;
      const r = node.getBoundingClientRect();
      const scR = sc.getBoundingClientRect();
      sc.scrollTop += r.top - scR.top - headH - 8;
    });
    await page.screenshot({ path: file });
  };
  if (info.project.name === "iphone-14-light-chromium") await shootGif("/opt/cursor/artifacts/gif-iphone14-claro.png");
  if (info.project.name === "iphone-se-light-chromium") await shootGif("/opt/cursor/artifacts/gif-iphone-se-claro.png");
  await mini.click();
  const grande = page.locator("[data-gif-grande]");
  await expect(grande).toBeVisible();
  const gBox = await grande.locator("img").boundingBox();
  const vwGif = page.viewportSize().width;
  const vhGif = page.viewportSize().height;
  expect(gBox.width / vwGif).toBeGreaterThan(0.85);
  expect(gBox.width / vwGif).toBeLessThan(0.95);
  expect(Math.abs(gBox.x + gBox.width / 2 - vwGif / 2)).toBeLessThan(8);
  expect(gBox.y).toBeGreaterThanOrEqual(0);
  expect(gBox.y + gBox.height).toBeLessThanOrEqual(vhGif + 1);
  if (info.project.name === "iphone-14-light-chromium") await page.screenshot({ path: "/opt/cursor/artifacts/gif-ampliado-iphone14-claro.png" });
  await grande.click({ position: { x: 8, y: 8 } });
  await expect(grande).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Técnica y notas" })).toBeVisible();
  await card.getByRole("button", { name: "Técnica y notas" }).click();
  await expect(card.locator("[data-tips]")).toBeVisible();
  await expect(card.getByRole("link", { name: /YouTube/ })).toBeVisible();
  await expect(card.locator("[data-dolor-ex]")).toHaveCount(0);
  if (info.project.name.startsWith("iphone-14-light")) {
    await page.evaluate(() => {
      const card = document.querySelector("[data-ex-id='a2']");
      const sc = document.querySelector(".app-scroll");
      const head = document.querySelector(".sess-head");
      if (!card || !sc) return;
      const headH = head ? head.getBoundingClientRect().height : 0;
      const r = card.getBoundingClientRect();
      const scR = sc.getBoundingClientRect();
      sc.scrollTop += r.top - scR.top - headH - 8;
    });
    await page.screenshot({ path: "/opt/cursor/artifacts/ejercicio-claro.png" });
  }
  await card.getByRole("button", { name: "Más", exact: true }).click();
  await expect(card.locator("[data-dolor-ex]")).toBeVisible();

  const peso = card.locator("[data-set-input='peso']");
  await peso.click();
  await peso.fill("80");
  await expect(peso).toHaveValue("80");
  const unidad = card.getByRole("button", { name: "Unidad lbs" });
  const infoBtn = card.getByRole("button", { name: "Técnica y notas" });
  await expect(unidad).toHaveText("lbs");
  const uBox = await unidad.boundingBox();
  const iBox = await infoBtn.boundingBox();
  const vw = page.viewportSize().width;
  expect(overlap(uBox, iBox)).toBe(false);
  expect(uBox.width).toBeGreaterThanOrEqual(32);
  expect(uBox.x).toBeGreaterThanOrEqual(0);
  expect(uBox.x + uBox.width).toBeLessThanOrEqual(vw + 1);
  expect(iBox.x + iBox.width).toBeLessThanOrEqual(vw + 1);
  await unidad.click();
  await expect(card.getByRole("button", { name: "Unidad kg" })).toHaveText("kg");
  await expect(peso).toHaveValue("36.5");
  await card.getByRole("button", { name: "Unidad kg" }).click();
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
  const iconsClear = icons.x >= noteBox.x + noteBox.width - 2 || icons.y >= noteBox.y + noteBox.height - 2;
  expect(iconsClear).toBe(true);

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
  await expect(page.locator(".sess-head")).not.toContainText("Empezar regreso");
  const logo = page.locator(".sess-head img");
  const gear = page.locator("[data-ajustes-abrir]");
  const themeBtn = page.locator(".sess-head .theme-btn");
  await expect(gear).toBeVisible();
  await expect(themeBtn).toBeVisible();
  expect(overlap(await logo.boundingBox(), await gear.boundingBox())).toBe(false);
  expect(overlap(await logo.boundingBox(), await themeBtn.boundingBox())).toBe(false);
  const logoOk = await logo.evaluate((el) => el.clientWidth >= 12 && el.clientHeight >= 16 && el.scrollWidth <= el.clientWidth + 1);
  expect(logoOk).toBe(true);
  await gear.click();
  const headLine = page.locator("[data-ajustes] [data-modo-head]");
  await expect(headLine).toContainText("Relajado");
  await expect(headLine).not.toContainText("cuenta igual");
  await expect(headLine).not.toContainText("min");
  await expect(page.locator("[data-molestia-panel]")).toBeVisible();
  const fits = await headLine.evaluate((el) => el.scrollWidth <= el.parentElement.clientWidth + 2);
  expect(fits).toBe(true);
  await page.locator("[data-ajustes-fondo]").click({ position: { x: 24, y: 24 } });
  await expect(page.locator("[data-ajustes]")).toHaveCount(0);
  await expect(page.locator(".sess-chips")).toHaveCount(0);
  const headH = await page.locator(".sess-head").evaluate((el) => el.getBoundingClientRect().height);
  expect(headH).toBeLessThan(96);

  const ids = await page.locator("[data-ex-id]").evaluateAll((els) => els.map((el) => el.getAttribute("data-ex-id")));
  for (const id of ["h1", "h2", "h3", "h4", "h5", "a1r", "a2", "a6r", "a13r", "a9", "a10", "a8", "a7"]) {
    expect(ids, id).toContain(id);
  }
  expect(ids.at(-1)).toBe("a10");
  expect(ids).not.toContain("a3r");
  expect(ids).not.toContain("a5r");
  expect(ids).not.toContain("a12r");
  expect(ids).not.toContain("c7");
  expect(ids).not.toContain("c10");
  expect(new Set(ids).size).toBe(ids.length);
  const names = await page.locator("[data-ex-id]").evaluateAll((els) => els.map((el) => ((el.querySelector("span") || {}).textContent || "").toLowerCase()));
  const joined = names.join("\n");
  expect(joined.match(/face pull/g) || []).toHaveLength(1);
  expect(joined).toContain("fondos");
  expect(/sentadilla|peso muerto|good morning/i.test(joined)).toBe(false);

  const h4 = page.locator("[data-ex-id='h4']");
  await h4.getByRole("button", { name: "Técnica y notas" }).click();
  await expect(h4.locator("[data-tips] img")).toHaveAttribute("src", /dumbbell-side-lying-one-hand-raise/, { timeout: 8000 });
  const src = await h4.locator("[data-tips] img").getAttribute("src");
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

  /* En el 15 Pro Max, con otro WebKit al lado, la ventana de 320 ms da 7 u 8
     cuadros: el conteo está en el borde del reloj, no en un trabón. Se mira
     la mediana y se rechaza un hueco de 100 ms o más entre cuadros. */
  const frames = await page.evaluate(() => new Promise((resolve) => {
    const sc = document.querySelector(".app-scroll");
    const once = () => new Promise((done) => {
      let n = 0;
      let maxGap = 0;
      const t0 = performance.now();
      let last = t0;
      let y = 0;
      const id = setInterval(() => { y += 30; sc.scrollTop = y; }, 16);
      const step = () => {
        const now = performance.now();
        if (n) maxGap = Math.max(maxGap, now - last);
        last = now;
        n += 1;
        if (now - t0 < 320) requestAnimationFrame(step);
        else { clearInterval(id); done({ n, maxGap }); }
      };
      requestAnimationFrame(step);
    });
    once().then((a) => once().then((b) => once().then((c) => {
      const ordered = [a, b, c].sort((x, y) => x.n - y.n);
      resolve(ordered[1]);
    })));
  }));
  expect(frames.n).toBeGreaterThanOrEqual(7);
  expect(frames.maxGap).toBeLessThan(100);

  const t0 = Date.now();
  await page.locator(".sess-head").getByRole("button").first().click();
  expect(Date.now() - t0).toBeLessThan(800);
});

const ESCALA = [
  { re: /Push/, nombre: "Push", hombro: true },
  { re: /Pull/, nombre: "Pull", hombro: true },
  { re: /Legs/, nombre: "Legs + Core", hombro: false },
];

test("seis modos: texto, input y scroll en A, B y C", async ({ page }) => {
  test.setTimeout(180000);
  for (const dia of ESCALA) {
    for (const modo of ["Relajado", "Normal", "Espartano"]) {
      for (const molestia of [false, true]) {
        await page.goto("/");
        await page.locator("[data-tab='pesas']").click();
        await page.getByRole("button", { name: dia.re }).click();
        await page.getByRole("radio", { name: new RegExp("^" + modo) }).click();
        if (dia.hombro) {
          const ask = page.locator("[data-hombro-ask]");
          await ask.getByRole("radio", { name: molestia ? "Sí" : "No" }).click();
          if (molestia) await ask.getByRole("button", { name: "2", exact: true }).click();
        } else {
          await page.locator("[data-molestia-ask]").getByRole("radio", { name: molestia ? "Sí" : "No" }).click();
        }
        await page.getByRole("button", { name: "Empezar " + dia.nombre }).click();
        await expect(page.locator(".sess-head")).toHaveAttribute("data-molestia", molestia ? "1" : "0");
        await page.locator("[data-ajustes-abrir]").click();
        const head = page.locator("[data-ajustes] [data-modo-head]");
        await expect(head).toContainText(modo);
        await expect(head).not.toContainText("min");
        await expect(page.locator("[data-molestia-panel]")).toBeVisible();
        await expect(page.locator(".sess-chips")).toHaveCount(0);
        const fits = await head.evaluate((el) => el.scrollWidth <= el.parentElement.clientWidth + 2);
        expect(fits, dia.nombre + " " + modo).toBe(true);
        const titleOk = await page.locator(".sess-head").evaluate((el) => {
          const name = [...el.querySelectorAll("div")].find((n) => n.childElementCount === 0 && /push|pull|legs/i.test(n.textContent || ""));
          return !!name && name.scrollWidth <= name.clientWidth + 2;
        });
        expect(titleOk, dia.nombre + " " + modo).toBe(true);
        await page.locator("[data-ajustes-cerrar]").click();
        const card = page.locator("[data-ex-id]").first();
        await card.evaluate((node) => {
          const sc = node.closest(".app-scroll") || document.querySelector(".app-scroll");
          const head = document.querySelector(".sess-head");
          if (!sc || !head) return;
          const headH = head.getBoundingClientRect().height;
          const r = node.getBoundingClientRect();
          const scR = sc.getBoundingClientRect();
          sc.scrollTop += r.top - scR.top - headH - 8;
        });
        expect(overlap(await page.locator(".sess-head").boundingBox(), await card.boundingBox()), dia.nombre + " " + modo).toBe(false);
        const input = card.locator("input.set-num").first();
        await scrollAboveTabs(page, input);
        await input.click();
        await input.fill("8");
        await expect(input).toHaveValue("8");
        const boxIn = await input.boundingBox();
        const tabs = await page.locator(".app-tabs").boundingBox();
        expect(boxIn.width).toBeGreaterThanOrEqual(40);
        expect(overlap(boxIn, tabs)).toBe(false);
        expect(overlap(boxIn, await page.locator(".sess-head").boundingBox())).toBe(false);
        const lag = await page.evaluate(() => new Promise((resolve) => {
          const sc = document.querySelector(".app-scroll");
          const t0 = performance.now();
          sc.scrollTo({ top: Math.min(320, Math.max(0, sc.scrollHeight / 4)), behavior: "auto" });
          requestAnimationFrame(() => resolve(performance.now() - t0));
        }));
        expect(lag).toBeLessThan(250);
      }
    }
  }
});

test("multigym: selector, sugerencia editable y gym cercano con confirmación", async ({ page }, info) => {
  test.setTimeout(90000);
  const hist = [
    {
      date: "2026-11-02", day: "A", energy: "normal",
      logs: { a1: { v: "main", note: "", sets: [{ w: 80, r: 10, f: true, done: true }] } },
    },
    {
      date: "2026-11-03", day: "C", energy: "normal", note: "",
      logs: {
        c1: {
          v: "main",
          note: "Estoy usando otra máquina de technogym todos los ejercicios están en kilos ",
          sets: [
            { f: true, r: 10, w: 286.6, done: true },
            { f: true, r: 10, w: 330.7, done: true },
          ],
        },
      },
    },
  ];
  const gyms = [
    { id: "habitual", nombre: "EW", marca: "", unidad: "lb", incremento: 5, lat: null, lng: null },
    { id: "gym-technogym", nombre: "Navy", marca: "Technogym", unidad: "kg", incremento: 5, lat: 19.4326, lng: -99.1332 },
  ];
  const histRaw = JSON.stringify(hist);
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: 19.4326, longitude: -99.1332 });
  await page.addInitScript(({ histRaw, gymsRaw }) => {
    localStorage.setItem("trk_gymu_history_v1", histRaw);
    localStorage.setItem("trk_gymu_gyms_v1", gymsRaw);
  }, { histRaw, gymsRaw: JSON.stringify(gyms) });

  await page.goto("/");
  await page.locator("[data-tab='pesas']").click();
  const propuesta = page.locator("[data-gym-propuesta]");
  await expect(propuesta).toBeVisible();
  await expect(propuesta).toContainText("Parece que estás en Navy");
  await expect(page.locator("[data-gym-id='habitual']")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("[data-gym-id='gym-technogym']")).toHaveAttribute("aria-checked", "false");

  await page.locator("[data-gym-nuevo]").click();
  const formGym = page.locator("[data-gym-form]");
  await expect(formGym).toBeVisible();
  await expect(formGym).not.toContainText("Incremento");
  await expect(formGym).not.toContainText("Marca");
  await expect(formGym.getByRole("textbox", { name: "Marca" })).toHaveCount(0);
  await page.evaluate(() => {
    const form = document.querySelector("[data-gym-form]");
    const sc = document.querySelector(".app-scroll");
    const tabs = document.querySelector(".app-tabs");
    if (!form || !sc) return;
    const r = form.getBoundingClientRect();
    const tabTop = tabs ? tabs.getBoundingClientRect().top : window.innerHeight;
    sc.scrollTop += r.bottom - tabTop + 36;
  });
  if (info.project.name === "iphone-14-dark-chromium") await page.screenshot({ path: "/opt/cursor/artifacts/gym-form-iphone14-oscuro.png" });
  const nombre = page.locator("[data-gym-nombre]");
  const vwForm = page.viewportSize().width;
  const tabsForm = await page.locator(".app-tabs").boundingBox();
  for (const el of [nombre, formGym.getByRole("button", { name: "Ubicación" }), formGym.getByRole("button", { name: "Guardar" })]) {
    const b = await el.boundingBox();
    expect(b.width).toBeGreaterThanOrEqual(40);
    expect(b.x).toBeGreaterThanOrEqual(-1);
    expect(b.x + b.width).toBeLessThanOrEqual(vwForm + 1);
    expect(b.y + b.height).toBeLessThanOrEqual(tabsForm.y + 2);
    expect(overlap(b, tabsForm)).toBe(false);
  }
  await nombre.click();
  await nombre.fill("Casa");
  await expect(nombre).toHaveValue("Casa");
  await page.locator("[data-gym-guardar]").click();
  const casa = page.locator("[data-gym-id]").filter({ hasText: "Casa" });
  await expect(casa).toBeVisible();
  const casaClip = await casa.evaluate((el) => el.scrollWidth <= el.clientWidth + 2);
  expect(casaClip).toBe(true);
  await expect(propuesta).toBeVisible();

  await page.locator("[data-gym-confirmar]").click();
  await expect(page.locator("[data-gym-id='gym-technogym']")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("[data-gym-propuesta]")).toHaveCount(0);

  const guardado = await page.evaluate(() => localStorage.getItem("trk_gymu_history_v1"));
  expect(guardado).toContain("286.6");
  expect(guardado).not.toContain("gymId");
  const gymsGuardados = await page.evaluate(() => JSON.parse(localStorage.getItem("trk_gymu_gyms_v1") || "[]"));
  const casaGuardada = gymsGuardados.find((g) => g.nombre === "Casa");
  const navyGuardado = gymsGuardados.find((g) => g.id === "gym-technogym");
  expect(casaGuardada.unidad).toBe("lb");
  expect(casaGuardada.incremento).toBe(10);
  expect(navyGuardado.nombre).toBe("Navy");
  expect(navyGuardado.marca).toBe("Technogym");
  expect(navyGuardado.unidad).toBe("kg");
  expect(navyGuardado.incremento).toBe(5);

  await page.getByRole("button", { name: /Push/ }).click();
  await page.getByRole("radio", { name: /Normal/ }).click();
  const ask = page.locator("[data-hombro-ask]");
  if (await ask.count()) await ask.getByRole("radio", { name: "No" }).click();
  await page.getByRole("button", { name: "Empezar Push" }).click();
  await expect(page.locator(".sess-head")).toBeVisible();
  await expect(page.locator("[data-reloj-corriendo='1']")).toHaveCount(0);
  await expect(page.locator(".sess-head")).not.toContainText("Empezar regreso");
  const headH = await page.locator(".sess-head").evaluate((el) => el.getBoundingClientRect().height);
  expect(headH).toBeLessThan(96);
  const logo = page.locator(".sess-head img");
  const gear = page.locator("[data-ajustes-abrir]");
  const themeBtn = page.locator(".sess-head .theme-btn");
  expect(overlap(await logo.boundingBox(), await gear.boundingBox())).toBe(false);
  expect(overlap(await logo.boundingBox(), await themeBtn.boundingBox())).toBe(false);
  if (info.project.name.startsWith("iphone-14-light")) await page.screenshot({ path: "/opt/cursor/artifacts/header-compacto-claro.png" });
  if (info.project.name.startsWith("iphone-se-dark")) await page.screenshot({ path: "/opt/cursor/artifacts/header-compacto-oscuro.png" });
  await gear.click();
  const hoja = page.locator("[data-ajustes]");
  await expect(hoja).toBeVisible();
  await expect(hoja.locator("[data-gym-id='gym-technogym']")).toHaveAttribute("aria-checked", "true");
  await expect(hoja.locator("[data-modo-head]")).toContainText("Normal");
  await expect(hoja.locator("[data-molestia-panel]")).toBeVisible();
  const gearBox = await gear.boundingBox();
  const panelBox = await hoja.boundingBox();
  expect(panelBox.y).toBeGreaterThan(gearBox.y);
  expect(panelBox.y).toBeLessThan(gearBox.y + gearBox.height + 24);
  const vw = page.viewportSize().width;
  expect(Math.abs(panelBox.x + panelBox.width / 2 - vw / 2)).toBeLessThan(16);
  const pregunta = hoja.getByText("¿Te sigue doliendo el hombro derecho?");
  expect((await pregunta.boundingBox()).y).toBeLessThan((await hoja.getByRole("radio", { name: "No", exact: true }).boundingBox()).y);
  await expect(hoja).toContainText("sin quitar series");
  if (info.project.name.startsWith("iphone-14-light")) await page.screenshot({ path: "/opt/cursor/artifacts/ajustes-panel-claro.png" });
  if (info.project.name.startsWith("iphone-se-dark")) await page.screenshot({ path: "/opt/cursor/artifacts/ajustes-panel-oscuro.png" });
  await page.locator("[data-ajustes-cerrar]").click();
  await expect(hoja).toHaveCount(0);

  const card = page.locator("[data-ex-id='a1']");
  await card.scrollIntoViewIfNeeded();
  await card.getByRole("button", { name: "Abrir ejercicio" }).click();
  await expect(card.locator("span").first()).toContainText(/Chest Press/i);
  await expect(card.locator("[data-maquina-linea]")).toHaveText("en poleas");
  await expect(card.locator("[data-dolor-ex]")).toHaveCount(0);
  const peso = card.locator("[data-set-input='peso']");
  await expect(peso).toHaveValue("25");
  await peso.click();
  await peso.fill("30");
  await expect(peso).toHaveValue("30");
  const pesoBox = await peso.boundingBox();
  const headBox = await page.locator(".sess-head").boundingBox();
  const tabs = await page.locator(".app-tabs").boundingBox();
  expect(pesoBox.width).toBeGreaterThanOrEqual(40);
  expect(overlap(pesoBox, headBox)).toBe(false);
  expect(overlap(pesoBox, tabs)).toBe(false);
  if (info.project.name.startsWith("iphone-14-light")) await page.screenshot({ path: "/opt/cursor/artifacts/navy-a1-claro.png" });
  await card.getByRole("button", { name: "Más", exact: true }).click();
  const sug = card.locator("[data-sugerencia]");
  await expect(sug).toBeVisible();
  await expect(sug).toContainText("25 kg");
  await expect(sug).toContainText("de tu último peso en EW");
  const sugClip = await sug.evaluate((el) => el.scrollWidth <= el.clientWidth + 4);
  expect(sugClip).toBe(true);
  await scrollAboveTabs(page, sug);
  expect(overlap(await sug.boundingBox(), headBox)).toBe(false);
  expect(overlap(await sug.boundingBox(), await page.locator(".app-tabs").boundingBox())).toBe(false);

  const lag = await page.evaluate(() => new Promise((resolve) => {
    const sc = document.querySelector(".app-scroll");
    const t0 = performance.now();
    sc.scrollTo({ top: 240, behavior: "auto" });
    requestAnimationFrame(() => resolve({ ms: performance.now() - t0, top: sc.scrollTop }));
  }));
  expect(lag.top).toBeGreaterThan(40);
  expect(lag.ms).toBeLessThan(250);
  await expect(page.locator("[data-reloj-corriendo='1']")).toHaveCount(0);

  if (info.project.name.endsWith("-dark")) {
    const colors = await sug.evaluate((el) => {
      const s = getComputedStyle(el);
      return { fg: s.color, bg: s.backgroundColor };
    });
    expect(contrastRatio(colors.fg, colors.bg)).toBeGreaterThanOrEqual(3);
  }
  const shoot = async (file) => {
    await page.evaluate(() => {
      const card = document.querySelector("[data-ex-id='a1']");
      const sc = document.querySelector(".app-scroll");
      const head = document.querySelector(".sess-head");
      if (!card || !sc) return;
      const headH = head ? head.getBoundingClientRect().height : 0;
      const r = card.getBoundingClientRect();
      const scR = sc.getBoundingClientRect();
      sc.scrollTop += r.top - scR.top - headH - 8;
    });
    await page.screenshot({ path: file });
  };
  await card.getByRole("button", { name: "Técnica y notas" }).click();
  await expect(card.locator("[data-tips]")).toBeVisible();
  await expect(card.getByRole("link", { name: /YouTube/ })).toBeVisible();
  await expect(card.locator("[data-tips] img")).toHaveAttribute("src", /lever-chest-press/, { timeout: 8000 });
  await expect(card.locator("[data-maquina]")).toHaveCount(0);
  const nota = card.locator("textarea.note-field");
  await expect(nota).toBeVisible();
  await nota.click();
  await nota.fill("Máquina: Press en poleas");
  await nota.blur();
  await expect(card.locator("[data-maquina-linea]")).toHaveText("Máquina: Press en poleas");
  await nota.click();
  await page.evaluate(() => {
    const el = document.querySelector("[data-ex-id='a1'] textarea.note-field");
    el.value = "dictado hola";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(nota).toHaveValue("dictado hola");
  await nota.blur();
  await expect(nota).toHaveValue("dictado hola");
  await expect(card.locator("[data-maquina-linea]")).toHaveText("Máquina: Press en poleas");
  if (info.project.name.startsWith("iphone-14-light")) {
    await shoot("/opt/cursor/artifacts/sesion-series-claro.png");
    await page.screenshot({ path: "/opt/cursor/artifacts/maquina-claro.png" });
  }

  await page.locator(".sess-head").getByRole("button").first().click();
  await page.getByRole("button", { name: /Legs/ }).click();
  await page.getByRole("radio", { name: /Normal/ }).click();
  await page.locator("[data-molestia-ask]").getByRole("radio", { name: "No" }).click();
  await page.getByRole("button", { name: "Empezar Legs + Core" }).click();
  const prensa = page.locator("[data-ex-id='c1']");
  await prensa.scrollIntoViewIfNeeded();
  const pesoP = prensa.locator("[data-set-input='peso']");
  if (await pesoP.count() === 0) await prensa.getByRole("button", { name: /ejercicio/ }).click();
  await expect(prensa.locator("[data-sugerencia]")).toHaveCount(0);
  await expect(pesoP).toHaveValue("130");
  const axial = await page.locator("[data-ex-id]").evaluateAll((els) => els.map((el) => (el.textContent || "").toLowerCase()).join("\n"));
  expect(/sentadilla|peso muerto|press militar|good morning/.test(axial)).toBe(false);
});

async function sinDesborde(page) {
  const bad = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const out = [];
    document.querySelectorAll("button, input, [data-dolor-grid]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      if (r.right > w + 2) out.push((el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 32));
    });
    return out.slice(0, 6);
  });
  expect(bad).toEqual([]);
}

test("320 y gym: modos en dos líneas, dolor parejo y nada se sale", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-tab='pesas']").click();
  await page.getByRole("button", { name: /Push/ }).click();
  const modo = page.getByRole("radio", { name: /Normal/ });
  const lineas = await modo.locator("div").count();
  expect(lineas).toBe(2);
  const caben = await modo.locator("div").evaluateAll((els) => els.every((d) => d.scrollWidth <= d.clientWidth + 2 && d.clientHeight <= 20));
  expect(caben).toBe(true);
  await sinDesborde(page);
  await page.getByRole("radio", { name: /Normal/ }).click();
  const ask = page.locator("[data-hombro-ask]");
  await ask.getByRole("radio", { name: "Sí" }).click();
  const grid = page.locator("[data-dolor-grid]");
  await expect(grid).toBeVisible();
  await expect(grid.getByRole("button")).toHaveCount(11);
  const forma = await grid.getAttribute("data-dolor-grid");
  expect(forma === "11" || forma === "6").toBe(true);
  await sinDesborde(page);
  await ask.getByRole("button", { name: "2", exact: true }).click();
  await page.getByRole("button", { name: "Empezar Push" }).click();
  await expect(page.locator(".sess-head")).toBeVisible();
  const filas = await page.locator(".sess-head").evaluate((el) => el.querySelectorAll(":scope > div").length);
  expect(filas).toBe(1);
  const primera = page.locator("[data-ex-id]").first();
  const abrir = primera.getByRole("button", { name: "Abrir ejercicio" });
  if (await abrir.count()) await abrir.click();
  await sinDesborde(page);
});
