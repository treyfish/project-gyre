import { expect, test } from "@playwright/test";

test("shows a useful fallback when WebGL is unavailable", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto("/?forceNoWebgl");

  await expect(page.getByRole("heading", { name: "Project Gyre" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "This ocean needs WebGL." })).toBeVisible();
  await expect(page.getByText(/current desktop version of Chrome, Edge, Firefox, or Safari/i)).toBeVisible();
  expect(pageErrors).toEqual([]);
});
