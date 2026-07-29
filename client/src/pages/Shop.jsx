import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";
import StitchDivider from "../components/StitchDivider.jsx";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "";

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (activeCategory) params.category = activeCategory;

    api
      .getProducts(params)
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  function selectCategory(slug) {
    if (slug) setSearchParams({ category: slug });
    else setSearchParams({});
  }

  // Filter products by search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort products by price
  const sortedProducts = [...filteredProducts];
  if (sortBy === "price-asc") {
    sortedProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    sortedProducts.sort((a, b) => b.price - a.price);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-semibold text-cocoa">The Shop</h1>
        <div className="flex justify-center my-4">
          <StitchDivider width={100} />
        </div>
        <p className="text-cocoa/60">Every piece below is made by hand, one stitch at a time.</p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-6 mb-10 bg-cream/35 p-6 rounded-3xl border border-oat">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Search bar */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search crochet plushies, accessories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-oat rounded-full px-5 py-3 text-sm text-cocoa placeholder-cocoa/40 focus:outline-none focus:border-clay shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-cocoa/40 hover:text-cocoa text-sm font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={activeCategory}
              onChange={(e) => selectCategory(e.target.value)}
              className="w-full bg-white border border-oat rounded-full px-5 py-3 text-sm text-cocoa focus:outline-none focus:border-clay shadow-sm appearance-none cursor-pointer"
            >
              <option value="">Category: All</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-cocoa/60">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white border border-oat rounded-full px-5 py-3 text-sm text-cocoa focus:outline-none focus:border-clay shadow-sm appearance-none cursor-pointer"
            >
              <option value="default">Sort: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-cocoa/60">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="text-center text-cocoa/50 py-16">Loading products…</p>}

      {error && (
        <p className="text-center text-clay py-16">
          Couldn't load products: {error}. Is the API server running on port 4000?
        </p>
      )}

      {!loading && !error && sortedProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-cocoa/60 text-lg">No products match your criteria.</p>
          <p className="text-cocoa/40 text-sm mt-1">Try a different search term or check back soon.</p>
        </div>
      )}

      {!loading && !error && sortedProducts.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
