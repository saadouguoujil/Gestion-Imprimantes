import { useState } from "react";

export default function Login({ onLoggedIn, goToRegister, goToContact }) {
  const [pseudo, setPseudo] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo, motDePasse }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message);
        return;
      }
      localStorage.setItem("token", data.token);
      onLoggedIn();
    } catch (err) {
      setMessage("Erreur : impossible de contacter le serveur.");
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Connexion</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: -8 }}>Gestion des Imprimantes</p>
        {message && <div className="message-error">{message}</div>}
        <form onSubmit={handleSubmit}>
          <label>Nom d'utilisateur</label>
          <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} required />
          <label>Mot de passe</label>
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />
          <button type="submit" style={{ width: "100%" }}>
            Se connecter
          </button>
        </form>
        <div className="footer-links">
          <button className="btn-link" onClick={goToRegister}>
            Créer un compte
          </button>
          {" · "}
          <button className="btn-link" onClick={goToContact}>
            Nous contacter
          </button>
        </div>
      </div>
    </div>
  );
}