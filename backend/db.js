const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // XAMPP utilise "root" sans mot de passe par défaut
  database: "gestion_imprimantes",
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;