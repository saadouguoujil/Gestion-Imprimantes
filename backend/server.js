const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 4000;
const JWT_SECRET = "mon-secret-temporaire"; // à mettre dans .env plus tard

app.use(cors());
app.use(express.json());

// Tableau temporaire en mémoire (remplacé par une vraie BDD plus tard)
const users = [];

// --- Route de test ---
app.get("/api/test", (req, res) => {
  res.json({ ok: true });
});

// --- Inscription ---
app.post("/api/register", async (req, res) => {
  const { pseudo, motDePasse } = req.body;

  if (!pseudo || !motDePasse) {
    return res.status(400).json({ message: "Pseudo et mot de passe requis." });
  }

  const dejaExiste = users.find((u) => u.pseudo === pseudo);
  if (dejaExiste) {
    return res.status(409).json({ message: "Ce pseudo existe déjà." });
  }

  const motDePasseHache = await bcrypt.hash(motDePasse, 10);
  users.push({ id: Date.now(), pseudo, motDePasse: motDePasseHache });

  res.status(201).json({ message: "Compte créé avec succès." });
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

  const token = jwt.sign({ id: utilisateur.id, pseudo: utilisateur.pseudo }, JWT_SECRET, {
    expiresIn: "2h",
  });

  res.json({ message: "Connexion réussie.", token });
});

// --- Middleware : vérifie le token JWT ---
function verifyToken(req, res, next) {
  const header = req.headers["authorization"];
  const token = header && header.split(" ")[1]; // "Bearer xxxxx" -> on garde xxxxx

  if (!token) {
    return res.status(401).json({ message: "Token manquant." });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ message: "Token invalide ou expiré." });
    }
    req.user = payload; // { id, pseudo, iat, exp }
    next();
  });
}

// --- Route protégée : profil ---
app.get("/api/profile", verifyToken, (req, res) => {
  res.json({ id: req.user.id, pseudo: req.user.pseudo });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});