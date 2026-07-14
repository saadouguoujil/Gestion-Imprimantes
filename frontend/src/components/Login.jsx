import { useState } from "react";

export default function Login() {
  const [pseudo, setPseudo] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault(); // empêche la page de se recharger

    try {
      const response = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo, motDePasse }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message); // ex: "Identifiants incorrects."
        return;
      }

      localStorage.setItem("token", data.token);
      setMessage("Connexion réussie !");
    } catch (err) {
      setMessage("Erreur : impossible de contacter le serveur.");
    }
  }

  return (
    <div style={{ maxWidth: 300, margin: "50px auto" }}>
      <h1>Connexion</h1>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nom d'utilisateur</label>
          <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} required />
        </div>
        <div>
          <label>Mot de passe</label>
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />
        </div>
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}