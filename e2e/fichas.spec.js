import { expect, test } from "@playwright/test";

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

function rgb(color) {
  return (String(color).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
}

async function encuadrar(page, card) {
  await card.evaluate((node) => {
    const sc = node.closest(".app-scroll") || document.querySelector(".app-scroll");
    const head = document.querySelector(".sess-head");
    const bajo = head ? head.getBoundingClientRect().bottom : 0;
    if (!sc) return;
    sc.scrollTop += node.getBoundingClientRect().top - bajo - 8;
  });
}

test("el dolor se pregunta al empezar y no en cada ejercicio", async ({ page }, info) => {
  await page.goto("/");
  await page.locator("[data-tab='pesas']").click();
  await page.getByRole("button", { name: /Push/ }).click();
  const ask = page.locator("[data-hombro-ask]");
  await expect(ask).toBeVisible();
  await expect(ask).toContainText("hombro");
  if (info.project.name === "iphone-14-light-webkit") {
    await page.screenshot({ path: "/opt/cursor/artifacts/dolor-inicio-iphone14.png" });
  }
  if (info.project.name === "iphone-14-dark-webkit") {
    await page.screenshot({ path: "/opt/cursor/artifacts/dolor-inicio-iphone14-oscuro.png" });
  }
  await page.getByRole("radio", { name: /Normal/ }).click();
  await ask.getByRole("radio", { name: "No" }).click();
  await page.getByRole("button", { name: "Empezar Push" }).click();
  await expect(page.locator("[data-dolor-ex]")).toHaveCount(0);
  await page.locator("[data-ex-id]").first().getByRole("button", { name: "Más", exact: true }).click();
  await expect(page.locator("[data-dolor-ex]")).toHaveCount(0);
});

test("acordeón, nota a lo ancho, borde y contador", async ({ page }, info) => {
  await abrirPush(page);
  const cards = page.locator("[data-ex-id]");
  const primera = cards.first();
  const segunda = cards.nth(1);
  const tercera = cards.nth(2);
  await expect(page.locator("[data-progreso]")).toHaveText(/^0\/\d+$/);
  const head = await page.locator(".sess-head").boundingBox();
  const prog = await page.locator("[data-progreso]").boundingBox();
  expect(prog.y).toBeGreaterThanOrEqual(head.y - 1);
  expect(prog.y + prog.height).toBeLessThanOrEqual(head.y + head.height + 1);
  expect(head.height).toBeLessThan(96);
  const progEntero = await page.locator("[data-progreso]").evaluate((el) => el.scrollWidth <= el.clientWidth + 2);
  expect(progEntero).toBe(true);

  await expect(primera).toHaveAttribute("data-estado", "nada");
  const nota = primera.locator("textarea.note-field");
  await expect(nota).toBeVisible();
  const notaBox = await nota.boundingBox();
  const iconos = await primera.locator("[data-note-icons]").boundingBox();
  const tarjeta = await primera.boundingBox();
  expect(iconos.y).toBeGreaterThanOrEqual(notaBox.y + notaBox.height - 4);
  expect(notaBox.width).toBeGreaterThan(tarjeta.width * 0.72);
  await nota.fill("nota ancha");
  await expect(nota).toHaveValue("nota ancha");
  if (info.project.name === "iphone-14-light-webkit") {
    await primera.locator("[data-note-panel]").screenshot({ path: "/opt/cursor/artifacts/nota-grok-iphone14.png" });
  }
  if (info.project.name === "iphone-14-dark-webkit") {
    await primera.locator("[data-note-panel]").screenshot({ path: "/opt/cursor/artifacts/nota-grok-iphone14-oscuro.png" });
  }
  const sinCorte = await nota.evaluate((el) => el.value === "nota ancha" && el.scrollWidth <= el.clientWidth + 8);
  expect(sinCorte).toBe(true);

  await segunda.getByRole("button", { name: "Abrir ejercicio" }).click();
  await expect(segunda).toHaveAttribute("data-abierto", "1");
  await expect(primera).toHaveAttribute("data-abierto", "0");
  await tercera.getByRole("button", { name: "Abrir ejercicio" }).click();
  await expect(tercera).toHaveAttribute("data-abierto", "1");
  await expect(segunda).toHaveAttribute("data-abierto", "0");

  await primera.getByRole("button", { name: "Abrir ejercicio" }).click();
  await expect(primera).toHaveAttribute("data-abierto", "1");
  await expect(tercera).toHaveAttribute("data-abierto", "0");
  await primera.locator("button").filter({ hasText: "✓" }).last().click();
  await expect(primera).toHaveAttribute("data-estado", "media");
  const amarillo = rgb(await primera.evaluate((el) => getComputedStyle(el).borderTopColor));
  expect(amarillo[0]).toBeGreaterThan(180);
  expect(amarillo[1]).toBeGreaterThan(140);
  expect(amarillo[2]).toBeLessThan(120);

  if (info.project.name === "iphone-14-light-webkit") {
    await encuadrar(page, primera);
    await page.screenshot({ path: "/opt/cursor/artifacts/tarjeta-amarilla-nota-iphone14.png" });
  }
  if (info.project.name === "iphone-14-dark-webkit") {
    await encuadrar(page, tercera);
    await tercera.getByRole("button", { name: "Abrir ejercicio" }).click();
    await page.screenshot({ path: "/opt/cursor/artifacts/tarjeta-blanca-nota-iphone14-oscuro.png" });
    await primera.getByRole("button", { name: "Abrir ejercicio" }).click();
  }

  for (let i = 0; i < 8 && await primera.getAttribute("data-estado") !== "listo"; i++) {
    const marca = primera.locator("button").filter({ hasText: "✓" }).last();
    if (await marca.count() === 0) break;
    await marca.click();
  }
  await expect(primera).toHaveAttribute("data-estado", "listo");
  if (await primera.getAttribute("data-abierto") !== "1") {
    await primera.getByRole("button", { name: "Abrir ejercicio" }).click();
  }
  const verde = rgb(await primera.evaluate((el) => getComputedStyle(el).borderTopColor));
  expect(verde[1]).toBeGreaterThan(verde[0]);
  expect(verde[1]).toBeGreaterThan(140);
  await expect(page.locator("[data-progreso]")).toHaveText(/^1\/\d+$/);

  if (info.project.name === "iphone-14-light-webkit") {
    await encuadrar(page, primera);
    await page.screenshot({ path: "/opt/cursor/artifacts/tarjeta-verde-nota-iphone14.png" });
    await tercera.getByRole("button", { name: "Abrir ejercicio" }).click();
    await encuadrar(page, tercera);
    await page.screenshot({ path: "/opt/cursor/artifacts/tarjeta-blanca-contador-iphone14.png" });
  }
});
