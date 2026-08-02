import { expect, test, type Page } from "@playwright/test";

/**
 * The vertical slice, end to end.
 *
 * This is the one test that exercises a real canvas. Every jsdom test in the
 * suite deliberately avoids mounting the chart, because `getContext` returns
 * `null` there — so if the chart silently stopped painting, this spec is the
 * only thing that would notice.
 */

/**
 * Lightweight Charts defers its first paint and its canvas bitmap sizing to
 * `requestAnimationFrame`, which does not fire while a tab is backgrounded.
 * A blank chart then reports the default 300x150 while its wrapper lays out
 * correctly — indistinguishable from a real rendering bug.
 *
 * Bringing the page to the front and taking a screenshot forces a frame. Do not
 * remove this: sampling before it produces false "blank chart" readings.
 */
async function forceFrame(page: Page) {
  await page.bringToFront();
  await page.screenshot();
}

const primitives = "[data-primitive-id]";

/**
 * The chart is lazily imported, so it is absent for a beat after navigation.
 * Counting before it arrives yields zero and makes any comparison meaningless.
 */
async function waitForOverlays(page: Page) {
  await expect(page.locator(primitives).first()).toBeVisible();
}

/**
 * Click a `Switch` by its label rather than its input.
 *
 * The input is `sr-only` and the visible track intercepts pointer events, so
 * clicking the input directly times out. Clicking the label is also what a real
 * user does — the label wraps both.
 */
function switchLabel(page: Page, name: string) {
  return page.locator("label").filter({ hasText: name });
}

test.describe("platform shell", () => {
  test("redirects /platform to the default view", async ({ page }) => {
    await page.goto("/platform");
    await expect(page).toHaveURL(/\/platform\/inspect$/);
    await expect(page.getByRole("link", { name: "Inspect" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("labels its data as a demonstration", async ({ page }) => {
    // PRODUCT.md requires generated content to read as illustration, and the
    // journal looks far more like a running product than candles do.
    await page.goto("/platform/inspect");
    await expect(page.getByText("demonstration")).toBeVisible();
  });

  test("gives every view its own address", async ({ page }) => {
    await page.goto("/platform/inspect");
    await page.getByRole("link", { name: "Journal" }).click();
    await expect(page).toHaveURL(/\/platform\/journal$/);
    await expect(page.getByRole("link", { name: "Journal" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

test.describe("inspection chart", () => {
  test("paints a real canvas rather than the blank default", async ({ page }) => {
    await page.goto("/platform/inspect");
    await page.locator("canvas").first().waitFor();
    await forceFrame(page);

    const width = await page
      .locator("canvas")
      .first()
      .evaluate((c: HTMLCanvasElement) => c.width);

    // 300 is the HTML default. Anything above it means the chart sized itself,
    // which only happens once a frame has actually run.
    expect(width).toBeGreaterThan(300);
  });

  test("renders structure overlays on the chart", async ({ page }) => {
    await page.goto("/platform/inspect");
    await forceFrame(page);
    await expect(page.locator(primitives).first()).toBeVisible();
    expect(await page.locator(primitives).count()).toBeGreaterThan(3);
  });

  test("adds and removes shapes when a layer is toggled", async ({ page }) => {
    await page.goto("/platform/inspect");
    await forceFrame(page);
    await waitForOverlays(page);

    const before = await page.locator(primitives).count();
    await switchLabel(page, "Swing legs").click();

    await expect.poll(() => page.locator(primitives).count()).toBeLessThan(before);

    await switchLabel(page, "Swing legs").click();
    await expect.poll(() => page.locator(primitives).count()).toBe(before);
  });

  test("selects the same structure from the chart and the list", async ({ page }) => {
    await page.goto("/platform/inspect");
    await forceFrame(page);

    await page.getByRole("button", { name: /Fair value gap/ }).first().click();
    await expect(page.locator('[data-primitive-id][data-selected="true"]')).toHaveCount(1);
    // Selection is addressable, which is what makes an inspection shareable.
    await expect(page).toHaveURL(/selected=fvg-042/);
  });
});

test.describe("causal replay", () => {
  test("hides facts that had not been detected yet", async ({ page }) => {
    await page.goto("/platform/inspect?view=final");
    await forceFrame(page);
    await waitForOverlays(page);
    const finalCount = await page.locator(primitives).count();
    // Case-exact: the chart's own caption reads "final view" in lower case, and
    // the default matcher is case-insensitive.
    await expect(page.getByText("Final view", { exact: true })).toBeVisible();

    await page.goto("/platform/inspect?view=causal&step=2");
    await forceFrame(page);
    await waitForOverlays(page);

    await expect(page.getByText(/Causal view as of/)).toBeVisible();
    expect(await page.locator(primitives).count()).toBeLessThan(finalCount);
  });

  test("removes the new stop and later fills when the cursor moves back", async ({
    page,
  }) => {
    // The handoff's acceptance path, walked for real. The price is scoped to
    // the levels table — it also appears in the timeline's fill description,
    // and asserting on the bare string matches both.
    const stopRow = (page: Page) => page.getByRole("row").filter({ hasText: "Stop" });

    await page.goto("/platform/journal/trade-btc-001?view=final");
    await forceFrame(page);
    await waitForOverlays(page);

    await expect(stopRow(page)).toContainText("69261.75"); // moved to breakeven
    const finalFills = await page.locator('[data-primitive-id^="fill-"]').count();
    expect(finalFills).toBe(4);

    await page.goto("/platform/journal/trade-btc-001?view=causal&step=5");
    await forceFrame(page);
    await waitForOverlays(page);

    // The original stop is back, and its replacement is gone.
    await expect(stopRow(page)).toContainText("68708.25");
    await expect(stopRow(page)).not.toContainText("69261.75");
    expect(await page.locator('[data-primitive-id^="fill-"]').count()).toBeLessThan(
      finalFills,
    );
  });

  test("withholds the outcome until the trade closes", async ({ page }) => {
    // Showing net R while replaying the entry hands over the answer before the
    // decision has been judged.
    await page.goto("/platform/journal/trade-btc-001?view=causal&step=5");
    await forceFrame(page);

    const netR = page.locator("text=Your net R").locator("xpath=..");
    await expect(netR).not.toContainText("2.41");

    await page.goto("/platform/journal/trade-btc-001?view=final");
    await forceFrame(page);
    await expect(page.locator("text=Your net R").locator("xpath=..")).toContainText("2.41");
  });
});

test.describe("trade detail", () => {
  test("keeps reported R and actual net R separate", async ({ page }) => {
    await page.goto("/platform/journal/trade-btc-001");
    await forceFrame(page);

    await expect(page.getByText("Reported R")).toBeVisible();
    await expect(page.getByText("Your net R")).toBeVisible();
    await expect(page.getByText("3.20")).toBeVisible();
    await expect(page.getByText("2.41")).toBeVisible();
  });

  test("renders the plan and the fills over the structures", async ({ page }) => {
    await page.goto("/platform/journal/trade-btc-001");
    await forceFrame(page);

    await expect(page.locator('[data-primitive-id^="plan-"]').first()).toBeVisible();
    await expect(page.locator('[data-primitive-id^="fill-"]').first()).toBeVisible();
  });
});
