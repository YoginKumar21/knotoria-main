import { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useUserAuth } from "./UserAuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useUserAuth();

  // Load cart when user status changes
  useEffect(() => {
    async function loadCart() {
      if (user) {
        // Logged in user: load from Firestore
        const cartRef = doc(db, "carts", user.uid);
        try {
          const cartSnap = await getDoc(cartRef);
          let dbItems = [];
          if (cartSnap.exists()) {
            dbItems = cartSnap.data().items || [];
          }

          // If there is any guest cart in localStorage, merge it
          const savedGuestCart = localStorage.getItem("knotoria_cart");
          if (savedGuestCart) {
            try {
              const guestItems = JSON.parse(savedGuestCart);
              if (guestItems.length > 0) {
                // Merge guest items with database items
                const merged = [...dbItems];
                guestItems.forEach((gItem) => {
                  const idx = merged.findIndex((dbItem) => dbItem.id === gItem.id);
                  if (idx > -1) {
                    // Update quantity
                    const maxStock = gItem.stock_count !== undefined ? gItem.stock_count : 99;
                    merged[idx].quantity = Math.min(merged[idx].quantity + gItem.quantity, maxStock);
                  } else {
                    merged.push(gItem);
                  }
                });
                dbItems = merged;
                // Write merged cart back to Firestore
                await setDoc(cartRef, { items: dbItems });
              }
            } catch (e) {
              console.error("Error merging guest cart:", e);
            }
            // Clear guest cart
            localStorage.removeItem("knotoria_cart");
          }
          setCartItems(dbItems);
        } catch (error) {
          console.error("Error loading cart from Firestore:", error);
        }
      } else {
        // Guest user: load from local storage
        const savedCart = localStorage.getItem("knotoria_cart");
        if (savedCart) {
          try {
            setCartItems(JSON.parse(savedCart));
          } catch (e) {
            console.error("Corrupted local cart stream encountered:", e);
          }
        } else {
          setCartItems([]);
        }
      }
    }
    loadCart();
  }, [user]);

  const saveCartState = async (updatedItems) => {
    setCartItems(updatedItems);
    if (user) {
      // Save to Firestore
      const cartRef = doc(db, "carts", user.uid);
      try {
        await setDoc(cartRef, { items: updatedItems });
      } catch (error) {
        console.error("Error saving cart to Firestore:", error);
      }
    } else {
      // Save to localStorage
      localStorage.setItem("knotoria_cart", JSON.stringify(updatedItems));
    }
    // Keep other layout components in sync
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const addToCart = (product, quantity = 1) => {
    const existingIndex = cartItems.findIndex((item) => item.id === product.id);
    const updated = [...cartItems];

    if (existingIndex > -1) {
      const existingItem = updated[existingIndex];
      const maxQuantity = product.stock !== undefined ? product.stock : (product.stock_count !== undefined ? product.stock_count : 99);
      const targetQty = (existingItem.quantity || 1) + quantity;
      
      if (targetQty > maxQuantity) {
        existingItem.quantity = maxQuantity;
      } else {
        existingItem.quantity = targetQty;
      }
    } else {
      const stock = product.stock !== undefined ? product.stock : (product.stock_count !== undefined ? product.stock_count : 99);
      const initialQty = Math.min(quantity, stock);
      
      let resolvedImageUrl = product.image_url || "";
      if (!resolvedImageUrl) {
        if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
          resolvedImageUrl = typeof product.imageUrls[0] === "string" 
            ? product.imageUrls[0] 
            : product.imageUrls[0]?.url || "";
        } else if (Array.isArray(product.images) && product.images.length > 0) {
          resolvedImageUrl = product.images[0];
        }
      }

      updated.push({
        id: product.id || "",
        name: product.name || "",
        price: product.price || 0,
        image_url: resolvedImageUrl,
        category_name: product.category || product.category_name || "Handmade Crochet",
        stock_count: stock,
        in_stock: stock > 0,
        quantity: initialQty,
      });
    }

    saveCartState(updated);
  };

  const removeFromCart = (productId) => {
    const filtered = cartItems.filter((item) => item.id !== productId);
    saveCartState(filtered);
  };

  const updateQuantity = (productId, newQty) => {
    const updated = cartItems.map((item) => {
      if (item.id === productId) {
        const maxLimit = item.stock_count !== undefined ? item.stock_count : 99;
        const boundedQty = Math.max(1, Math.min(newQty, maxLimit));
        return { ...item, quantity: boundedQty };
      }
      return item;
    });
    saveCartState(updated);
  };

  const clearCart = () => {
    saveCartState([]);
  };

  const totalItems = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

