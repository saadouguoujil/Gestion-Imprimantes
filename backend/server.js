const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 4000;
const JWT_SECRET = "mon-secret-temporaire"; // à mettre dans .env plus tard

app.use(cors());
app.use(express.json());

// --- Tableaux temporaires en mémoire ---
const users = [];
const etatConsommable = [];
const alertes = [];
const messages = [];

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

  const dejaExiste = users.find((u) => u.pseudo === pseudo);
  if (dejaExiste) {
    return res.status(409).json({ message: "Ce pseudo existe déjà." });
  }

  const motDePasseHache = await bcrypt.hash(motDePasse, 10);
  const roleFinal = role === "admin" ? "admin" : "user"; // par défaut : user

  users.push({ id: Date.now(), pseudo, motDePasse: motDePasseHache, role: roleFinal });

  res.status(201).json({ message: "Compte créé avec succès.", role: roleFinal });
});

// --- Connexion ---
app.post("/api/login", async (req, res) => {
  const { pseudo, motDePasse } = req.body;

  const utilisateur = users.find((u) => u.pseudo === pseudo);
  if (!utilisateur) {
    return res.status(401).json({ message: "Identifiants incorrects." });
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
  if (!motDePasseValide) {
    return res.status(401).json({ message: "Identifiants incorrects." });
  }

  const token = jwt.sign(
    { id: utilisateur.id, pseudo: utilisateur.pseudo, role: utilisateur.role },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ message: "Connexion réussie.", token });
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
app.post("/api/etat-consommable", verifyToken, (req, res) => {
  const { composant, pourcentage } = req.body;

  const entree = { id: Date.now(), composant, pourcentage };
  etatConsommable.push(entree);

  if (pourcentage < 15) {
    alertes.push({
      id: Date.now() + 1,
      nom: `Niveau bas : ${composant}`,
      description: `Le composant "${composant}" est à ${pourcentage}%. Remplacement recommandé.`,
    });
  }

  res.status(201).json(entree);
});

// --- Statistiques ---
app.get("/api/statistiques", verifyToken, (req, res) => {
  const moyenne =
    etatConsommable.length > 0
      ? Math.round(
          etatConsommable.reduce((somme, e) => somme + e.pourcentage, 0) / etatConsommable.length
        )
      : 0;

  res.json({
    pourcentageEtatConsommable: moyenne,
    nombreAlertes: alertes.length,
  });
});

// --- Alertes ---
app.get("/api/alertes", verifyToken, (req, res) => {
  res.json(alertes);
});

// --- Formulaire de contact (visiteur, pas besoin de token) ---
app.post("/api/contact", (req, res) => {
  const { nom, email, sujet, contenu } = req.body;

  if (!nom || !email || !contenu) {
    return res.status(400).json({ message: "Nom, email et message sont requis." });
  }

  messages.push({ id: Date.now(), nom, email, sujet, contenu });
  res.status(201).json({ message: "Votre message a bien été envoyé. Merci !" });
});

// --- Admin : liste des utilisateurs ---
app.get("/api/admin/users", verifyToken, verifyAdmin, (req, res) => {
  const usersSansMdp = users.map(({ motDePasse, ...u }) => u);
  res.json(usersSansMdp);
});

// --- Admin : supprimer un utilisateur ---
app.delete("/api/admin/users/:id", verifyToken, verifyAdmin, (req, res) => {
  const idASupprimer = Number(req.params.id);
  const index = users.findIndex((u) => u.id === idASupprimer);

  if (index === -1) {
    return res.status(404).json({ message: "Utilisateur introuvable." });
  }

  users.splice(index, 1);
  res.json({ message: "Utilisateur supprimé." });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});