function addText(doc, text, x, y, width, options = {}) {
  if (!text) return y;
  const lines = doc.splitTextToSize(String(text), width);
  const lineHeight = options.lineHeight || 4.5;
  const textOptions = { ...options };
  delete textOptions.lineHeight;
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    let availableLines = Math.floor((297 - 16 - y) / lineHeight);
    if (availableLines < 1) {
      doc.addPage();
      y = 16;
      availableLines = Math.floor((297 - 16 - y) / lineHeight);
    }
    const pageLines = lines.slice(lineIndex, lineIndex + availableLines);
    doc.text(pageLines, x, y, textOptions);
    y += pageLines.length * lineHeight;
    lineIndex += pageLines.length;
    if (lineIndex < lines.length) {
      doc.addPage();
      y = 16;
    }
  }
  return y;
}

function ensurePage(doc, y, height, margin) {
  if (y + height <= 297 - margin) return y;
  doc.addPage();
  return margin;
}

export async function downloadResumePdf(resume, fileName = "resume.pdf") {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const textWidth = pageWidth - margin * 2;
  let y = margin;
  const personal = resume.personal || {};

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  const name = personal.name || "Resume";
  doc.text(name, pageWidth / 2, y + 6, { align: "center" });
  y += 11;

  if (personal.title) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(personal.title, pageWidth / 2, y, { align: "center" });
    y += 6;
  }

  const contact = [
    personal.phone,
    personal.email,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.portfolio,
  ].filter(Boolean).join("  |  ");
  if (contact) {
    doc.setFontSize(8.5);
    y = addText(doc, contact, pageWidth / 2, y, textWidth, { align: "center", lineHeight: 4 });
  }
  y += 2;
  doc.setDrawColor(130, 143, 139);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  const addSection = (title, renderContent) => {
    const content = renderContent();
    if (!content) return;
    y = ensurePage(doc, y, 14, margin);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(38, 61, 58);
    doc.text(title.toUpperCase(), margin, y);
    y += 2;
    doc.setDrawColor(170, 177, 173);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(32, 41, 43);
    content();
    y += 2;
  };

  addSection("Professional Profile", () => resume.summary && (() => {
    y = ensurePage(doc, y, 8, margin);
    y = addText(doc, resume.summary, margin, y, textWidth);
  }));

  const skillGroups = Object.entries(resume.skills || {})
    .filter(([, values]) => values?.length);
  addSection("Technical Expertise", () => skillGroups.length && (() => {
    skillGroups.forEach(([group, values]) => {
      const label = `${group.replace(/([A-Z])/g, " $1")}:`;
      const labelWidth = 48;
      const valueWidth = textWidth - labelWidth;
      const valueLines = doc.splitTextToSize(values.join(", "), valueWidth);
      y = ensurePage(doc, y, Math.max(1, valueLines.length) * 4.5, margin);
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, y);
      doc.setFont("helvetica", "normal");
      y = addText(doc, values.join(", "), margin + labelWidth, y, valueWidth);
    });
  }));

  const addEntries = (items, getHeading, getDetails, getBullets) => {
    if (!items?.length) return null;
    return () => items.forEach((item) => {
      const bulletItems = getBullets(item) || [];
      y = ensurePage(doc, y, 13, margin);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      y = addText(doc, getHeading(item), margin, y, textWidth);
      doc.setFont("helvetica", "normal");
      const detail = getDetails(item);
      if (detail) y = addText(doc, detail, margin, y, textWidth);
      bulletItems.forEach((bullet) => {
        const lines = doc.splitTextToSize(bullet, textWidth - 5);
        y = ensurePage(doc, y, lines.length * 4.5 + 2, margin);
        doc.text("-", margin + 1, y);
        y = addText(doc, bullet, margin + 5, y, textWidth - 5);
      });
      y += 2;
    });
  };

  addSection("Career History", () => addEntries(
    resume.experience,
    (job) => [job.company, job.role].filter(Boolean).join(" — "),
    (job) => [
      [job.startDate, job.current ? "Present" : job.endDate].filter(Boolean).join(" – "),
      job.location,
    ].filter(Boolean).join("  |  "),
    (job) => job.bullets,
  ));

  addSection("Project Details", () => addEntries(
    resume.projects,
    (project) => [project.name, project.role].filter(Boolean).join(" — "),
    (project) => [
      project.description,
      project.technologies?.length ? `Technologies: ${project.technologies.join(", ")}` : "",
    ].filter(Boolean).join("\n"),
    (project) => project.bullets,
  ));

  addSection("Education", () => addEntries(
    resume.education,
    (education) => [education.degree, education.institution].filter(Boolean).join(" — "),
    (education) => [
      [education.startDate, education.endDate].filter(Boolean).join(" – "),
      education.location,
    ].filter(Boolean).join("  |  "),
    () => [],
  ));

  [
    ["Achievements", resume.achievements],
    ["Certifications", resume.certifications],
    ["Languages", resume.languages],
  ].forEach(([title, items]) => addSection(title, () => items?.length && (() => {
    items.forEach((item) => {
      const lines = doc.splitTextToSize(item, textWidth - 5);
      y = ensurePage(doc, y, lines.length * 4.5 + 2, margin);
      doc.text("-", margin + 1, y);
      y = addText(doc, item, margin + 5, y, textWidth - 5);
    });
  })));

  const safeName = fileName
    .split("")
    .map((character) => (
      character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character)
        ? "-"
        : character
    ))
    .join("")
    .trim() || "resume.pdf";
  const pdf = doc.output("blob");
  if (pdf.size === 0 || pdf.type !== "application/pdf") {
    throw new Error("PDF generation returned an empty or invalid file.");
  }

  const downloadUrl = URL.createObjectURL(pdf);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = safeName;
  downloadLink.hidden = true;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
}
