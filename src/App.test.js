import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./firebase", () => ({
  getFirebaseServices: jest.fn(),
  isFirebaseConfigured: false,
  RESUME_STORAGE_PATH: "resumes/current.pdf",
}));

test("renders the portfolio headline and sections", () => {
  render(<App />);

  expect(screen.getByRole("heading", { name: /I build digital experiences\./i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Expertise" })).toHaveAttribute("href", "#expertise");
  expect(screen.getByRole("heading", { name: /good work happens/i })).toBeInTheDocument();
});

test("allows switching between light and dark themes", () => {
  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
  expect(document.querySelector(".portfolio-shell")).toHaveAttribute("data-theme", "dark");
  expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
});
