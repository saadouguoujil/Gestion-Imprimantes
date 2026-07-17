import { useEffect, useState } from "react";
import Admin from "./Admin.jsx";
import Profil from "./Profil.jsx";

export default function Dashboard({ onLogout }) {
  const [profil, setProfil] = useState(null);
  const [stats, setStats] = useState(null);
  const [alertes, setAlertes] = useState([]);
  const [erreur, setErreur] = useState("");
  const [pageAdmin, setPageAdmin] = useState(false);
  const [pageProfil, setPageProfil] = useState(false);
  const [composant, setComposant] = useState("Toner Noir");
  const [pourcentage, setPourcentage] = useState(50);
  const [plateauNom, setPlateauNom] = useState("Bac 1");
  const [plateauQuantite, setPlateauQuantite] = useState(80);
  const [impressionArticle, setImpressionArticle] = useState("Document A");
  const [impressionPages, setImpressionPages] = useState(5);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  async function chargerDonnees() {
    try {
      const resProfil = await fetch("http://localhost:4000/api/profile", { headers });
      if (!resProfil.ok) {
        localStorage.removeItem("token");
        onLogout();
        return;
      }
      const [resStats, resAlertes] = await Promise.all([
        fetch("http://localhost:4000/api/statistiques", { headers }),
        fetch("http://localhost:4000/api/alertes", { headers }),
      ]);
      setProfil(await resProfil.json());
      setStats(await resStats.json());
      setAlertes(resAlertes.ok ? await resAlertes.json() : []);
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

  if (pageProfil) {
  return (
    <Profil
      onBack={() => setPageProfil(false)}
      onCompteSupprime={onLogout}
    />
  );
}

  if (pageAdmin) {
    return <Admin onBack={() => setPageAdmin(false)} />;
  }

  if (erreur) return <p className="container">{erreur}</p>;
  if (!profil || !stats) return <p className="container">Chargement...</p>;

  return (
    <div className="dashboard">
      <div className="topbar">
        <div>
          <h2 style={{ margin: 0 }}>Bonjour {profil.pseudo} 👋</h2>
          <span className="role-tag">Rôle : {profil.role}</span>
        </div>
        <div>
          <button className="btn-secondary" onClick={() => setPageProfil(true)} style={{ marginRight: 8 }}>
             Mon Profil
          </button>
          {profil.role === "admin" && (
            <button className="btn-secondary" onClick={() => setPageAdmin(true)} style={{ marginRight: 8 }}>
              Espace Admin
            </button>
          )}
          <button className="btn-danger" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="stat-card">
          <div className="value">{stats.pourcentageEtatConsommable}%</div>
          <div className="label">État Consommable</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.pourcentageEtatPlateau}%</div>
          <div className="label">État Plateau</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.nombreImpressions}</div>
          <div className="label">Impressions</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.nombreAlertes}</div>
          <div className="label">Alertes</div>
        </div>
      </div>

      <div className="section-card">
        <h3>Importer — État Consommable</h3>
        <form onSubmit={handleImportConsommable} className="inline-form">
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
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
          Astuce : moins de 15% déclenche une alerte.
        </p>
      </div>

      <div className="section-card">
        <h3>Importer — État Plateau</h3>
        <form onSubmit={handleImportPlateau} className="inline-form">
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
      </div>

      <div className="section-card">
        <h3>Importer — État Impression</h3>
        <form onSubmit={handleImportImpression} className="inline-form">
          <input value={impressionArticle} onChange={(e) => setImpressionArticle(e.target.value)} />
          <input
            type="number"
            min="1"
            value={impressionPages}
            onChange={(e) => setImpressionPages(e.target.value)}
          />
          <button type="submit">Importer</button>
        </form>
      </div>

      <div className="section-card">
        <h3>Alertes</h3>
        {alertes.length === 0 && <p style={{ color: "#9ca3af" }}>Aucune alerte.</p>}
        {alertes.map((a) => (
          <div className="alert-item" key={a.id}>
            <div className="title">{a.nom}</div>
            <div className="desc">{a.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}