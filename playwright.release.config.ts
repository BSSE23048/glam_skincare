import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "release.spec.ts",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: [["list"], ["json", { outputFile: ".audit/release-results.json" }]],
  // Trace ZIP writes are unreliable in this OneDrive workspace; retain screenshots and JSON instead.
  use: {
    baseURL: "http://127.0.0.1:5175",
    channel: "chrome",
    trace: "off",
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js preview --outDir .audit/qa-dist --port 5175 --host 127.0.0.1",
    url: "http://127.0.0.1:5175",
    reuseExistingServer: true,
  },
});
