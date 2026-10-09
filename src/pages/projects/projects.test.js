import { render, screen } from "@testing-library/react";
import { ProjectDetail, ProjectsIndex } from "./index";

test("lists commerce, SaaS, and Resume Lab projects with separate case-study paths", () => {
  render(<ProjectsIndex />);

  expect(screen.getByRole("link", { name: /Reltime Admin/i })).toHaveAttribute(
    "href",
    "/projects/reltime-admin",
  );
  expect(screen.getByRole("link", { name: /Make My Slot/i })).toHaveAttribute(
    "href",
    "/projects/make-my-slot",
  );
  expect(screen.getByRole("link", { name: /View Resume Lab case study/i })).toHaveAttribute(
    "href",
    "/projects/resume-lab",
  );
  expect(screen.getByText("Booking · Commerce")).toBeInTheDocument();
  expect(screen.getAllByText("Fintech · SaaS")).toHaveLength(2);
});

test("renders an individual project story and links Resume Lab to the builder", () => {
  render(<ProjectDetail slug="resume-lab" />);

  expect(screen.getByRole("heading", { name: /Resume Lab/ })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "My contribution" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Open the live Resume Lab/i })).toHaveAttribute(
    "href",
    "/resume",
  );
});

test("provides a useful fallback for an unknown project route", () => {
  render(<ProjectDetail slug="missing-project" />);

  expect(screen.getByRole("heading", { name: /This project is off the chart/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Browse all projects/i })).toHaveAttribute(
    "href",
    "/projects",
  );
});
