const { test, expect } = require("@playwright/test");

test.describe("Jobs Board — User Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.locator(".jobs-hero")).toBeVisible();
  });

  test("should load the jobs board page and display sample jobs", async ({ page }) => {
    await expect(page.locator(".jobs-hero h1")).toContainText("Every IT job");
    await expect(page.locator(".job-card")).toHaveCount(4);
  });

  test("should navigate to a job detail page and back", async ({ page }) => {
    await page.locator(".job-card").first().locator(".view-details-link").click();
    await expect(page.locator(".job-main-title")).toBeVisible();
    await expect(page.locator(".apply-now-btn")).toBeVisible();
    await page.locator(".back-link").click();
    await expect(page.locator(".jobs-hero")).toBeVisible();
  });

  test("should search jobs by keyword", async ({ page }) => {
    const input = page.locator(".search-bar-wrapper input");
    await input.click();
    await input.press("Stripe");
    await expect(page.locator(".job-card")).toHaveCount(1);
    await expect(page.locator(".job-company-name").first()).toContainText("Stripe");
  });

  test("should search jobs by skill", async ({ page }) => {
    const input = page.locator(".search-bar-wrapper input");
    await input.click();
    await input.press("React");
    const cards = page.locator(".job-card");
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should filter jobs by work mode", async ({ page }) => {
    const selects = page.locator(".filter-group select");
    await selects.nth(0).selectOption("remote");
    const cards = page.locator(".job-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator(".job-workmode-badge")).toHaveText("remote");
    }
  });

  test("should filter jobs by category", async ({ page }) => {
    const selects = page.locator(".filter-group select");
    await selects.nth(1).selectOption("Engineering");
    const cards = page.locator(".job-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator(".job-skill-tag").first()).toBeVisible();
    }
  });

  test("should filter jobs by clicking a skill pill", async ({ page }) => {
    await page.locator(".skill-pill").nth(1).click();
    await expect(page.locator(".skill-pill").nth(1)).toHaveClass(/active/);
    const cards = page.locator(".job-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should reset filters when clicking Reset Filters on empty state", async ({ page }) => {
    const input = page.locator(".search-bar-wrapper input");
    await input.click();
    await input.press("zzz_nonexistent_zzz");
    await expect(page.locator(".jobs-empty")).toBeVisible();
    await page.click(".secondary-btn");
    await expect(page.locator(".job-card")).toHaveCount(4);
    await expect(page.locator(".search-bar-wrapper input")).toHaveValue("");
  });

  test("should open the post-a-job modal and create a new job", async ({ page }) => {
    await page.click(".jobs-hero-actions .primary-btn");
    await expect(page.locator(".modal-content")).toBeVisible();
    await expect(page.locator(".modal-header h2")).toContainText("Post a New Job Opportunity");

    await page.fill("input[placeholder*='Job Title']", "Test Automation Engineer");
    await page.fill("input[placeholder*='Company Name']", "Acme Test Corp");
    await page.fill("input[placeholder*='Location']", "Austin, TX (Hybrid)");
    await page.selectOption(".job-form select", "hybrid");
    await page.fill("input[placeholder*='Skills']", "Playwright, TypeScript, E2E Testing");
    await page.fill("input[placeholder*='Application URL']", "https://acme.test/careers");
    await page.fill("textarea[placeholder*='Description']", "Build robust E2E test suites for the platform team.");

    await page.click(".modal-footer .primary-btn");
    await expect(page.locator(".modal-backdrop")).not.toBeVisible({ timeout: 5000 });

    const newCard = page.locator(".job-card").filter({ hasText: "Test Automation Engineer" });
    await expect(newCard).toBeVisible();
    await expect(newCard.locator(".job-company-name")).toContainText("Acme Test Corp");
  });

  test("should display the job detail page with apply link", async ({ page }) => {
    await page.goto("/jobs/senior-fullstack-engineer-stripe");
    await expect(page.locator(".job-main-title")).toContainText("Senior Full-Stack Engineer");
    await expect(page.locator(".company-label")).toContainText("Stripe");
    await expect(page.locator(".apply-now-btn")).toHaveAttribute("href", "https://stripe.com/jobs");
    await expect(page.locator(".skill-badge").first()).toHaveText("React");
  });

  test("should show back link on detail page", async ({ page }) => {
    await page.goto("/jobs/senior-fullstack-engineer-stripe");
    await expect(page.locator(".back-link")).toContainText("Back to all jobs");
  });

  test("should navigate to jobs board from navbar", async ({ page }) => {
    await page.goto("/");
    await page.click(".navbar-wrap a[href='/jobs']");
    await expect(page.locator(".jobs-hero")).toBeVisible();
  });
});