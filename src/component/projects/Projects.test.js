import { render, screen, waitFor } from "@testing-library/react";
import Projects from "./Projects";

const savedProject = {
  slug: "admin-created-case-study",
  name: "Admin-created case study",
  type: "Product · SaaS",
  category: "product",
  context: "New product experience",
  symbol: "AC",
  color: "teal",
  summary: "This project was added from the portfolio admin.",
  contribution: "Built and shipped the project.",
  focus: ["Project management"],
  stack: ["React"],
  learning: "Keep the portfolio current.",
};

afterEach(() => {
  delete global.fetch;
});

test("renders projects loaded from the published admin-managed project file", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: () => Promise.resolve([savedProject]),
  });

  render(<Projects />);

  const projectLink = await screen.findByRole("link", { name: /Admin-created case study/i });
  expect(projectLink).toHaveAttribute(
    "href",
    "/projects/admin-created-case-study",
  );
  const projectCard = await screen.findByRole("article", {
    name: "Admin-created case study project",
  });
  await waitFor(() => expect(projectCard).toHaveClass("is-visible"));
  expect(screen.getByText("This project was added from the portfolio admin.")).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith("/data/projects.json", { cache: "no-store" });
});
