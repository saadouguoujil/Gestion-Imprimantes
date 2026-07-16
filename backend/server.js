const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();
const PORT = 4000;
const JWT_SECRET = "mon-secret-temporaire"; // à mettre dans .env plus tard

app.use(cors());
app.use(express.json());

// --- Fonction utilitaire pour journaliser une action ---
async function ajouterHistorique(texte) {
  try {
    await pool.query("INSERT INTO historique (texte) VALUES (?)", [texte]);
  } catch (err) {
    console.error("Erreur historique :", err);
  }
}

// --- Route de test ---
app.get("/api/test", (req, res) => {
  res.json({ ok: true });
});

// --- Inscription ---
app.post("/api/register", async (req, res) => {
  const { pseudo, motDePasse, role } = req.body;

  if (!pseudo || !motDePasse) {
    return res.status(400).json({ message: "Pseudo et mot de passe requis." });
  }

  try {
    const [existants] = await pool.query("SELECT id FROM users WHERE pseudo = ?", [pseudo]);
    if (existants.length > 0) {
      return res.status(409).json({ message: "Ce pseudo existe déjà." });
    }

    const motDePasseHache = await bcrypt.hash(motDePasse, 10);
    const roleFinal = role === "admin" ? "admin" : "user";

    await pool.query(
      "INSERT INTO users (pseudo, mot_de_passe, role) VALUES (?, ?, ?)",
      [pseudo, motDePasseHache, roleFinal]
    );

    await ajouterHistorique(`Nouveau compte créé : ${pseudo} (${roleFinal})`);
    res.status(201).json({ message: "Compte créé avec succès.", role: roleFinal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// --- Connexion ---
app.post("/api/login", async (req, res) => {
  const { pseudo, motDePasse } = req.body;

  try {
    const [lignes] = await pool.query("SELECT * FROM users WHERE pseudo = ?", [pseudo]);
    if (lignes.length === 0) {
      return res.status(401).json({ message: "Identifiants incorrects." });
    }

    const utilisateur = lignes[0];
    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      return res.status(401).json({ message: "Identifiants incorrects." });
    }

    const token = jwt.sign(
      { id: utilisateur.id, pseudo: utilisateur.pseudo, role: utilisateur.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    await ajouterHistorique(`Connexion : ${pseudo}`);
    res.json({ message: "Connexion réussie.", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// --- Middleware : vérifie le token JWT ---
function verifyToken(req, res, next) {
  const header = req.headers["authorization"];
  const token = header && header.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token manquant." });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ message: "Token invalide ou expiré." });
    }
    req.user = payload;
    next();
  });
}

// --- Middleware : vérifie que l'utilisateur est admin ---
function verifyAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Accès réservé à l'administrateur." });
  }
  next();
}

// --- Route protégée : profil ---
app.get("/api/profile", verifyToken, (req, res) => {
  res.json({ id: req.user.id, pseudo: req.user.pseudo, role: req.user.role });
});

// --- Import d'un état consommable + alerte automatique ---
app.post("/api/etat-consommable", verifyToken, async (req, res) => {
  const { composant, pourcentage } = req.body;

  try {
    const [resultat] = await pool.query(
      "INSERT INTO etat_consommable (composant, pourcentage) VALUES (?, ?)",
      [composant, pourcentage]
    );

    await ajouterHistorique(`${req.user.pseudo} a importé "${composant}" à ${pourcentage}%`);

    if (pourcentage < 15) {
      await pool.query(
        "INSERT INTO alertes (nom, description) VALUES (?, ?)",
        [
          `Niveau bas : ${composant}`,
          `Le composant "${composant}" est à ${pourcentage}%. Remplacement recommandé.`,
        ]
      );
    }

    res.status(201).json({ id: resultat.insertId, composant, pourcentage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// --- Import d'un état plateau ---
app.post("/api/etat-plateau", verifyToken, async (req, res) => {
  const { nom, etat, quantite, format, couleur } = req.body;

  try {
    const [resultat] = await pool.query(
      "INSERT INTO etat_plateau (nom, etat, quantite, format, couleur) VALUES (?, ?, ?, ?, ?)",
      [nom, etat, quantite, format, couleur]
    );
    await ajouterHistorique(`${req.user.pseudo} a importé l'état plateau "${nom}" (${quantite}%)`);
    res.status(201).json({ id: resultat.insertId, nom, etat, quantite, format, couleur });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// --- Import d'un état impression ---
app.post("/api/etat-impression", verifyToken, async (req, res) => {
  const { article, type, nbrPages, destination } = req.body;

  try {
    const [resultat] = await pool.query(
      "INSERT INTO etat_impression (article, type, nbr_pages, destination) VALUES (?, ?, ?, ?)",
      [article, type, nbrPages, destination]
    );
    await ajouterHistorique(`${req.user.pseudo} a importé une impression : "${article}" (${nbrPages} pages)`);
    res.status(201).json({ id: resultat.insertId, article, type, nbrPages, destination });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// --- Statistiques ---
app.get("/api/statistiques", verifyToken, async (req, res) => {
  try {
    const [[consoMoyenne]] = await pool.query(
      "SELECT ROUND(AVG(pourcentage)) AS moyenne FROM etat_consommable"
    );
    const [[plateauMoyenne]] = await pool.query(
      "SELECT ROUND(AVG(quantite)) AS moyenne FROM etat_plateau"
    );
    const [[impressionCount]] = await pool.query(
      "SELECT COUNT(*) AS total FROM etat_impression"
    );
    const [[alertesCount]] = await pool.query("SELECT COUNT(*) AS total FROM alertes");

    res.json({
      pourcentageEtatConsommable: consoMoyenne.moyenne || 0,
      pourcentageEtatPlateau: plateauMoyenne.moyenne || 0,
      nombreImpressions: impressionCount.total,
      nombreAlertes: alertesCount.total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// --- Alertes ---
app.get("/api/alertes", verifyToken, async (req, res) => {
  try {
    const [lignes] = await pool.query("SELECT * FROM alertes ORDER BY date_creation DESC");
    res.json(lignes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// --- Historique ---
app.get("/api/historique", verifyToken, async (req, res) => {
  try {
    const [lignes] = await pool.query("SELECT * FROM historique ORDER BY date_creation DESC");
    res.json(lignes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// --- Formulaire de contact ---
app.post("/api/contact", async (req, res) => {
  const { nom, email, sujet, contenu } = req.body;

  if (!nom || !email || !contenu) {
    return res.status(400).json({ message: "Nom, email et message sont requis." });
  }

  try {
    await pool.query(
      "INSERT INTO messages (nom, email, sujet, contenu) VALUES (?, ?, ?, ?)",
      [nom, email, sujet, contenu]
    );
    res.status(201).json({ message: "Votre message a bien été envoyé. Merci !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// --- Admin : liste des utilisateurs ---
app.get("/api/admin/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [lignes] = await pool.query("SELECT id, pseudo, role, date_creation FROM users");
    res.json(lignes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// --- Admin : supprimer un utilisateur ---
app.delete("/api/admin/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  const idASupprimer = req.params.id;

  try {
    const [lignes] = await pool.query("SELECT pseudo FROM users WHERE id = ?", [idASupprimer]);
    if (lignes.length === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    await pool.query("DELETE FROM users WHERE id = ?", [idASupprimer]);
    await ajouterHistorique(`Admin ${req.user.pseudo} a supprimé l'utilisateur : ${lignes[0].pseudo}`);

    res.json({ message: "Utilisateur supprimé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// --- Admin : sauvegarde mensuelle des consommables ---
app.post("/api/admin/backup", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [donnees] = await pool.query("SELECT * FROM etat_consommable");

    await pool.query(
      "INSERT INTO backups (par_qui, donnees) VALUES (?, ?)",
      [req.user.pseudo, JSON.stringify(donnees)]
    );

    await ajouterHistorique(
      `Sauvegarde mensuelle effectuée par ${req.user.pseudo} (${donnees.length} éléments)`
    );

    res.status(201).json({ message: "Sauvegarde effectuée avec succès." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// --- Admin : liste des sauvegardes ---
app.get("/api/admin/backups", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [lignes] = await pool.query("SELECT * FROM backups ORDER BY date_creation DESC");
    const resultat = lignes.map((b) => ({
      id: b.id,
      date: b.date_creation,
      parQui: b.par_qui,
      donnees: typeof b.donnees === "string" ? JSON.parse(b.donnees) : b.donnees,
    }));
    res.json(resultat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});