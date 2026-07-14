import { useState } from "react";
import Login from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";

function App() {
  const [estConnecte, setEstConnecte] = useState(!!localStorage.getItem("token"));

  if (estConnecte) {
    return <Dashboard onLogout={() => setEstConnecte(false)} />;
  }

  return <Login onLoggedIn={() => setEstConnecte(true)} />;
}

export default App;