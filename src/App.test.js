import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./firebase", () => ({
  getFirebaseServices: jest.fn(),
  isFirebaseConfigured: false,
}));

test("renders the portfolio headline and sections", () => {
  render(<App />);

  expect(screen.getByRole("heading", { name: /Curiosity is my compass/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Field notes/i })).toHaveAttribute("href", "#expertise");
  expect(screen.getByText(/Move your pointer through the current/i)).toBeInTheDocument();
});

test("allows switching between light and dark themes", () => {
  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
  expect(document.querySelector(".portfolio-shell")).toHaveAttribute("data-theme", "dark");
  expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
});
