import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import { api } from "../api.js";
import StitchDivider from "../components/StitchDivider.jsx";

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems } = useCart();
  const { user } = useUserAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.displayName || "",
        email: f.email || user.email || "",
      }));
    }
  }, [user]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!form.name || !form.email || !form.phone || !form.street || !form.city || !form.postalCode) {
      setError("Please fill out all contact and delivery details.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      userId: user ? user.uid : null,
      address: {
        email: form.email,
        phone: form.phone,
        street: form.street,
        city: form.city,
        postalCode: form.postalCode
      },
      items: cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await api.placeOrder(payload);
      if (response.success) {
        setOrderSuccess({
          orderId: response.orderId,
          totalPrice: response.totalPrice,
          items: [...cartItems],
        });
        clearCart();
      } else {
        throw new Error(response.error || "Something went wrong.");
      }
    } catch (err) {
      setError(err.message || "Failed to place your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was successfully completed
  if (orderSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center animate-fadeIn">
        <div className="bg-cream/30 border border-oat rounded-3xl p-8 md:p-12 shadow-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sage/10 text-sage text-4xl mb-6">
            ✓
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-cocoa mb-3">
            Thank You for Your Order!
          </h1>
          <p className="text-cocoa/70 text-base max-w-md mx-auto mb-6">
            Your handmade creation is now registered. We are preparing to stitch and package your new companions.
          </p>
          
          <div className="my-6 flex justify-center">
            <StitchDivider width={160} />
          </div>

          <div className="bg-white rounded-2xl p-6 border border-oat text-left space-y-4 max-w-md mx-auto mb-8 shadow-sm">
            <div className="flex justify-between items-center text-sm border-b border-oat pb-2">
              <span className="text-cocoa/50 font-medium">Order Reference:</span>
              <span className="font-mono font-bold text-cocoa">#KN-{orderSuccess.orderId}</span>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {orderSuccess.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-8 h-8 rounded object-cover bg-oat"
                    />
                    <span className="text-cocoa font-medium truncate max-w-[180px]">
                      {item.name}
                    </span>
                    <span className="text-cocoa/40">x{item.quantity}</span>
                  </div>
                  <span className="font-semibold text-cocoa">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-base border-t border-oat pt-3 font-semibold">
              <span className="text-cocoa">Amount Paid:</span>
              <span className="text-clay text-lg">₹{orderSuccess.totalPrice}</span>
            </div>
          </div>

          <Link
            to="/shop"
            className="inline-block bg-clay hover:bg-clay-dark text-cream font-semibold px-8 py-3 rounded-full transition-colors shadow-sm text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-semibold text-cocoa">Your Cart</h1>
        <div className="flex justify-center my-4">
          <StitchDivider width={100} />
        </div>
        {cartItems.length > 0 ? (
          <p className="text-cocoa/65">Review your cozy choices and fill details to finish.</p>
        ) : (
          <p className="text-cocoa/65">Your basket is currently empty.</p>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-cream/20 rounded-3xl border border-dashed border-oat max-w-xl mx-auto">
          <span className="text-5xl block mb-4">🧶</span>
          <h2 className="text-xl font-semibold text-cocoa mb-2">No Items in Cart</h2>
          <p className="text-cocoa/50 text-sm max-w-xs mx-auto mb-8">
            Explore our handmade collection to find custom crochet amigurumi, bags, and more.
          </p>
          <Link
            to="/shop"
            className="bg-clay hover:bg-clay-dark text-cream font-semibold px-7 py-3 rounded-full transition-colors shadow-sm text-sm"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Cart items list */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-lg font-semibold text-cocoa mb-2">Items List ({totalItems})</h2>
            
            {cartItems.map((item) => {
              const maxStock = item.stock_count !== undefined ? item.stock_count : 99;
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-oat rounded-2xl items-center hover:shadow-sm transition-shadow"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-oat"
                  />
                  
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <span className="text-[10px] font-semibold text-sage uppercase tracking-wider">
                      {item.category_name}
                    </span>
                    <h3 className="font-display font-semibold text-base text-cocoa truncate mb-0.5">
                      {item.name}
                    </h3>
                    <p className="text-sm font-semibold text-clay mb-2 sm:mb-0">
                      ₹{item.price}{" "}
                      <span className="text-xs text-cocoa/40 font-normal">per item</span>
                    </p>
                    {item.stock_count !== undefined && item.stock_count <= 5 && (
                      <span className="text-[10px] font-medium bg-apricot/20 text-cocoa px-2 py-0.5 rounded-full inline-block mt-1">
                        Only {item.stock_count} left in stock
                      </span>
                    )}
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex items-center gap-3 bg-oat/30 p-2 rounded-full border border-oat shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-11 h-11 flex items-center justify-center text-cocoa/60 hover:text-clay font-bold text-lg bg-white rounded-full shadow-sm hover:shadow active:scale-95 transition-all"
                    >
                      –
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-cocoa select-none">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= maxStock}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className={`w-11 h-11 flex items-center justify-center text-cocoa/60 hover:text-clay font-bold text-lg bg-white rounded-full shadow-sm hover:shadow active:scale-95 transition-all ${
                        item.quantity >= maxStock ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                    >
                      +
                    </button>
                  </div>

                  <div className="text-center sm:text-right shrink-0">
                    <p className="font-display font-semibold text-cocoa text-base">
                      ₹{item.price * item.quantity}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs text-clay hover:text-clay-dark underline mt-1 block"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-cocoa/50 hover:text-clay font-medium transition-colors"
              >
                Clear all items
              </button>
              <Link to="/shop" className="text-xs text-clay hover:underline font-semibold">
                ← Keep Browsing Shop
              </Link>
            </div>
          </div>

          {/* Checkout Info */}
          <div className="lg:col-span-5">
            <div className="bg-cream/20 border border-oat rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="font-display text-xl font-semibold text-cocoa">Checkout Summary</h2>
              
              <div className="space-y-3 text-sm border-b border-oat pb-4">
                <div className="flex justify-between text-cocoa/70">
                  <span>Subtotal</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-cocoa/70">
                  <span>Shipping</span>
                  <span className="text-sage font-medium">FREE Delivery</span>
                </div>
              </div>

              <div className="flex justify-between items-center font-display font-bold text-cocoa text-lg">
                <span>Estimated Total:</span>
                <span className="text-clay text-2xl">₹{totalPrice}</span>
              </div>

              {/* Delivery Details Form / Auth CTA */}
              {user ? (
                <form onSubmit={handlePlaceOrder} className="space-y-4 pt-2 border-t border-oat">
                  <h3 className="text-sm font-semibold text-cocoa/80">Shipping & Contact Details</h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-cocoa/60 mb-1">Your Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleInputChange}
                      className="w-full border border-oat rounded-xl px-4 py-3 text-sm focus:border-clay outline-none bg-white transition-colors min-h-[44px]"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-cocoa/60 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleInputChange}
                      className="w-full border border-oat rounded-xl px-4 py-3 text-sm focus:border-clay outline-none bg-white transition-colors min-h-[44px]"
                      placeholder="e.g. jane@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-cocoa/60 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={handleInputChange}
                      className="w-full border border-oat rounded-xl px-4 py-3 text-sm focus:border-clay outline-none bg-white transition-colors min-h-[44px]"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-cocoa/60 mb-1">Street Address</label>
                    <textarea
                      name="street"
                      required
                      rows={2}
                      value={form.street}
                      onChange={handleInputChange}
                      className="w-full border border-oat rounded-xl px-4 py-3 text-sm focus:border-clay outline-none bg-white resize-none transition-colors min-h-[64px]"
                      placeholder="e.g. Flat/House No, Building, Street Name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-cocoa/60 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={form.city}
                        onChange={handleInputChange}
                        className="w-full border border-oat rounded-xl px-4 py-3 text-sm focus:border-clay outline-none bg-white transition-colors min-h-[44px]"
                        placeholder="e.g. Mumbai"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-cocoa/60 mb-1">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        required
                        value={form.postalCode}
                        onChange={handleInputChange}
                        className="w-full border border-oat rounded-xl px-4 py-3 text-sm focus:border-clay outline-none bg-white transition-colors min-h-[44px]"
                        placeholder="e.g. 400001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-cocoa/60 mb-1">Payment Method</label>
                    <div className="border border-oat rounded-xl p-3 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 text-cocoa/70 shrink-0"
                        >
                          <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                        <span className="text-xs font-semibold text-cocoa">Cash on Delivery (COD)</span>
                      </div>
                      <span className="text-[10px] text-sage font-bold bg-sage/10 px-2 py-0.5 rounded-full">
                        Supported
                      </span>
                    </div>
                    <p className="text-[10px] text-cocoa/40 mt-1">
                      Pay securely in cash or via UPI when your handmade creations arrive.
                    </p>
                  </div>

                  {error && (
                    <div className="bg-clay/10 border border-clay/20 text-clay text-xs p-3 rounded-xl">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-cocoa hover:bg-clay text-cream font-semibold py-3.5 rounded-full transition-colors shadow-sm tracking-wide text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin"></span>
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <span>Confirm & Place Order</span>
                    )}
                  </button>
                </form>
              ) : (
                <div className="pt-6 border-t border-oat text-center space-y-4">
                  <div className="p-4 bg-clay/5 border border-clay/15 rounded-2xl">
                    <p className="text-sm text-cocoa/80 font-medium">
                      Please sign in or create an account to adopt your handmade companions and finish checking out.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    state={{ from: { pathname: "/cart" } }}
                    className="w-full block text-center py-3.5 rounded-2xl bg-cocoa hover:bg-clay text-cream hover:text-white font-semibold text-sm shadow-sm transition-all"
                  >
                    Sign In to Checkout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
