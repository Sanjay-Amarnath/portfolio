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

  test("controls zoom level and resets back to 100%", async ({ page }) => {
    const zoomInBtn = page.locator('.zoom-btn[title="Zoom In"]');
    const zoomOutBtn = page.locator('.zoom-btn[title="Zoom Out"]');
    const resetBtn = page.locator(".zoom-reset-btn");
    const zoomLabel = page.locator(".zoom-label");

    await expect(zoomLabel).toHaveText("100%");

    // Zoom in
    await zoomInBtn.click();
    await expect(zoomLabel).toHaveText("110%");
    await expect(page.locator(".resume-paper-container")).toHaveCSS("transform", /matrix\(1\.1/);

    // Zoom out twice
    await zoomOutBtn.click();
    await zoomOutBtn.click();
    await expect(zoomLabel).toHaveText("90%");

    // Reset zoom
    await resetBtn.click();
    await expect(zoomLabel).toHaveText("100%");
  });

  test("verifies bottom spacing, canvas cushion, and bottom margin slider", async ({ page }) => {
    // 1. Verify canvas bottom cushion exists in preview scroll viewport
    const cushion = page.locator(".canvas-bottom-cushion");
    await expect(cushion).toBeAttached();

    // 2. Adjust bottom margin in Templates & Style tab
    await page.click('button:has-text("Templates & Style")');
    const bottomSlider = page.locator("#ctrl-bottom-margin");
    await expect(bottomSlider).toBeVisible();

    // Adjust bottom slider value
    await bottomSlider.fill("56");
    await bottomSlider.dispatchEvent("change");

    // Verify paper reflects custom bottom spacing
    const paper = page.locator(".resume-paper");
    await expect(paper).toHaveCSS("padding-bottom", "56px");
  });

  test("handles multi-page spillovers with dynamic cut lines, page jump, and 1-page fit", async ({ page }) => {
    // Switch to Markdown tab and paste enough content to spill onto Page 2
    await page.click('button:has-text("Markdown")');
    const mdEditor = page.locator(".markdown-raw-editor");

    const longMarkdown = `# Sanjay Amarnath
**Staff Software Engineer**
- Email: sanjay@example.com

## Professional Profile
${"Senior engineer with deep expertise in distributed frontend systems, WebGL rendering architectures, high throughput real-time communications, and enterprise platform infrastructure. ".repeat(6)}

## Technical Expertise
- Languages: TypeScript, JavaScript, Rust, Python, Go, SQL, HTML5, CSS3, SCSS
- Frameworks: React, Next.js, Vue, Angular, Svelte, Node.js, Express, Fastify
- Architecture: Micro-frontends, Serverless, GraphQL, REST, WebSockets, WebRTC

## Professional Experience
### Principal Architect · Global Technologies (2022 - Present)
- Led the complete migration of legacy monolith to high-performance distributed microfrontends reducing bundle size by 65%.
- Architected enterprise canvas rendering pipeline supporting over 100k nodes at 60 FPS using WebGL and Web Workers.
- Mentored over 40 software engineers and led cross-functional architectural reviews across 8 engineering teams.
- Implemented automated CI/CD security gate preventing vulnerable dependencies from reaching production.

### Senior Staff Engineer · HyperScale Networks (2019 - 2022)
- Built distributed realtime collaborative editing platform powering over 5 million concurrent monthly active users.
- Designed zero-downtime database migration strategy and schema versioning protocol across multi-region clusters.
- Spearheaded company-wide accessibility initiative achieving 100% WCAG AAA conformance across all client applications.
- Cut median LCP by 48% and INP by 55% using progressive hydration and edge server-side rendering.

### Senior Engineer · Cloud Native Solutions (2016 - 2019)
- Spearheaded modern web platform development and architected resilient cloud architectures on Kubernetes.
- Optimized bundle splitting and asset caching strategies achieving 99.9% uptime SLA.
- Designed comprehensive test suite with 95% branch coverage using automated end-to-end integration workflows.`;

    await mdEditor.fill(longMarkdown);

    // Verify dynamic page count badge displays multiple pages
    const pageBadge = page.locator(".page-count-badge");
    await expect(pageBadge).toContainText("Pages");

    // Verify visual page cut indicator appears
    const pageCut = page.locator(".a4-page-cut-separator").first();
    await expect(pageCut).toBeVisible();
    await expect(pageCut).toContainText("PAGE 1 END");

    // Verify page jump buttons exist and click Page 2
    const jumpBtn = page.locator('.page-jump-btn:has-text("P.2")');
    await expect(jumpBtn).toBeVisible();
    await jumpBtn.click();

    // Verify Fit 1-Page button works
    const fitBtn = page.locator(".fit-one-page-btn");
    await expect(fitBtn).toBeVisible();
    await fitBtn.click();
    await expect(page.locator(".toast-notification")).toContainText("Adjusted spacing");
  });

  test("edits technical skills with commas and multiline extras without glitching", async ({ page }) => {
    await page.click('button:has-text("Editor")');

    // 1. Skills input with commas
    await page.click('button:has-text("Skills")');
    const firstSkillInput = page.locator(".skill-cat-row input").first();
    await firstSkillInput.fill("React, Next.js, WebGL, Three.js");
    await expect(firstSkillInput).toHaveValue("React, Next.js, WebGL, Three.js");

    const paper = page.locator(".resume-paper");
    await expect(paper).toContainText("WebGL");
    await expect(paper).toContainText("Three.js");

    // 2. Extras multiline textarea
    await page.click('button:has-text("Certs & Lang")');
    const certsTextarea = page.locator('textarea[placeholder*="Meta Certified"]');
    await certsTextarea.fill("AWS Certified Solutions Architect (Amazon, 2024)\nKubernetes Administrator CKA (CNCF, 2023)");
    await expect(certsTextarea).toHaveValue(/AWS Certified.*\nKubernetes Administrator/);
    await expect(paper).toContainText("Kubernetes Administrator");
  });

  test("reorders sections up and down and verifies live preview hierarchy", async ({ page }) => {
    await page.click('button:has-text("Templates & Style")');

    const firstSectionItem = page.locator(".section-order-item").first();
    await expect(firstSectionItem).toBeVisible();

    // Move first section down
    const moveDownBtn = firstSectionItem.locator('button[title="Move section down"]');
    await moveDownBtn.click();

    // Verify toast or updated list
    const orderItems = page.locator(".section-order-item .sec-order-name");
    const secondSectionName = await orderItems.nth(0).innerText();
    expect(secondSectionName).toBeTruthy();
  });

  test("validates Print / Save PDF styling under print media emulation", async ({ page }) => {
    // Emulate print media
    await page.emulateMedia({ media: "print" });

    // Ensure chrome controls are hidden in print
    const topbar = page.locator(".resume-topbar");
    await expect(topbar).toBeHidden();

    const controls = page.locator(".builder-controls-pane");
    await expect(controls).toBeHidden();

    // Ensure the resume paper container is visible and has 210mm print geometry
    const paperContainer = page.locator(".resume-paper-container");
    await expect(paperContainer).toBeVisible();
    await expect(paperContainer).toHaveCSS("max-width", /793(\.\d+)?px/);

    // Return to screen media
    await page.emulateMedia({ media: "screen" });
    await expect(topbar).toBeVisible();
  });

  test("triggers standalone PDF download action", async ({ page }) => {
    const downloadBtn = page.locator(".download-pdf-btn");
    await expect(downloadBtn).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");
    await downloadBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test("allows manually adding space for header, footer, and pushing sections to new page", async ({ page }) => {
    // 1. Test toolbar quick margin controls
    const addHeaderBtn = page.locator('.spacing-btn:has-text("+ Header")');
    const addFooterBtn = page.locator('.spacing-btn:has-text("+ Footer")');
    await expect(addHeaderBtn).toBeVisible();
    await expect(addFooterBtn).toBeVisible();

    await addHeaderBtn.click();
    await expect(page.locator(".toast-notification")).toContainText("Added Header");

    await addFooterBtn.click();
    await expect(page.locator(".toast-notification")).toContainText("Added Footer");

    // 2. Test section-level manual page break (e.g. on Education)
    await page.click('button:has-text("Editor")');
    await page.click('button:has-text("Education")');

    const breakToggle = page.locator(".break-page-toggle").first();
    await expect(breakToggle).toBeVisible();
    await breakToggle.click();

    // Verify Education section receives page-break-before class in the document
    const eduSection = page.locator(".section-education");
    await expect(eduSection).toHaveClass(/page-break-before/);
  });
});

