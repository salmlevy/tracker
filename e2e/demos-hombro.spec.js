import { expect, test } from "@playwright/test";

async function openPush(page) {
  await page.goto("/");
  await page.locator("[data-tab='pesas']").click();
  await page.getByRole("button", { name: /Push/ }).click();
  await page.getByRole("radio", { name: /Relajado/ }).click();
  const ask = page.locator("[data-hombro-ask]");
  if (await ask.count()) {
    await ask.getByRole("radio", { name: "Sí" }).click();
    await ask.getByRole("button", { name: "2", exact: true }).click();
  }
  await page.getByRole("button", { name: "Empezar Push" }).click();
  await expect(page.locator(".sess-head")).toBeVisible();
}

test("h4 y h5 muestran la referencia y no el gif equivocado", async ({ page }, info) => {
  await openPush(page);

  const h4 = page.locator("[data-ex-id='h4']");
  await h4.scrollIntoViewIfNeeded();
  await h4.getByRole("button", { name: "Técnica y notas" }).click();
  await expect(h4.locator("[data-gif-mini]")).toHaveCount(0);
  await expect(h4.locator("img")).toHaveCount(0);
  const ref = h4.getByRole("link", { name: "Referencia: Isométrico de abducción en pared" });
  await expect(ref).toHaveAttribute("href", "https://www.columbiadoctors.org/health-library/multimedia/shoulder-abduction-isometric-1/");
  await expect(h4.locator("[data-demo-nota]")).toHaveText("Sin gif. La demostración está en ColumbiaDoctors.");
  await expect(h4.locator("[data-tips]")).toContainText("Codo a 90° y la palma como para dar la mano");
  await expect(h4.locator("[data-tips]")).toContainText("Antebrazo y codo cerca de la pared. Empuja el codo");
  await expect(h4.locator("[data-tips]")).not.toContainText("Dorso de la mano");
  const refBox = await ref.boundingBox();
  expect(refBox.height).toBeGreaterThanOrEqual(44);
  expect(refBox.width).toBeGreaterThanOrEqual(44);

  const h5 = page.locator("[data-ex-id='h5']");
  await h5.scrollIntoViewIfNeeded();
  await h5.getByRole("button", { name: "Técnica y notas" }).click();
  await expect(h5.locator("[data-gif-mini]")).toHaveCount(0);
  await expect(h5.locator("img")).toHaveCount(0);
  const video = h5.getByRole("link", { name: "YouTube: Face pull en polea (ligero)" });
  await expect(video).toHaveAttribute("href", "https://www.youtube.com/watch?v=rep-qVOkqgk");
  await expect(h5.locator("[data-demo-nota]")).toHaveText("Sin gif. La demostración está en el video.");
  await expect(h5.locator("[data-tips]")).toContainText("Polea a la altura del pecho, o un poco más abajo");
  await expect(h5.locator("[data-tips]")).toContainText("Jala la cuerda hacia la cara");
  await expect(h5.locator("[data-tips]")).toContainText("Codos más altos que las muñecas");
  const videoBox = await video.boundingBox();
  expect(videoBox.height).toBeGreaterThanOrEqual(44);
  expect(videoBox.width).toBeGreaterThanOrEqual(44);

  if (info.project.name === "iphone-14-light-chromium") {
    const alinear = (id) => page.locator("[data-ex-id='" + id + "']").evaluate((node) => {
      const sc = node.closest(".app-scroll");
      const head = document.querySelector(".sess-head");
      const bajo = head ? head.getBoundingClientRect().bottom : 0;
      sc.scrollTop += node.getBoundingClientRect().top - bajo - 8;
    });
    await alinear("h4");
    await page.screenshot({ path: "/opt/cursor/artifacts/ficha-h4-columbia-iphone14.png" });
    await alinear("h5");
    await page.screenshot({ path: "/opt/cursor/artifacts/ficha-h5-video-iphone14.png" });
  }
});
