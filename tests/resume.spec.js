const { test, expect } = require("@playwright/test");

test.describe("Resume Lab — Magic Resume Studio Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto("/resume");
    await page.waitForSelector('.resume-builder-workspace[data-hydrated="true"]');
  });

  test("loads Resume Lab workspace and displays default profile", async ({ page }) => {
    await expect(page.locator(".brand-title")).toHaveText("Resume Lab");

    // Verify paper preview has candidate name
    const paper = page.locator(".resume-paper");
    await expect(paper).toBeVisible();
    await expect(paper.locator(".resume-name")).toHaveText("Sanjay Amarnath");
    await expect(paper).toContainText("Reltime");
  });

  test("switches between multiple layout templates seamlessly", async ({ page }) => {
    // Navigate to Templates & Style tab
    await page.click('button:has-text("Templates & Style")');

    // 1. Classic Template
    await page.click('button:has-text("Classic")');
    await expect(page.locator(".resume-paper-container")).toHaveClass(/template-classic/);

    // 2. Two-Column (Left-Right)
    await page.click('button:has-text("Two-Column")');
    await expect(page.locator(".resume-paper-container")).toHaveClass(/template-left-right/);
    await expect(page.locator(".two-column-layout")).toBeVisible();

    // 3. Timeline Template
    await page.click('button:has-text("Timeline")');
    await expect(page.locator(".resume-paper-container")).toHaveClass(/template-timeline/);

    // 4. Minimalist Template
    await page.click('button:has-text("Minimalist")');
    await expect(page.locator(".resume-paper-container")).toHaveClass(/template-minimalist/);

    // 5. Editorial Template
    await page.click('button:has-text("Editorial")');
    await expect(page.locator(".resume-paper-container")).toHaveClass(/template-editorial/);

    // 6. Swiss Grid Template
    await page.click('button:has-text("Swiss Grid")');
    await expect(page.locator(".resume-paper-container")).toHaveClass(/template-swiss/);
  });

  test("updates candidate information in real time from the form editor", async ({ page }) => {
    await page.click('button:has-text("Editor")');

    // Update Name
    const nameInput = page.locator("#p-name");
    await nameInput.fill("Alex Morgan");

    // Update Headline
    const titleInput = page.locator("#p-title");
    await titleInput.fill("Staff Frontend Architect");

    // Verify preview reflects changes instantly
    const paper = page.locator(".resume-paper");
    await expect(paper.locator(".resume-name")).toHaveText("Alex Morgan");
    await expect(paper.locator(".resume-headline")).toHaveText("Staff Frontend Architect");
  });

  test("adds a new experience role and polishes bullet with AI", async ({ page }) => {
    await page.click('button:has-text("Editor")');
    await page.click('button:has-text("Experience")');

    // Click + Add Role
    await page.click('button:has-text("+ Add Role")');

    // Edit the new role's company
    const firstCompanyInput = page.locator('.entry-card input[placeholder="Company Name"]').first();
    await firstCompanyInput.fill("Acme Corp");

    const paper = page.locator(".resume-paper");
    await expect(paper).toContainText("Acme Corp");

    // Click polish on the bullet point
    const polishBtn = page.locator(".polish-chip-btn").first();
    await polishBtn.click();

    // Check toast notification
    await expect(page.locator(".toast-notification")).toContainText("enhanced");
  });

  test("syncs bi-directional Markdown editing", async ({ page }) => {
    // Navigate to Markdown tab
    await page.click('button:has-text("Markdown")');

    const mdEditor = page.locator(".markdown-raw-editor");
    await expect(mdEditor).toBeVisible();
    await expect(mdEditor).toHaveValue(/# Sanjay Amarnath/);

    // Edit markdown text
    const customMarkdown = "# Bruce Wayne\n**Chief Executive Officer**\n\n- Email: bruce@wayne.enterprises\n\n## Professional Summary\nGlobal industrialist.";
    await mdEditor.fill(customMarkdown);

    // Verify live preview updated from markdown
    const paper = page.locator(".resume-paper");
    await expect(paper.locator(".resume-name")).toHaveText("Bruce Wayne");
    await expect(paper.locator(".resume-headline")).toHaveText("Chief Executive Officer");
  });

  test("runs ATS keyword match analysis against a job description", async ({ page }) => {
    await page.click('button:has-text("ATS Matcher")');

    const jobInput = page.locator('.ats-card textarea');
    await jobInput.fill("We are seeking a Senior Frontend Engineer with React, TypeScript, Next.js, Redux, and WebSockets experience.");

    // Verify match score updates
    const scoreNum = page.locator(".score-dial .score-num");
    await expect(scoreNum).toBeVisible();
    const scoreText = await scoreNum.innerText();
    const score = parseInt(scoreText, 10);
    expect(score).toBeGreaterThan(40);

    // Verify matched keywords chips
    const matchedChips = page.locator(".kw-chip.is-matched");
    await expect(matchedChips.first()).toBeVisible();
  });

  test("tests undo and redo operations", async ({ page }) => {
    await page.click('button:has-text("Editor")');

    const nameInput = page.locator("#p-name");
    await nameInput.fill("Original Name");
    await nameInput.fill("Updated Name");

    await expect(page.locator(".resume-paper .resume-name")).toHaveText("Updated Name");

    // Click Undo
    const undoBtn = page.locator('button[title="Undo"]');
    await undoBtn.click();
    await expect(page.locator(".resume-paper .resume-name")).toHaveText("Original Name");

    // Click Redo
    const redoBtn = page.locator('button[title="Redo"]');
    await redoBtn.click();
    await expect(page.locator(".resume-paper .resume-name")).toHaveText("Updated Name");
  });

  test("switches between presets (Blank and Default)", async ({ page }) => {
    const presetSelect = page.locator(".preset-select");

    // Select Blank
    await presetSelect.selectOption("blank");
    await expect(page.locator(".resume-paper .resume-name")).toHaveText("Your Name");

    // Select Sanjay Amarnath
    await presetSelect.selectOption("sanjay");
    await expect(page.locator(".resume-paper .resume-name")).toHaveText("Sanjay Amarnath");
  });
});

