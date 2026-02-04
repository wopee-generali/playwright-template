import "dotenv/config";
import {
  devices,
  defineConfig,
  PlaywrightTestConfig,
  PlaywrightTestOptions,
} from "@playwright/test";

type BrowserName = "chromium" | "firefox" | "webkit";

const browserToDevice: Record<BrowserName, keyof typeof devices> = {
  chromium: "Desktop Chrome",
  firefox: "Desktop Firefox",
  webkit: "Desktop Safari",
};

const selectedBrowser =
  (process.env.WOPEE_BROWSER as BrowserName) || "chromium";
const browser = browserToDevice[selectedBrowser] ?? "Desktop Chrome";

const projectsConfig: PlaywrightTestConfig<PlaywrightTestOptions>[] = [];

if (process.env.VIEWPORT) {
  const [width, height] = process.env.VIEWPORT.toLowerCase()
    .split("x")
    .map(Number);
  projectsConfig.push({
    name: `${browser} (custom viewport)`,
    use: {
      ...devices[browser],
      viewport: { width, height },
      headless: true,
    },
  });
} else if (process.env.WOPEE_DEVICE) {
  const deviceKey = process.env.WOPEE_DEVICE as keyof typeof devices;
  const device = devices[deviceKey];

  let browserType: BrowserName | null =
    (process.env.WOPEE_BROWSER as BrowserName | null) || null;
  // Firefox does not support isMobile
  if ((device.isMobile || device.hasTouch) && browserType === "firefox")
    browserType = null;

  projectsConfig.push({
    name: `${deviceKey}${browser ? ` (${browserType})` : ""}`,
    use: {
      ...device,
      ...(browserType && {
        defaultBrowserType: browserType,
      }),
      headless: true,
    },
  });
} else {
  projectsConfig.push({
    name: `${browser} (default)`,
    use: {
      ...devices[browser],
      headless: true,
    },
  });
}

export default defineConfig({
  testDir: ".",
  testMatch: ["**/*.spec.ts"],
  snapshotPathTemplate: "baselines{/projectName}/{testFilePath}/{arg}{ext}",
  fullyParallel: true,
  timeout: 100000,
  reporter: "@wopee-io/wopee.pw/wopee-reporter",
  workers: 1,
  use: {
    baseURL: process.env.WOPEE_PROJECT_URL || "http://localhost:3000",
    trace: process.env.CI ? "off" : "on-first-retry",
    video: process.env.CI ? "off" : "on",
    screenshot: "only-on-failure",
    httpCredentials: {
      username: process.env.BASIC_AUTH_USER || "",
      password: process.env.BASIC_AUTH_PASSWORD || "",
    },
  },

  projects: projectsConfig,
});
