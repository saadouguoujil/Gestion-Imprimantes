import { useState } from "react";

export default function Register({ goToLogin }) {
  const [form, setForm] = useState({
    nom: "", prenom: "", profession: "", email: "", pseudo: "", motDePasse: "", role: "user",
  });
  const [message, setMessage] = useState("");

  function update(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      setMessage(data.message);
    } catch (err) {
      setMessage("Erreur : impossible de contacter le serveur.");
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Créer un compte</h1>
        {message && <div className="message-success">{message}</div>}
        <form onSubmit={handleSubmit}>
          <label>Nom</label>
          <input value={form.nom} onChange={(e) => update("nom", e.target.value)} />
          <label>Prénom</label>
          <input value={form.prenom} onChange={(e) => update("prenom", e.target.value)} />
          <label>Profession</label>
          <input value={form.profession} onChange={(e) => update("profession", e.target.value)} />
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <label>Nom d'utilisateur</label>
          <input value={form.pseudo} onChange={(e) => update("pseudo", e.target.value)} required />
          <label>Mot de passe</label>
          <input
            type="password"
            value={form.motDePasse}
            onChange={(e) => update("motDePasse", e.target.value)}
            required
          />
          <label>Rôle</label>
          <select value={form.role} onChange={(e) => update("role", e.target.value)}>
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
          <button type="submit" style={{ width: "100%" }}>
            S'inscrire
          </button>
        </form>
        <div className="footer-links">
          <button className="btn-link" onClick={goToLogin}>
            Déjà un compte ? Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}