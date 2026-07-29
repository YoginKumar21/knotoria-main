import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function ProductCard({ product }) {
  const { id, name, description, price } = product;
  const { addToCart } = useCart();
  
  const stock = 9999;
  const in_stock = true;
  const category = product.category || product.category_name || "Handmade Crochet";

  // Local state indicators to provide responsive visual feedback to the user upon clicking
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault(); // Blocks parent link navigation actions
    e.stopPropagation();
    if (isAdding) return;

    setIsAdding(true);
    try {
      addToCart(product, 1);
      
      // Flash an optimized "Added!" confirmation design layout
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 1500);
    } catch (err) {
      console.error("Failed to append item to structural shopping cart array:", err.message);
      alert("Could not add item to cart.");
    } finally {
      setIsAdding(false);
    }
  };

  // Resolve Cloudinary URLs / arrays / nested object formats
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
  const fallbackImage = "/yarn-icon.svg";

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-oat hover-lift transition-shadow duration-300 flex flex-col animate-fadeIn">
      {/* Clickable Image Preview Canvas */}
      <Link to={`/product/${id}`} className="relative aspect-square overflow-hidden bg-oat block">
        <img
          src={displayImage || fallbackImage}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackImage;
          }}
        />
      </Link>

      {/* Content Meta Grid */}
      <div className="p-5 flex flex-col gap-1.5 flex-1">
        <span className="text-xs font-semibold text-sage uppercase tracking-wide">
          {category}
        </span>
        <Link to={`/product/${id}`} className="hover:text-clay transition-colors duration-200">
          <h3 className="font-display text-lg font-semibold text-cocoa leading-snug">{name}</h3>
        </Link>
        <p className="text-sm text-cocoa/65 line-clamp-2 flex-1">{description}</p>
        
        {/* Interactive Price & Functional Purchase Bar */}
        <div className="flex items-center justify-between pt-3">
          <span className="font-display text-xl font-semibold text-clay">₹{price}</span>
          
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 transform active:scale-95 shadow-sm min-h-[44px] flex items-center justify-center ${
              addSuccess
                ? "bg-sage text-white scale-100" // Turns pleasant soft-green upon operational execution success
                : "bg-cocoa text-cream hover:bg-clay hover:shadow-md"
            }`}
          >
            {/* Dynamic UI string output resolver */}
            {isAdding ? "Adding..." : addSuccess ? "✓ Added!" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}