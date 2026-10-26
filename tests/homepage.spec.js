const { test, expect } = require("@playwright/test");

test.describe("Homepage — Core Architecture & Interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads the homepage and displays the hero section", async ({ page }) => {
    // Verify hero heading
    const heroHeading = page.locator("#hero-title");
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText("Curiosity is");

    // Verify kicker
    await expect(page.locator(".hero-kicker")).toContainText("FRONTEND DEVELOPER");
  });

  test("verifies profile card and 3D perspective tilt container", async ({ page }) => {
    const tiltContainer = page.locator(".portrait-tilt-container");
    await expect(tiltContainer).toBeVisible();

    const portraitCard = page.locator(".portrait-card");
    await expect(portraitCard).toBeVisible();
    await expect(page.locator(".portrait-card-tag")).toHaveText("THE HUMAN BEHIND THE PIXELS");

    // Simulate mouse move over illustration to trigger GSAP perspective tilt
    const illustration = page.locator(".hero-illustration");
    const box = await illustration.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 4, box.y + box.height / 4);
      await page.waitForTimeout(300);
      await page.mouse.move(box.x + (box.width * 3) / 4, box.y + (box.height * 3) / 4);
    }
  });

  test("verifies technical expertise / skills section", async ({ page }) => {
    const skillsSection = page.locator("#skills");
    await expect(skillsSection).toBeVisible();
    await expect(page.locator(".skills-heading h2")).toContainText("Disciplines");

    // Verify skill cards
    const skillCards = page.locator(".skill-card");
    await expect(skillCards).toHaveCount(3);
  });

  test("verifies selected builds section with GSAP scrubbed bento gallery", async ({ page }) => {
    const projectsSection = page.locator("#projects");
    await expect(projectsSection).toBeVisible();
    await expect(page.locator("#projects-title")).toContainText("Products made");

    // Verify bento gallery items exist
    const bentoItems = page.locator(".gallery__item.bento-item");
    const count = await bentoItems.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // Verify first project item (Reltime Admin)
    const firstProject = bentoItems.first();
    await expect(firstProject).toContainText("Reltime Admin");
  });

  test("verifies contact section and navigation bar", async ({ page }) => {
    const contactSection = page.locator("#contact");
    await expect(contactSection).toBeVisible();

    // Verify nav links
    const navbar = page.locator(".nav-bar");
    await expect(navbar).toBeVisible();
    await expect(navbar.locator("a", { hasText: "About" })).toBeVisible();
    await expect(navbar.locator("a", { hasText: "Work" })).toBeVisible();
    await expect(navbar.locator("a", { hasText: "Contact" })).toBeVisible();
  });
});

