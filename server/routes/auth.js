const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/database");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    // Resolve email address (e.g., allow "admin" as shortcut for "admin@knotoria.com")
    const searchEmail = username.includes("@") ? username : `${username}@knotoria.com`;

    const snapshot = await db.collection("users").where("email", "==", searchEmail).limit(1).get();
    if (snapshot.empty) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Strict role check: Only "admin" can log in to admin console
    if (userData.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin portal is restricted to administrators." });
    }

    // Verify password hash (fallback if password_hash doesn't exist, e.g. for oauth users)
    if (!userData.password_hash) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }

    const valid = bcrypt.compareSync(password, userData.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }

    const token = jwt.sign({ id: userId, username: userData.email.split("@")[0] }, JWT_SECRET, {
      expiresIn: "12h",
    });

    res.json({ token, username: userData.email.split("@")[0] });
  } catch (err) {
    res.status(500).json({ error: "Authentication failed: " + err.message });
  }
});

module.exports = router;
