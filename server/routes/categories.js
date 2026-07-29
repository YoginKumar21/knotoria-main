const express = require("express");
const db = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/categories - public
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("categories").orderBy("name").get();
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories: " + err.message });
  }
});

// POST /api/categories - admin only
router.post("/", requireAuth, async (req, res) => {
  const { name, slug, description, image_url } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ error: "Name and slug are required." });
  }
  try {
    // Check if slug is unique
    const existing = await db.collection("categories").where("slug", "==", slug).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ error: "A category with that slug already exists." });
    }

    const categoryRef = await db.collection("categories").add({
      name,
      slug,
      description: description || "",
      image_url: image_url || ""
    });

    const doc = await categoryRef.get();
    res.status(201).json({
      id: doc.id,
      ...doc.data()
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/categories/:id - admin only
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const categoryRef = db.collection("categories").doc(id);
    const categoryDoc = await categoryRef.get();
    if (!categoryDoc.exists) {
      return res.status(404).json({ error: "Category not found." });
    }

    // Delete category
    await categoryRef.delete();

    // Cascade delete associated products (SQL CASCADE equivalent)
    const productsSnapshot = await db.collection("products").where("category_id", "==", id).get();
    if (!productsSnapshot.empty) {
      const batch = db.batch();
      productsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Cascaded deletion: removed ${productsSnapshot.size} products.`);
    }

    res.json({ message: "Category deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete category: " + err.message });
  }
});

module.exports = router;
