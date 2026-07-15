import { useEffect, useState } from "react";
import Admin from "./Admin.jsx";

export default function Dashboard({ onLogout }) {
  const [profil, setProfil] = useState(null);
  const [stats, setStats] = useState(null);
  const [alertes, setAlertes] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [erreur, setErreur] = useState("");
  const [pageAdmin, setPageAdmin] = useState(false);

  // Import consommable
  const [composant, setComposant] = useState("Toner Noir");
  const [pourcentage, setPourcentage] = useState(50);

  // Import plateau
  const [plateauNom, setPlateauNom] = useState("Bac 1");
  const [plateauQuantite, setPlateauQuantite] = useState(80);

  // Import impression
  const [impressionArticle, setImpressionArticle] = useState("Document A");
  const [impressionPages, setImpressionPages] = useState(5);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  async function chargerDonnees() {
    try {
      const [resProfil, resStats, resAlertes, resHistorique] = await Promise.all([
        fetch("http://localhost:4000/api/profile", { headers }),
        fetch("http://localhost:4000/api/statistiques", { headers }),
        fetch("http://localhost:4000/api/alertes", { headers }),
        fetch("http://localhost:4000/api/historique", { headers }),
      ]);
      setProfil(await resProfil.json());
      setStats(await resStats.json());
      setAlertes(await resAlertes.json());
      setHistorique(await resHistorique.json());
    } catch (err) {
      setErreur("Impossible de contacter le serveur.");
    }
  }

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function handleImportConsommable(e) {
    e.preventDefault();
    await fetch("http://localhost:4000/api/etat-consommable", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ composant, pourcentage: Number(pourcentage) }),
    });
    chargerDonnees();
  }

  async function handleImportPlateau(e) {
    e.preventDefault();
    await fetch("http://localhost:4000/api/etat-plateau", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        nom: plateauNom,
        etat: "OK",
        quantite: Number(plateauQuantite),
        format: "A4",
        couleur: "Blanc",
      }),
    });
    chargerDonnees();
  }

  async function handleImportImpression(e) {
    e.preventDefault();
    await fetch("http://localhost:4000/api/etat-impression", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        article: impressionArticle,
        type: "Document",
        nbrPages: Number(impressionPages),
        destination: "Bac de sortie",
      }),
    });
    chargerDonnees();
  }

  function handleLogout() {
    localStorage.removeItem("token");
    onLogout();
  }

  if (pageAdmin) {
    return <Admin onBack={() => setPageAdmin(false)} />;
  }

  if (erreur) return <p>{erreur}</p>;
  if (!profil || !stats) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: 420, margin: "50px auto" }}>
      <h1>Bonjour {profil.pseudo} 👋</h1>
      <p style={{ fontSize: 12, color: "gray" }}>Rôle : {profil.role}</p>

      <button onClick={handleLogout}>Se déconnecter</button>
      {profil.role === "admin" && (
        <button onClick={() => setPageAdmin(true)} style={{ marginLeft: 8 }}>
          Espace Administrateur
        </button>
      )}

      <h2>Statistiques</h2>
      <p>État consommable moyen : {stats.pourcentageEtatConsommable}%</p>
      <p>État plateau moyen : {stats.pourcentageEtatPlateau}%</p>
      <p>Nombre d'impressions : {stats.nombreImpressions}</p>
      <p>Nombre d'alertes : {stats.nombreAlertes}</p>

      <h2>Simuler un import — État Consommable</h2>
      <form onSubmit={handleImportConsommable}>
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

      <h2>Simuler un import — État Plateau</h2>
      <form onSubmit={handleImportPlateau}>
        <input value={plateauNom} onChange={(e) => setPlateauNom(e.target.value)} />
        <input
          type="number"
          min="0"
          max="100"
          value={plateauQuantite}
          onChange={(e) => setPlateauQuantite(e.target.value)}
        />
        <button type="submit">Importer</button>
      </form>

      <h2>Simuler un import — État Impression</h2>
      <form onSubmit={handleImportImpression}>
        <input
          value={impressionArticle}
          onChange={(e) => setImpressionArticle(e.target.value)}
        />
        <input
          type="number"
          min="1"
          value={impressionPages}
          onChange={(e) => setImpressionPages(e.target.value)}
        />
        <button type="submit">Importer</button>
      </form>

      <h2>Alertes</h2>
      {alertes.length === 0 && <p>Aucune alerte.</p>}
      {alertes.map((a) => (
        <div key={a.id} style={{ border: "1px solid red", padding: 8, marginBottom: 8 }}>
          <strong>{a.nom}</strong>
          <p>{a.description}</p>
        </div>
      ))}

      <h2>Historique des activités</h2>
      {historique.length === 0 && <p>Aucune activité enregistrée.</p>}
      {historique.map((h) => (
        <div
          key={h.id}
          style={{ fontSize: 13, borderBottom: "1px solid #eee", padding: "4px 0" }}
        >
          <strong>{new Date(h.date).toLocaleString("fr-FR")}</strong> — {h.texte}
        </div>
      ))}
    </div>
  );
}