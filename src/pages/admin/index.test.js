import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Admin from "./index";

const mockInitialProjects = [{
  slug: "existing-project",
  name: "Existing project",
  type: "SaaS",
  category: "saas",
  context: "Web application",
  symbol: "EP",
  color: "blue",
  summary: "Original summary",
  contribution: "Built the interface",
  focus: ["Responsive UI"],
  stack: ["React"],
  learning: "Keep workflows clear",
}];

jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: (_auth, callback) => {
    callback({
      email: "sanjaymrnth@gmail.com",
      emailVerified: true,
      getIdToken: jest.fn().mockResolvedValue("verified-admin-token"),
    });
    return jest.fn();
  },
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("../../firebase", () => ({
  ADMIN_EMAIL: "sanjaymrnth@gmail.com",
  isFirebaseConfigured: true,
  MAX_PROFILE_IMAGE_SIZE: 4 * 1024 * 1024,
  MAX_RESUME_SIZE: 4 * 1024 * 1024,
  getFirebaseServices: () => ({ auth: {} }),
}));

jest.mock("../../socialLinks", () => ({
  DEFAULT_SOCIAL_LINKS: {
    instagram: "https://instagram.com/example",
    twitter: "https://x.com/example",
    linkedin: "https://linkedin.com/in/example",
  },
  loadSocialLinks: () => Promise.resolve({
    instagram: "https://instagram.com/example",
    twitter: "https://x.com/example",
    linkedin: "https://linkedin.com/in/example",
  }),
}));

jest.mock("../../data/projects", () => ({
  loadProjects: () => Promise.resolve(mockInitialProjects),
}));

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ message: "Saved. Deployment is pending." }),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("admin can add and edit a project and immediately sees the saved portfolio entry", async () => {
  render(<Admin />);
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(await screen.findByText("Existing project")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Project name"), { target: { value: "New portfolio project" } });
  fireEvent.change(screen.getByLabelText("URL slug"), { target: { value: "new-portfolio-project" } });
  fireEvent.change(screen.getByLabelText("Type"), { target: { value: "Commerce · SaaS" } });
  fireEvent.change(screen.getByLabelText("Context"), { target: { value: "Online booking" } });
  fireEvent.change(screen.getByLabelText("Card symbol"), { target: { value: "NP" } });
  fireEvent.change(screen.getByLabelText("Summary"), { target: { value: "New project summary" } });
  fireEvent.change(screen.getByLabelText("Your contribution"), { target: { value: "Built product features" } });
  fireEvent.change(screen.getByLabelText("Focus areas · one per line"), { target: { value: "Booking flow\nResponsive UI" } });
  fireEvent.change(screen.getByLabelText("Technology stack · comma-separated"), { target: { value: "React, Node.js" } });
  fireEvent.change(screen.getByLabelText("What you learned"), { target: { value: "Make each step clear" } });
  const addButtons = screen.getAllByRole("button", { name: "Add project", exact: true });
  fireEvent.click(addButtons[addButtons.length - 1]);

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  let savedProjects = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(savedProjects.map((project) => project.slug)).toEqual([
    "existing-project",
    "new-portfolio-project",
  ]);
  expect(await screen.findByText("New portfolio project")).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[1]);
  fireEvent.change(screen.getByLabelText("Summary"), {
    target: { value: "Updated project summary" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save project changes" }));

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  savedProjects = JSON.parse(global.fetch.mock.calls[1][1].body);
  expect(savedProjects[1].summary).toBe("Updated project summary");
  expect(await screen.findByText("Saved. Deployment is pending.")).toBeInTheDocument();
});

test("asset upload controls are available only to the verified admin", async () => {
  render(<Admin />);
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(await screen.findByLabelText("Replace resume PDF")).toBeInTheDocument();
  expect(await screen.findByText("Existing project")).toBeInTheDocument();
  expect(screen.getByLabelText("Replace profile image")).toBeInTheDocument();

  const resume = new File(["%PDF-1.4"], "resume.pdf", { type: "application/pdf" });
  fireEvent.change(screen.getByLabelText("Replace resume PDF"), {
    target: { files: [resume] },
  });
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  expect(global.fetch.mock.calls[0][0]).toBe("/api/admin-assets?asset=resume");
  expect(global.fetch.mock.calls[0][1]).toMatchObject({
    method: "PUT",
    headers: {
      Authorization: "Bearer verified-admin-token",
      "Content-Type": "application/json",
    },
  });
  expect(JSON.parse(global.fetch.mock.calls[0][1].body).fileBase64).toBe(
    Buffer.from("%PDF-1.4").toString("base64"),
  );

  expect(screen.getByLabelText("Replace profile image")).toHaveAttribute("accept", "image/*");

  fireEvent.change(screen.getByLabelText("instagram"), {
    target: { value: "https://instagram.com/updated" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save social links" }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  expect(global.fetch.mock.calls[1][0]).toBe("/api/admin-assets?asset=socialLinks");
  expect(JSON.parse(global.fetch.mock.calls[1][1].body).instagram).toBe(
    "https://instagram.com/updated",
  );
});
