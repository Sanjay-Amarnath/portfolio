import "./App.css";
import Home from "./pages/home";
import Admin from "./pages/admin";
import '.././src/scss/_colors.scss'
import '.././src/scss/_mixins.scss'

function App() {
  const path = window.location.pathname.replace(/\/+$/, "");

  return path === "/admin" ? <Admin /> : <Home />;
}

export default App;
