import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import InfiniteMenu from "../components/InfiniteMenu.jsx";
import CategoryCard from "../components/CategoryCard.jsx";
import StitchDivider from "../components/StitchDivider.jsx";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { totalItems } = useCart();

  useEffect(() => {
    // Fetch categories and products in parallel
    Promise.all([
      api.getCategories(),
      api.getProducts()
    ])
      .then(([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getProductImage = (product) => {
    let displayImage = "";
    if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
      displayImage = typeof product.imageUrls[0] === "string" 
        ? product.imageUrls[0] 
        : product.imageUrls[0]?.url;
    } else if (Array.isArray(product.images) && product.images.length > 0) {
      displayImage = product.images[0];
    } else {
      displayImage = product.image_url;
    }
    return displayImage || "/yarn-icon.svg";
  };

  const tagsPool = [
    "#ThreadMagic",
    "#YarnDreams",
    "#StitchedWithLove",
    "#WarmAndWoolly",
    "#HandmadeCharm",
    "#MadeWithMagic",
    "#HandmadeTreasures",
    "#ShopHandmade",
    "#MadeForYou",
    "#BloomInEveryLoop",
    "#KnottedWithLove"
  ];

  const menuItems = products.map((product, idx) => {
    const tag = tagsPool[idx % tagsPool.length];
    return {
      image: getProductImage(product),
      link: `/product/${product.id}`,
      title: product.name,
      description: tag
    };
  });

  const getFeaturedProducts = () => {
    const featured = [];
    const seenCategories = new Set();
    for (const prod of products) {
      const catId = prod.category_id || prod.categoryId || prod.category || "";
      if (catId && !seenCategories.has(catId)) {
        featured.push(prod);
        seenCategories.add(catId);
      }
      if (featured.length === 3) break;
    }
    // Fallback in case we don't have 3 different categories
    if (featured.length < 3) {
      for (const prod of products) {
        if (!featured.includes(prod)) {
          featured.push(prod);
        }
        if (featured.length === 3) break;
      }
    }
    return featured;
  };

  const featuredProducts = getFeaturedProducts();

  return (
    <div className="relative">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-14 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="animate-slideUp">
          <p className="font-body text-sm font-semibold text-sage uppercase tracking-[0.18em] mb-4">
            Stitched one loop at a time
          </p>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold text-cocoa leading-[1.05]">
            Handmade Crochet, <br /> Made to Be Held
          </h1>
          <div className="my-6">
            <StitchDivider width={140} />
          </div>
          <p className="text-cocoa/70 text-lg max-w-md mb-8">
            Soft textures, big personalities. Explore handmade crochet creations that start as simple knots and turn into your next favorite companion
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link
              to="/cart"
              className="bg-clay hover:bg-clay/90 text-cream font-semibold px-7 py-3.5 rounded-full transition-colors shadow-sm flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 shrink-0"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <span>View Cart</span>
              {totalItems > 0 && (
                <span className="bg-white text-clay text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                  {totalItems}
                </span>
              )}
            </Link>
            
            <Link
              to="/shop"
              className="border-2 border-cocoa/15 hover:border-clay text-cocoa font-semibold px-7 py-3.5 rounded-full transition-colors flex items-center"
            >
              Browse Shop
            </Link>
          </div>
        </div>

        <div 
          className="relative w-full aspect-[4/3] md:aspect-[5/4] rounded-3xl overflow-hidden shadow-xl ring-1 ring-cocoa/5 animate-fadeIn"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 35%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 35%)",
          }}
        >
          <img
            src="/hero_crochet_animals.png"
            alt="Handmade crochet amigurumi bunny, fox, and chick with colorful yarn"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
        </div>
      </section>

      {/* Sliding Photos (Carousel) Section */}
      <section className="bg-cream py-16 border-t border-oat">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col items-center">
          <div className="text-center mb-10 max-w-xl animate-fadeIn">
            <p className="font-body text-sm font-semibold text-sage uppercase tracking-[0.18em] mb-3">
              Gallery Showcase
            </p>
            <h2 className="font-display text-4xl font-semibold text-cocoa">
             Handcrafted Highlights
            </h2>
            <div className="flex justify-center my-4">
              <StitchDivider width={100} />
            </div>
            <p className="text-cocoa/70 text-lg">
              A tiny showcase of soft characters and cozy accents waiting to meet you.
            </p>
          </div>
          
          {/* Desktop WebGL Showcase */}
          <div className="hidden md:block w-full h-[480px] px-4 animate-slideUp relative overflow-hidden rounded-3xl shadow-xl">
            {menuItems.length > 0 ? (
              <div className="infinite-menu-wrapper">
                <InfiniteMenu items={menuItems} scale={1.8} />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-oat text-cocoa/50">
                Loading showcase...
              </div>
            )}
          </div>

          {/* Mobile Showcase (horizontal swipe list) */}
          <div className="md:hidden w-full px-2 py-4 overflow-x-auto flex gap-4 snap-x snap-mandatory scrollbar-none">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.link}
                className="snap-center shrink-0 w-72 bg-white rounded-3xl border border-oat p-4 flex flex-col shadow-md"
              >
                <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-oat relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 bg-cocoa text-cream text-[11px] font-semibold px-3 py-1.5 rounded-full border border-oat">
                    {item.description}
                  </span>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="font-display text-xl font-semibold text-cocoa">{item.title}</h3>
                  <span className="text-xs text-clay font-semibold uppercase tracking-wider block mt-1 hover:underline">
                    View Product →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Favorites / Categories */}
      <section className="bg-white border-y border-oat">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-semibold text-cocoa">Our Favorites</h2>
            <div className="flex justify-center my-4">
              <StitchDivider width={100} />
            </div>
            <p className="text-cocoa/60">Explore our best-selling creations, sorted by mood.</p>
          </div>

          {loading && <p className="text-center text-cocoa/50">Loading categories…</p>}
          {error && (
            <p className="text-center text-clay">
              Couldn't load categories: {error}. Is the API server running?
            </p>
          )}

          {!loading && !error && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((prod) => (
                <Link
                  key={prod.id}
                  to={`/shop?category=${prod.category_slug || 'general'}`}
                  className="group block bg-white rounded-2xl overflow-hidden border border-oat hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-oat">
                    <img
                      src={getProductImage(prod)}
                      alt={prod.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="font-display text-xl font-semibold text-cocoa">{prod.name}</h3>
                    <p className="text-xs font-semibold text-sage uppercase tracking-wide mt-2">
                      {prod.category_name || "View Category"}
                    </p>
                    <p className="text-sm text-clay mt-1 font-medium group-hover:underline">
                      See all products in this category →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}