import { useEffect, useState } from "react";

export default function Dashboard({ onLogout }) {
  const [profil, setProfil] = useState(null);
  const [stats, setStats] = useState(null);
  const [alertes, setAlertes] = useState([]);
  const [composant, setComposant] = useState("Toner Noir");
  const [pourcentage, setPourcentage] = useState(50);
  const [erreur, setErreur] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  async function chargerDonnees() {
    try {
      const [resProfil, resStats, resAlertes] = await Promise.all([
        fetch("http://localhost:4000/api/profile", { headers }),
        fetch("http://localhost:4000/api/statistiques", { headers }),
        fetch("http://localhost:4000/api/alertes", { headers }),
      ]);
      setProfil(await resProfil.json());
      setStats(await resStats.json());
      setAlertes(await resAlertes.json());
    } catch (err) {
      setErreur("Impossible de contacter le serveur.");
    }
  }

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function handleImport(e) {
    e.preventDefault();
    await fetch("http://localhost:4000/api/etat-consommable", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ composant, pourcentage: Number(pourcentage) }),
    });
    chargerDonnees(); // recharge les stats + alertes après l'import
  }

  function handleLogout() {
    localStorage.removeItem("token");
    onLogout();
  }

  if (erreur) return <p>{erreur}</p>;
  if (!profil || !stats) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h1>Bonjour {profil.pseudo} 👋</h1>
      <button onClick={handleLogout}>Se déconnecter</button>

      <h2>Statistiques</h2>
      <p>État consommable moyen : {stats.pourcentageEtatConsommable}%</p>
      <p>Nombre d'alertes : {stats.nombreAlertes}</p>

      <h2>Simuler un import</h2>
      <form onSubmit={handleImport}>
        <select value={composant} onChange={(e) => setComposant(e.target.value)}>
          <option>Toner Noir</option>
          <option>Toner Cyan</option>
          <option>Module Photorécepteur</option>
        </select>
        <input
          type="number"
          min="0"
          max="100"
          value={pourcentage}
          onChange={(e) => setPourcentage(e.target.value)}
        />
        <button type="submit">Importer</button>
      </form>
      <p style={{ fontSize: 12, color: "gray" }}>
        Astuce : mettez moins de 15% pour déclencher une alerte.
      </p>

      <h2>Alertes</h2>
      {alertes.length === 0 && <p>Aucune alerte.</p>}
      {alertes.map((a) => (
        <div key={a.id} style={{ border: "1px solid red", padding: 8, marginBottom: 8 }}>
          <strong>{a.nom}</strong>
          <p>{a.description}</p>
        </div>
      ))}
    </div>
  );
}