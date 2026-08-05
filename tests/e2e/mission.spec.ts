import { expect, test } from "@playwright/test";

test("plays a deterministic North Pacific mission", async ({ page }) => {
  test.setTimeout(180_000);
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto("/?testMissionTicks=720&testParticleCount=64");

  const beginMission = page.getByRole("button", { name: "Begin mission" });
  await expect(beginMission).toBeEnabled();
  await beginMission.click();
  await expect(page.getByRole("heading", { name: /The gyre holds the debris/ })).toBeVisible();

  await page.getByRole("button", { name: "Enter North Pacific" }).click();
  await expect(page.getByRole("complementary", { name: "Mission score" })).toBeVisible();
  await expect(page.getByText("3 available")).toBeVisible();
  const keyboardPlacement = page.getByRole("button", { name: "Deploy at recommended waypoint" });
  await keyboardPlacement.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("2 available")).toBeVisible();

  await page.getByRole("button", { name: "Play simulation" }).click();
  await expect(page.getByRole("button", { name: "Pause simulation" })).toBeVisible();
  await page.getByRole("button", { name: "Pause simulation" }).click();

  await page.getByRole("button", { name: "About the current data" }).click();
  await expect(page.getByText(/diffuse and mobile, not a solid island/i)).toBeVisible();
  await expect(page.getByText(/Current-control arrays are speculative game technology/i)).toBeVisible();
  await page.getByRole("button", { name: "Close data information" }).click();

  await page.getByRole("button", { name: "12×" }).click();
  await page.getByRole("button", { name: "Play simulation" }).click();
  await expect(page.getByText("Operation complete")).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Run again" }).click();

  await expect(page.getByText("3 available")).toBeVisible();
  await expect(page.locator(".total-score strong")).toHaveText("30");
  expect(pageErrors).toEqual([]);
});
