import { useEffect, useState } from "react";

export default function Dashboard({ onLogout }) {
  const [profil, setProfil] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    async function chargerProfil() {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("http://localhost:4000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          setErreur(data.message);
          return;
        }
        setProfil(data);
      } catch (err) {
        setErreur("Impossible de contacter le serveur.");
      }
    }
    chargerProfil();
  }, []); // [] = s'exécute une seule fois, au premier affichage

  function handleLogout() {
    localStorage.removeItem("token");
    onLogout();
  }

  if (erreur) return <p>{erreur}</p>;
  if (!profil) return <p>Chargement...</p>;

  return (
    <div style={{ maxWidth: 300, margin: "50px auto" }}>
      <h1>Bonjour {profil.pseudo} 👋</h1>
      <p>Votre identifiant : {profil.id}</p>
      <button onClick={handleLogout}>Se déconnecter</button>
    </div>
  );
}