import { useState } from "react";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Contact from "./components/Contact.jsx";

function App() {
  const [page, setPage] = useState(
    localStorage.getItem("token") ? "dashboard" : "login"
  );

  if (page === "dashboard") {
    return <Dashboard onLogout={() => setPage("login")} />;
  }

  if (page === "contact") {
    return <Contact goToLogin={() => setPage("login")} />;
  }

  if (page === "register") {
    return <Register goToLogin={() => setPage("login")} />;
  }

  return (
  <Login
    onLoggedIn={() => setPage("dashboard")}
    goToRegister={() => setPage("register")}
    goToContact={() => setPage("contact")}
  />
);
}

export default App;