import { useEffect, useState } from "react";

export default function Admin({ onBack }) {
  const [users, setUsers] = useState([]);
  const [backups, setBackups] = useState([]);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  async function chargerDonnees() {
    try {
      const [resUsers, resBackups] = await Promise.all([
        fetch("http://localhost:4000/api/admin/users", { headers }),
        fetch("http://localhost:4000/api/admin/backups", { headers }),
      ]);
      const dataUsers = await resUsers.json();
      const dataBackups = await resBackups.json();

      if (!resUsers.ok) {
        setErreur(dataUsers.message);
        return;
      }
      setUsers(dataUsers);
      setBackups(dataBackups);
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
    <div style={{ maxWidth: 500, margin: "50px auto" }}>
      <h1>Espace Administrateur</h1>
      {erreur && <p>{erreur}</p>}
      <button onClick={onBack}>Retour au dashboard</button>

      <h2>Utilisateurs</h2>
      <table border="1" cellPadding="8" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Pseudo</th>
            <th>Rôle</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.pseudo}</td>
              <td>{u.role}</td>
              <td>
                <button onClick={() => supprimer(u.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Sauvegarde mensuelle des consommables</h2>
      {message && <p>{message}</p>}
      <button onClick={faireSauvegarde}>Faire la sauvegarde mensuelle</button>

      <h3>Historique des sauvegardes</h3>
      {backups.length === 0 && <p>Aucune sauvegarde effectuée.</p>}
      {backups.map((b) => (
        <div key={b.id} style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}>
          <strong>{new Date(b.date).toLocaleString("fr-FR")}</strong>
          <p>Par : {b.parQui} — {b.donnees.length} élément(s) sauvegardé(s)</p>
        </div>
      ))}
    </div>
  );
}