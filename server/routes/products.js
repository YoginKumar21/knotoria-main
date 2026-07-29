const express = require("express");
const db = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

async function resolveProductDetails(productDoc) {
  const p = productDoc.data();
  const id = productDoc.id;

  let category = p.category || "";
  let category_slug = p.category_slug || "";

  // If there is category_id and category is not set, resolve it
  if (!category && p.category_id) {
    const categoryDoc = await db.collection("categories").doc(p.category_id).get();
    if (categoryDoc.exists) {
      const catData = categoryDoc.data();
      category = catData.name;
      category_slug = catData.slug;
    }
  }

  const stock = 9999;
  const isActive = p.isActive !== undefined ? p.isActive : true;
  
  const imageUrls = p.imageUrls || [];
  const images = p.images || (p.image_url ? [p.image_url] : []);
  
  return {
    id,
    ...p,
    category,
    category_slug,
    stock,
    isActive,
    imageUrls,
    images,
    in_stock: true
  };
}

async function resolveProductsDetails(productDocs) {
  // Fetch all categories once to prevent N+1 queries
  const categoriesSnapshot = await db.collection("categories").get();
  const categoryMap = {};
  categoriesSnapshot.docs.forEach(doc => {
    categoryMap[doc.id] = doc.data();
  });

  return productDocs.map(doc => {
    const p = doc.data();
    const cat = categoryMap[p.category_id] || {};
    
    const category = p.category || cat.name || "";
    const category_slug = p.category_slug || cat.slug || "";
    const stock = 9999;
    const isActive = p.isActive !== undefined ? p.isActive : true;
    
    const imageUrls = p.imageUrls || [];
    const images = p.images || (p.image_url ? [p.image_url] : []);

    return {
      id: doc.id,
      ...p,
      category,
      category_slug,
      stock,
      isActive,
      imageUrls,
      images,
      in_stock: true
    };
  });
}

// GET /api/products - public, supports ?category=slug and ?inStockOnly=true
router.get("/", async (req, res) => {
  const { category, all } = req.query;

  try {
    let queryRef = db.collection("products");
    const snapshot = await queryRef.get();
    let products = await resolveProductsDetails(snapshot.docs);

    // Filter out inactive products unless all=true is specified
    if (all !== "true") {
      products = products.filter(p => p.isActive !== false);
    }

    // Filter by category slug or name
    if (category) {
      products = products.filter(p => 
        (p.category_slug && p.category_slug.toLowerCase() === category.toLowerCase()) ||
        (p.category && p.category.toLowerCase() === category.toLowerCase())
      );
    }

    products.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products: " + err.message });
  }
});

// GET /api/products/:id - public
router.get("/:id", async (req, res) => {
  try {
    const productDoc = await db.collection("products").doc(req.params.id).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: "Product not found." });
    }
    const resolved = await resolveProductDetails(productDoc);
    res.json(resolved);
  } catch (err) {
    res.status(404).json({ error: "Product not found." });
  }
});

// POST /api/products - admin only (add new item)
router.post("/", requireAuth, async (req, res) => {
  const { name, description, price, imageUrls, images, category, stock, sku, isActive } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: "Name, price, and category are required." });
  }

  try {
    const stockNum = Number.isFinite(Number(stock)) ? Number(stock) : 0;
    const active = isActive !== undefined ? Boolean(isActive) : true;

    const productRef = await db.collection("products").add({
      name,
      description: description || "",
      price: Number(price),
      category,
      stock: stockNum,
      sku: sku || "",
      isActive: active,
      imageUrls: imageUrls || [],
      images: images || [],
      hasVariants: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const doc = await productRef.get();
    const resolved = await resolveProductDetails(doc);
    res.status(201).json(resolved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/products/:id - admin only (edit fields)
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const productRef = db.collection("products").doc(id);
    const productDoc = await productRef.get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: "Product not found." });
    }

    const existing = productDoc.data();
    const {
      name = existing.name,
      description = existing.description,
      price = existing.price,
      category = existing.category,
      stock = existing.stock !== undefined ? existing.stock : (existing.stock_count !== undefined ? existing.stock_count : 0),
      sku = existing.sku,
      isActive = existing.isActive !== undefined ? existing.isActive : (existing.in_stock !== undefined ? existing.in_stock : true),
      imageUrls = existing.imageUrls,
      images = existing.images
    } = req.body;

    const updates = {
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      sku: sku || "",
      isActive: Boolean(isActive),
      imageUrls: imageUrls || [],
      images: images || [],
      updatedAt: new Date().toISOString()
    };

    await productRef.update(updates);

    const doc = await productRef.get();
    const resolved = await resolveProductDetails(doc);
    res.json(resolved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id - admin only (remove item)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const productRef = db.collection("products").doc(req.params.id);
    const doc = await productRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found." });
    }
    await productRef.delete();
    res.json({ message: "Product removed." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
