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
    <div>
      <Login onLoggedIn={() => setPage("dashboard")} />
      <div style={{ textAlign: "center" }}>
        <button onClick={() => setPage("contact")}>Nous contacter</button>
        <button onClick={() => setPage("register")}>Créer un compte</button>
      </div>
    </div>
  );
}

export default App;