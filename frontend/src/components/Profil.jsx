import { useEffect, useState } from "react";

export default function Profil({ onBack, onCompteSupprime }) {
  const [profil, setProfil] = useState(null);
  const [form, setForm] = useState({ nom: "", prenom: "", profession: "", email: "" });
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  async function chargerProfil() {
    try {
      const response = await fetch("http://localhost:4000/api/profile", { headers });
      const data = await response.json();
      if (!response.ok) {
        setErreur(data.message);
        return;
      }
      setProfil(data);
      setForm({
        nom: data.nom || "",
        prenom: data.prenom || "",
        profession: data.profession || "",
        email: data.email || "",
      });
    } catch (err) {
      setErreur("Impossible de contacter le serveur.");
    }
  }

  useEffect(() => {
    chargerProfil();
  }, []);

  function update(champ, valeur) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const response = await fetch("http://localhost:4000/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setMessage(data.message);
    chargerProfil();
  }

  async function handleSupprimer() {
    const confirmation = window.confirm(
      "Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible."
    );
    if (!confirmation) return;

    await fetch("http://localhost:4000/api/profile", { method: "DELETE", headers });
    localStorage.removeItem("token");
    onCompteSupprime();
  }

  if (erreur) return <p className="container">{erreur}</p>;
  if (!profil) return <p className="container">Chargement...</p>;

  return (
    <div className="dashboard">
      <div className="topbar">
        <h2 style={{ margin: 0 }}>Mon Profil</h2>
        <button className="btn-secondary" onClick={onBack}>
          Retour au dashboard
        </button>
      </div>

      <div className="section-card">
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          Nom d'utilisateur : <strong>{profil.pseudo}</strong> ({profil.role})
        </p>

        {message && <div className="message-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <label>Nom</label>
          <input value={form.nom} onChange={(e) => update("nom", e.target.value)} />
          <label>Prénom</label>
          <input value={form.prenom} onChange={(e) => update("prenom", e.target.value)} />
          <label>Profession</label>
          <input value={form.profession} onChange={(e) => update("profession", e.target.value)} />
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <button type="submit">Enregistrer les modifications</button>
        </form>
      </div>

      <div className="section-card">
        <h3 style={{ color: "#dc2626" }}>Zone dangereuse</h3>
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          La suppression de votre compte est définitive et irréversible.
        </p>
        <button className="btn-danger" onClick={handleSupprimer}>
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}