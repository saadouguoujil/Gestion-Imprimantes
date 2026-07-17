import { useEffect, useState } from "react";

export default function Admin({ onBack }) {
  const [users, setUsers] = useState([]);
  const [backups, setBackups] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  async function chargerDonnees() {
    try {
      const [resUsers, resBackups, resHistorique] = await Promise.all([
        fetch("http://localhost:4000/api/admin/users", { headers }),
        fetch("http://localhost:4000/api/admin/backups", { headers }),
        fetch("http://localhost:4000/api/historique", { headers }),
      ]);
      const dataUsers = await resUsers.json();
      const dataBackups = await resBackups.json();
      const dataHistorique = await resHistorique.json();

      if (!resUsers.ok) {
        setErreur(dataUsers.message);
        return;
      }
      setUsers(dataUsers);
      setBackups(dataBackups);
      setHistorique(dataHistorique);
    } catch (err) {
      setErreur("Impossible de contacter le serveur.");
    }
  }

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function supprimer(id) {
    await fetch(`http://localhost:4000/api/admin/users/${id}`, {
      method: "DELETE",
      headers,
    });
    chargerDonnees();
  }

  async function faireSauvegarde() {
    const response = await fetch("http://localhost:4000/api/admin/backup", {
      method: "POST",
      headers,
    });
    const data = await response.json();
    setMessage(data.message);
    chargerDonnees();
  }

  return (
    <div className="admin-page">
      <div className="topbar">
        <h2 style={{ margin: 0 }}>Espace Administrateur</h2>
        <button className="btn-secondary" onClick={onBack}>
          Retour au dashboard
        </button>
      </div>

      {erreur && <div className="message-error">{erreur}</div>}

      <div className="section-card">
        <h3>Utilisateurs</h3>
        <table>
          <thead>
            <tr>
              <th>Pseudo</th>
              <th>Rôle</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.pseudo}</td>
                <td>{u.role}</td>
                <td>
                  <button className="btn-danger" onClick={() => supprimer(u.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-card">
        <h3>Sauvegarde mensuelle des consommables</h3>
        {message && <div className="message-success">{message}</div>}
        <button onClick={faireSauvegarde}>Faire la sauvegarde mensuelle</button>

        <h4 style={{ marginTop: 20, marginBottom: 8, fontSize: 14 }}>Historique des sauvegardes</h4>
        {backups.length === 0 && <p style={{ color: "#9ca3af", fontSize: 14 }}>Aucune sauvegarde effectuée.</p>}
        {backups.map((b) => (
          <div key={b.id} className="history-item">
            <strong>{new Date(b.date).toLocaleString("fr-FR")}</strong> — Par {b.parQui} (
            {b.donnees.length} élément(s))
          </div>
        ))}
      </div>

      <div className="section-card">
        <h3>Historique des activités</h3>
        {historique.length === 0 && <p style={{ color: "#9ca3af", fontSize: 14 }}>Aucune activité enregistrée.</p>}
        {historique.map((h) => (
          <div key={h.id} className="history-item">
            <strong>{new Date(h.date_creation).toLocaleString("fr-FR")}</strong> — {h.texte}
          </div>
        ))}
      </div>
    </div>
  );
} 