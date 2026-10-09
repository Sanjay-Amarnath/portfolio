import { render, screen } from "@testing-library/react";
import ResumeDocument from "./ResumeDocument";

test("renders populated resume sections separately and omits empty sections", () => {
  render(
    <ResumeDocument
      resume={{
        personal: {
          name: "Sanjay Amarnath.S",
          title: "Software Engineer",
          email: "sanjay@example.com",
        },
        summary: "Frontend engineer focused on React applications.",
        skills: {
          programming: ["JavaScript", "TypeScript"],
          frameworks: ["React"],
        },
        experience: [{
          company: "Colan Infotech",
          role: "React Developer",
          location: "",
          startDate: "2021",
          endDate: "",
          current: true,
          bullets: ["Built reusable React interfaces."],
        }],
        projects: [],
        education: [],
        achievements: [],
        certifications: [],
        languages: [],
      }}
    />,
  );

  expect(screen.getByRole("heading", { name: "Sanjay Amarnath.S" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Professional Profile" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Technical Expertise" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Career History" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Project Details" })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Education" })).not.toBeInTheDocument();
  expect(screen.getByText("Built reusable React interfaces.")).toBeInTheDocument();
});
