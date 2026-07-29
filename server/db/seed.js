const db = require("./database");

const categories = [
  {
    name: "Crochet Plushies",
    slug: "plushies",
    description: "Adorable handmade toys for kids and collectors",
    image_url:
      "https://images.unsplash.com/photo-1612538498456-e861df91d4d0?w=800&q=80",
  },
  {
    name: "Cozy Accessories",
    slug: "accessories",
    description: "Hats, scarves, bags & more, stitched with care",
    image_url:
      "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&q=80",
  },
  {
    name: "Home Decor",
    slug: "home-decor",
    description: "Blankets, baskets, coasters & cozy touches for your space",
    image_url:
      "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&q=80",
  },
];

const products = [
  {
    name: "Foxy the Fox Amigurumi",
    description: "A bushy-tailed little fox, hand-stitched in soft cotton yarn.",
    price: 799,
    image_url: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80",
    category_slug: "plushies",
    stock_count: 12,
  },
  {
    name: "Bumble the Bee Buddy",
    description: "A plump, huggable bee with embroidered wings.",
    price: 649,
    image_url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80",
    category_slug: "plushies",
    stock_count: 9,
  },
  {
    name: "Bramble the Bunny",
    description: "Long-eared bunny in oatmeal yarn with a stitched-on bow.",
    price: 729,
    image_url: "https://images.unsplash.com/photo-1591561582301-7ce6588cc286?w=600&q=80",
    category_slug: "plushies",
    stock_count: 0,
  },
  {
    name: "Chunky Knit Beanie",
    description: "Thick, warm beanie in a rib-stitch pattern. One size fits most.",
    price: 549,
    image_url: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&q=80",
    category_slug: "accessories",
    stock_count: 20,
  },
  {
    name: "Scalloped Edge Scarf",
    description: "A long scarf with a delicate scalloped border, in dusty rose.",
    price: 899,
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
    category_slug: "accessories",
    stock_count: 7,
  },
  {
    name: "Market Tote Bag",
    description: "Sturdy cotton-cord tote, perfect for groceries or yarn runs.",
    price: 999,
    image_url: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80",
    category_slug: "accessories",
    stock_count: 5,
  },
  {
    name: "Granny Square Throw Blanket",
    description: "Classic granny-square blanket in warm sunset tones.",
    price: 2499,
    image_url: "https://images.unsplash.com/photo-1612544409782-ff5cb4486dd6?w=600&q=80",
    category_slug: "home-decor",
    stock_count: 4,
  },
  {
    name: "Woven Storage Basket",
    description: "Sturdy crocheted basket for yarn, toys, or odds and ends.",
    price: 1099,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80",
    category_slug: "home-decor",
    stock_count: 0,
  },
  {
    name: "Set of 4 Coasters",
    description: "Pastel cotton coasters, stitched flat for a smooth finish.",
    price: 399,
    image_url: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80",
    category_slug: "home-decor",
    stock_count: 15,
  },
];

async function seed() {
  console.log("Beginning Firestore database seed...");

  try {
    // Insert categories
    const categoryRefMap = {};
    for (const c of categories) {
      const existing = await db.collection("categories").where("slug", "==", c.slug).limit(1).get();
      let catId;
      if (existing.empty) {
        const ref = await db.collection("categories").add({
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          image_url: c.image_url || ""
        });
        catId = ref.id;
        console.log(`Seeded category: ${c.name} (${catId})`);
      } else {
        catId = existing.docs[0].id;
        console.log(`Category exists: ${c.name} (${catId})`);
      }
      categoryRefMap[c.slug] = catId;
    }

    // Check if products exist
    const productsSnapshot = await db.collection("products").limit(1).get();
    if (!productsSnapshot.empty) {
      console.log("Products already exist in Firestore, skipping product seed.");
      process.exit(0);
    }

    // Insert products
    for (const p of products) {
      const catId = categoryRefMap[p.category_slug];
      if (!catId) continue;

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
      console.log(`Seeded product: ${p.name}`);
    }

    console.log("Seed complete: categories + products inserted successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
}

// Wait briefly for default admin check before seeding
setTimeout(seed, 1500);
