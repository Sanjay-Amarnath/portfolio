import "./App.css";
import Home from "./pages/home";
import Admin from "./pages/admin";
import ResumeBuilder from "./pages/resume-builder";
import ProjectsPage from "./pages/projects";
import ".././src/scss/_colors.scss";
import ".././src/scss/_mixins.scss";
import { Analytics } from "@vercel/analytics/next";

function App() {
  const path = window.location.pathname.replace(/\/+$/, "");

  if (path === "/admin") return <Admin />;
  if (path === "/resume") return <ResumeBuilder />;
  if (path === "/projects" || path.startsWith("/projects/"))
    return <ProjectsPage />;
  return (
    <>
      <Analytics />
      <Home />
    </>
  );
}

export default App;
