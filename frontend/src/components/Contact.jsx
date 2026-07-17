import { useState } from "react";

export default function Contact({ goToLogin }) {
  const [form, setForm] = useState({ nom: "", email: "", sujet: "", contenu: "" });
  const [message, setMessage] = useState("");

  function update(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4000/api/contact", {
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
        <h1>Contactez-nous</h1>
        {message && <div className="message-success">{message}</div>}
        <form onSubmit={handleSubmit}>
          <label>Nom</label>
          <input value={form.nom} onChange={(e) => update("nom", e.target.value)} required />
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
          <label>Sujet</label>
          <input value={form.sujet} onChange={(e) => update("sujet", e.target.value)} />
          <label>Message</label>
          <textarea
            rows="4"
            value={form.contenu}
            onChange={(e) => update("contenu", e.target.value)}
            required
          />
          <button type="submit" style={{ width: "100%" }}>
            Envoyer
          </button>
        </form>
        <div className="footer-links">
          <button className="btn-link" onClick={goToLogin}>
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}