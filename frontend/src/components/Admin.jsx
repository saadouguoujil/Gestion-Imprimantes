import { useEffect, useState } from "react";

export default function Admin({ onBack }) {
  const [users, setUsers] = useState([]);
  const [erreur, setErreur] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  async function chargerUsers() {
    try {
      const response = await fetch("http://localhost:4000/api/admin/users", { headers });
      const data = await response.json();
      if (!response.ok) {
        setErreur(data.message);
        return;
      }
      setUsers(data);
    } catch (err) {
      setErreur("Impossible de contacter le serveur.");
    }
  }

  useEffect(() => {
    chargerUsers();
  }, []);

  async function supprimer(id) {
    await fetch(`http://localhost:4000/api/admin/users/${id}`, {
      method: "DELETE",
      headers,
    });
    chargerUsers();
  }

  return (
    <div style={{ maxWidth: 500, margin: "50px auto" }}>
      <h1>Espace Administrateur</h1>
      {erreur && <p>{erreur}</p>}
      <button onClick={onBack}>Retour au dashboard</button>
      <table border="1" cellPadding="8" style={{ marginTop: 20, width: "100%" }}>
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
    </div>
  );
}