import { setTimeout as delay } from "node:timers/promises";

export function assertVisible(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function waitForServer(baseUrl, attempts = 30, delayMs = 250) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/index.html`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      await delay(delayMs);
    }
  }

  throw new Error(`Server did not start in time: ${baseUrl}`);
}

export async function dismissWelcomeModal(page) {
  const closeButton = page.locator("#closeWelcomeBtn");
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
    await page.locator("#welcomeModal").waitFor({ state: "hidden" });
  }
}

export async function waitForActiveSection(page, sectionId) {
  await page.waitForFunction((expectedSectionId) => {
    return document.querySelector(".section.active")?.id === expectedSectionId;
  }, sectionId);
}

export async function waitForWarningToast(page, previousCount = 0) {
  await page.waitForFunction((count) => {
    return document.querySelectorAll(".toast.warning").length > count;
  }, previousCount);
}
