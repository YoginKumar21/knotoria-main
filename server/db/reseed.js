const db = require("./database");

const categories = [
  {
    name: "Plump Plushies",
    slug: "plump-plushies",
    description: "Huggable, soft crochet plush companions",
    image_url: "https://images.unsplash.com/photo-1612538498456-e861df91d4d0?w=800&q=80"
  },
  {
    name: "Forever Bouquets",
    slug: "forever-bouquets",
    description: "Everlasting, hand-knit flower arrangements",
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80"
  },
  {
    name: "Carry-All Totes",
    slug: "carry-all-totes",
    description: "Spacious and sturdy hand-woven shoulder bags",
    image_url: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80"
  },
  {
    name: "Go-Anywhere Slings",
    slug: "go-anywhere-slings",
    description: "Compact cross-body knit bags for everyday travel",
    image_url: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&q=80"
  },
  {
    name: "Cloud-Soft Scarves",
    slug: "cloud-soft-scarves",
    description: "Warm and cozy hand-stitched mufflers and scarves",
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80"
  },
  {
    name: "Boho Hair Bandanas",
    slug: "boho-hair-bandanas",
    description: "Vintage-style crochet hair kerchiefs and bandanas",
    image_url: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&q=80"
  },
  {
    name: "Dainty Clips & Bows",
    slug: "dainty-clips-bows",
    description: "Delicate crochet hairpins, clips, and ribbon bows",
    image_url: "https://images.unsplash.com/photo-1591561582301-7ce6588cc286?w=800&q=80"
  },
  {
    name: "Everyday Charm Keychains",
    slug: "everyday-charm-keychains",
    description: "Cute mini crochet charms for your keys and bags",
    image_url: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800&q=80"
  }
];

const products = [
  {
    name: "Chubby Crochet Penguin",
    description: "A super round, squishable penguin amigurumi hand-stitched in soft blue yarn.",
    price: 699,
    image_url: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80",
    category_slug: "plump-plushies",
    stock_count: 8
  },
  {
    name: "Sleepy Panda Amigurumi",
    description: "A cute panda plushie lying down, ready to accompany your desk or bed.",
    price: 799,
    image_url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80",
    category_slug: "plump-plushies",
    stock_count: 5
  },
  {
    name: "Hand-Knit Rose Bouquet",
    description: "Three detailed red roses in a decorative kraft wrap. Never fades.",
    price: 1299,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80",
    category_slug: "forever-bouquets",
    stock_count: 4
  },
  {
    name: "Sun-Kissed Daisy Bunch",
    description: "Bright yellow and white crochet daisies to light up any room.",
    price: 999,
    image_url: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&q=80",
    category_slug: "forever-bouquets",
    stock_count: 6
  },
  {
    name: "Bohemian Granny Square Tote",
    description: "Sturdy carry-all shoulder tote with colorful retro granny square designs.",
    price: 1499,
    image_url: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80",
    category_slug: "carry-all-totes",
    stock_count: 3
  },
  {
    name: "Pastel Chevron Sling Bag",
    description: "A compact cross-body bag with a secure button strap and pastel zig-zag stitches.",
    price: 899,
    image_url: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&q=80",
    category_slug: "go-anywhere-slings",
    stock_count: 5
  },
  {
    name: "Chunky Cable-Knit Muffler",
    description: "Thick, cloud-soft neck warmer in natural cream cotton blend.",
    price: 799,
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
    category_slug: "cloud-soft-scarves",
    stock_count: 10
  },
  {
    name: "Daisy Chain Hair Kerchief",
    description: "A vintage-style tie-back hair bandana with woven daisy motifs.",
    price: 449,
    image_url: "https://images.unsplash.com/photo-1591561582301-7ce6588cc286?w=600&q=80",
    category_slug: "boho-hair-bandanas",
    stock_count: 12
  },
  {
    name: "Set of 3 Velvet Ribbon Bows",
    description: "Delicate hand-tied ribbon clips in forest green, crimson, and oat.",
    price: 349,
    image_url: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80",
    category_slug: "dainty-clips-bows",
    stock_count: 15
  },
  {
    name: "Mini Crochet Avocado Charm",
    description: "A tiny avocado keychain with a smiling seed pit center.",
    price: 249,
    image_url: "https://images.unsplash.com/photo-1612538498456-e861df91d4d0?w=600&q=80",
    category_slug: "everyday-charm-keychains",
    stock_count: 20
  }
];

async function deleteCollection(collectionPath) {
  const snapshot = await db.collection(collectionPath).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Deleted all documents in collection: ${collectionPath}`);
}

async function reseed() {
  console.log("Beginning Firestore database re-seed...");

  try {
    // Clear collections
    await deleteCollection("order_items");
    await deleteCollection("orders");
    await deleteCollection("products");
    await deleteCollection("categories");

    console.log("Cleared old orders, products, and categories.");

    // Insert categories
    const categoryRefMap = {};
    for (const c of categories) {
      const ref = await db.collection("categories").add({
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image_url: c.image_url || ""
      });
      categoryRefMap[c.slug] = ref.id;
      console.log(`Inserted category: ${c.name} (${ref.id})`);
    }

    // Insert products
    for (const p of products) {
      const catId = categoryRefMap[p.category_slug];
      if (!catId) {
        console.warn(`Category slug "${p.category_slug}" not found for product "${p.name}"!`);
        continue;
      }
      await db.collection("products").add({
        name: p.name,
        description: p.description,
        price: p.price,
        image_url: p.image_url,
        category_id: catId,
        in_stock: p.stock_count > 0,
        stock_count: p.stock_count,
        created_at: new Date().toISOString()
      });
      console.log(`Inserted product: ${p.name}`);
    }

    console.log("Reseed sequence completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Reseeding failed:", err.message);
    process.exit(1);
  }
}

// Wait briefly for default admin check before reseeding
setTimeout(reseed, 1500);
