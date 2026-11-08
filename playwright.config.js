import { defineConfig, devices } from "@playwright/test";

/* Chromium y WebKit, más un viewport de 320 px (zoom de pantalla). */
const PHONES = ["iPhone SE", "iPhone 14", "iPhone 15 Pro Max"];
const SCHEMES = ["light", "dark"];
const BROWSERS = ["chromium", "webkit"];

const projects = [];
for (const browserName of BROWSERS) {
  for (const phone of PHONES) {
    const device = devices[phone];
    if (!device) throw new Error("Falta el device de Playwright: " + phone);
    for (const scheme of SCHEMES) {
      projects.push({
        name: (phone + "-" + scheme + "-" + browserName).toLowerCase().replace(/\s+/g, "-"),
        use: {
          ...device,
          browserName,
          defaultBrowserType: browserName,
          colorScheme: scheme,
          locale: "es-MX",
        },
      },);
    }
  }
}
for (const scheme of SCHEMES) {
  projects.push({
    name: "zoom-320-" + scheme,
    use: {
      browserName: "chromium",
      viewport: { width: 320, height: 568 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: scheme,
      locale: "es-MX",
    },
  });
}

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  timeout: 60000,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects,
});
