import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import StitchDivider from "../components/StitchDivider.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useUserAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery state
  const [activeImage, setActiveImage] = useState("");

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Cart quantity
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getProduct(id)
      .then((data) => {
        setProduct(data);
        setQuantity(1);
        // Resolve images and set active image
        const resolvedImages = [];
        if (data.image_url) resolvedImages.push(data.image_url);
        if (Array.isArray(data.images)) {
          data.images.forEach(img => {
            if (img && !resolvedImages.includes(img)) resolvedImages.push(img);
          });
        }
        if (Array.isArray(data.imageUrls)) {
          data.imageUrls.forEach(item => {
            const url = typeof item === "string" ? item : item?.url;
            if (url && !resolvedImages.includes(url)) resolvedImages.push(url);
          });
        }
        if (resolvedImages.length === 0) resolvedImages.push("/yarn-icon.svg");
        setActiveImage(resolvedImages[0]);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch product details.");
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch reviews
    setReviewsLoading(true);
    api.getProductReviews(id)
      .then(setReviews)
      .catch((err) => console.error("Error fetching reviews:", err))
      .finally(() => setReviewsLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="text-cocoa/60 text-lg">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display text-2xl font-semibold text-cocoa mb-4">Product Not Found</h2>
        <p className="text-cocoa/60 mb-6">{error || "The requested product does not exist."}</p>
        <Link to="/shop" className="bg-cocoa text-cream px-6 py-3 rounded-full hover:bg-clay transition-all duration-200">
          Back to Shop
        </Link>
      </div>
    );
  }

  // Extract all resolved images for the gallery
  const resolvedImages = [];
  if (product.image_url) resolvedImages.push(product.image_url);
  if (Array.isArray(product.images)) {
    product.images.forEach(img => {
      if (img && !resolvedImages.includes(img)) resolvedImages.push(img);
    });
  }
  if (Array.isArray(product.imageUrls)) {
    product.imageUrls.forEach(item => {
      const url = typeof item === "string" ? item : item?.url;
      if (url && !resolvedImages.includes(url)) resolvedImages.push(url);
    });
  }
  if (resolvedImages.length === 0) resolvedImages.push("/yarn-icon.svg");

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1) 
    : "0.0";

  // Simulate original price for UI aesthetic
  const originalPrice = Math.round(product.price * 1.25);

  const handleAddToCart = () => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      addToCart(product, quantity);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (err) {
      alert("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    const sanitizedComment = comment.trim().replace(/<[^>]*>/g, "");
    if (!sanitizedComment) {
      setReviewError("Please enter a valid review comment.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setReviewError("Rating must be between 1 and 5 stars.");
      return;
    }
    setSubmittingReview(true);
    setReviewError("");
    setReviewSuccess(false);

    try {
      const newReview = await api.addProductReview(id, {
        reviewer_name: user.displayName || user.email.split("@")[0],
        rating: Number(rating),
        comment: sanitizedComment,
        user_uid: user.uid
      });

      setReviews([newReview, ...reviews]);
      setComment("");
      setRating(5);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      setReviewError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
      {/* Breadcrumb */}
      <div className="text-sm text-cocoa/60 mb-8 flex items-center gap-2">
        <Link to="/" className="hover:text-clay">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-clay">Shop</Link>
        <span>/</span>
        <span className="text-cocoa font-medium truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 mb-16">
        {/* Gallery Section */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-oat border border-oat relative shadow-sm">
            <img
              src={activeImage || "/yarn-icon.svg"}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/yarn-icon.svg";
              }}
            />
          </div>
          
          {resolvedImages.length > 1 && (
            <div className="flex flex-wrap gap-3">
              {resolvedImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden bg-oat border-2 transition-all duration-200 ${
                    activeImage === img ? "border-clay scale-95 shadow-inner" : "border-transparent hover:border-oat"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/yarn-icon.svg";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-sm font-semibold text-sage uppercase tracking-wider">
              {product.category_name || "Handmade Crochet"}
            </span>
            <h1 className="font-display text-3xl lg:text-4xl font-semibold text-cocoa mt-1 mb-2">
              {product.name}
            </h1>
            
            {/* Rating summary */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(Number(avgRating)) ? "fill-current" : "text-gray-300"}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-semibold text-cocoa/80">{avgRating}</span>
              <span className="text-xs text-cocoa/40">({reviews.length} reviews)</span>
            </div>

            <div className="flex items-baseline gap-4 mb-4">
              <span className="font-display text-xl font-semibold text-clay">₹{product.price}</span>
              <span className="text-lg text-cocoa/45 line-through">₹{originalPrice}</span>
              <span className="text-sm font-bold text-sage">20% OFF</span>
            </div>
            
            <div className="inline-block">
              <span className="bg-sage/10 text-sage text-xs font-semibold px-3 py-1.5 rounded-full border border-sage/20">
                ✓ Prepared to Order
              </span>
            </div>
          </div>

          <div className="border-t border-oat pt-6">
            <h3 className="font-display font-semibold text-cocoa mb-2">Description</h3>
            <p className="text-cocoa/75 text-sm leading-relaxed whitespace-pre-line">
              {product.description || "No description provided for this cozy handmade product."}
            </p>
          </div>

          {/* Add to Cart Control Bar */}
          <div className="border-t border-oat pt-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center border border-oat rounded-full overflow-hidden bg-white min-h-[44px]">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-11 h-11 flex items-center justify-center hover:bg-oat text-cocoa font-bold transition-all text-lg"
              >
                -
              </button>
              <span className="px-4 py-2 text-cocoa font-semibold font-display min-w-[50px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                disabled={quantity >= 99}
                className="w-11 h-11 flex items-center justify-center hover:bg-oat text-cocoa font-bold transition-all text-lg disabled:opacity-50"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`w-full sm:flex-1 font-semibold py-3.5 px-8 rounded-full transition-all duration-200 transform active:scale-95 shadow-sm text-center ${
                addSuccess
                  ? "bg-sage text-white scale-100"
                  : "bg-cocoa text-cream hover:bg-clay hover:shadow-md"
              }`}
            >
              {isAdding ? "Adding..." : addSuccess ? "✓ Added to Cart!" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-oat pt-14">
        <h2 className="font-display text-2xl font-semibold text-cocoa mb-8">
          Customer Reviews
        </h2>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Reviews List */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {reviewsLoading ? (
              <p className="text-cocoa/50">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-cocoa/60 italic py-8 border-b border-oat">
                No reviews yet. Be the first to share your thoughts!
              </p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-oat pb-6 last:border-b-0">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <h4 className="font-semibold text-cocoa">{review.reviewer_name}</h4>
                      <div className="flex text-amber-500 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-gray-300"}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-cocoa/40">
                      {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <p className="text-cocoa/75 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Add Review Panel */}
          <div>
            <div className="bg-cream/20 border border-oat rounded-2xl p-6 sticky top-6">
              <h3 className="font-display font-semibold text-cocoa text-lg mb-4">
                Share Your Experience
              </h3>

              {user ? (
                <form onSubmit={handleAddReview} className="flex flex-col gap-4">
                  {reviewError && (
                    <div className="bg-clay/10 border border-clay/20 text-clay text-xs rounded-xl p-3">
                      {reviewError}
                    </div>
                  )}

                  {reviewSuccess && (
                    <div className="bg-sage/10 border border-sage/20 text-sage text-xs rounded-xl p-3">
                      ✓ Thank you! Your review has been published.
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-cocoa/65 uppercase tracking-wide mb-2">
                      Your Rating
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="w-11 h-11 flex items-center justify-center text-amber-500 hover:scale-110 transition-transform duration-100 bg-oat/20 rounded-full"
                          aria-label={`Rate ${star} stars`}
                        >
                          <svg
                            className={`w-7 h-7 ${star <= rating ? "fill-current" : "text-gray-300"}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="comment" className="block text-xs font-semibold text-cocoa/65 uppercase tracking-wide mb-2">
                      Review Comment
                    </label>
                    <textarea
                      id="comment"
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What did you love about this item? Write a quick review..."
                      className="w-full bg-white border border-oat rounded-xl p-4 text-sm text-cocoa placeholder-cocoa/40 focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay min-h-[100px]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-cocoa text-cream hover:bg-clay text-sm font-semibold py-3 rounded-full transition-all duration-200 disabled:opacity-50"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-cocoa/65 mb-4">
                    You must be logged in to leave a product review.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex bg-cocoa text-cream hover:bg-clay text-xs font-semibold px-6 py-3 rounded-full transition-all min-h-[44px] items-center justify-center"
                  >
                    Sign In to Review
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
