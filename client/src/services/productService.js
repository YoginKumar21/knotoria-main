import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction
} from "firebase/firestore";
import { db } from "../firebase.js";

// ==========================================
// 1. Categories
// ==========================================

export const getCategories = async () => {
  try {
    const snapshot = await getDocs(collection(db, "categories"));
    const slugify = (text) => {
      if (!text) return "";
      return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    };
    const categories = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        slug: data.slug || slugify(data.name)
      };
    });
    // Sort alphabetically by name
    categories.sort((a, b) => a.name.localeCompare(b.name));
    return categories;
  } catch (error) {
    console.error("Error fetching categories from Firestore:", error);
    throw error;
  }
};

// ==========================================
// 2. Products (CRUD)
// ==========================================

export const getProducts = async (params = {}) => {
  try {
    let q = collection(db, "products");
    const productsSnapshot = await getDocs(q);

    // Resolve category details to avoid N+1 query overhead in client
    const categoriesSnapshot = await getDocs(collection(db, "categories"));
    const categoryMap = {};
    
    const slugify = (text) => {
      if (!text) return "";
      return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    };

    categoriesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      categoryMap[doc.id] = {
        ...data,
        slug: data.slug || slugify(data.name)
      };
    });

    let products = productsSnapshot.docs.map(doc => {
      const data = doc.data();
      let catId = data.category_id || data.categoryId || "";
      let cat = {};
      
      if (catId) {
        cat = categoryMap[catId] || {};
      } else if (data.category) {
        // Find category by name in categoryMap using cleanText to ignore emojis
        const cleanText = (str) => str ? str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : "";
        const foundCatId = Object.keys(categoryMap).find(
          id => categoryMap[id].name && cleanText(categoryMap[id].name) === cleanText(data.category)
        );
        if (foundCatId) {
          catId = foundCatId;
          cat = categoryMap[foundCatId];
        }
      }
      
      return {
        id: doc.id,
        ...data,
        category_id: catId,
        category_name: cat.name || data.category || "Handmade Crochet",
        category_slug: cat.slug || (cat.name ? slugify(cat.name) : "general"),
        stock_count: 9999,
        stock: 9999,
        in_stock: true
      };
    });

    // Client-side category filtering
    if (params.category) {
      const matchedCategory = categoriesSnapshot.docs.find(
        doc => {
          const data = doc.data();
          const slug = data.slug || slugify(data.name);
          return slug === params.category;
        }
      );
      console.log("Matched Category Doc:", matchedCategory ? matchedCategory.data() : "None", "ID:", matchedCategory ? matchedCategory.id : "None");
      if (matchedCategory) {
        const catData = matchedCategory.data();
        const catId = matchedCategory.id;
        const catName = catData.name;
        
        const cleanText = (str) => str ? str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : "";
        const targetClean = cleanText(catName);
        console.log("Filtering target category clean name:", targetClean);

        products = products.filter(p => {
          const matchId = (p.category_id && p.category_id === catId) || (p.categoryId && p.categoryId === catId);
          const matchName = (p.category && cleanText(p.category) === targetClean) ||
                            (p.category_name && cleanText(p.category_name) === targetClean);
          const matchIncludes = (p.category && cleanText(p.category).includes(targetClean)) ||
                                (p.category_name && cleanText(p.category_name).includes(targetClean)) ||
                                (targetClean && p.category && targetClean.includes(cleanText(p.category)));
          console.log(`Product "${p.name}" match details - Category: "${p.category}", CategoryName: "${p.category_name}", CategoryId: "${p.category_id}". Match ID: ${matchId}, Match Name: ${matchName}, Match Includes: ${matchIncludes}`);
          return matchId || matchName || matchIncludes;
        });
      } else {
        products = [];
      }
    }



    // Sort by created_at DESC (newest first)
    products.sort((a, b) => {
      const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at || 0);
      const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at || 0);
      return dateB - dateA;
    });

    return products;
  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    throw error;
  }
};

export const getProduct = async (id) => {
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error("Product not found.");
    }
    const data = docSnap.data();

    // Resolve category details
    let category_name = "";
    let category_slug = "";
    const catId = data.category_id || data.categoryId;
    if (catId) {
      const catSnap = await getDoc(doc(db, "categories", catId));
      if (catSnap.exists()) {
        const catData = catSnap.data();
        category_name = catData.name;
        category_slug = catData.slug;
      }
    }

    return {
      id: docSnap.id,
      ...data,
      category_id: catId || "",
      category_name: category_name || "Handmade Crochet",
      category_slug: category_slug || "general",
      stock_count: 9999,
      stock: 9999,
      in_stock: true
    };
  } catch (error) {
    console.error(`Error fetching product ${id} from Firestore:`, error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    const stock = Number.isFinite(Number(productData.stock_count)) ? Number(productData.stock_count) : 0;
    const inStock = stock > 0;

    const docRef = await addDoc(collection(db, "products"), {
      name: productData.name,
      description: productData.description || "",
      price: Number(productData.price),
      image_url: productData.image_url || "",
      category_id: productData.category_id,
      in_stock: inStock,
      stock_count: stock,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    const newDoc = await getDoc(docRef);
    return {
      id: newDoc.id,
      ...newDoc.data()
    };
  } catch (error) {
    console.error("Error creating product in Firestore:", error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const docRef = doc(db, "products", id);
    const updates = {
      updated_at: serverTimestamp()
    };

    if (productData.name !== undefined) updates.name = productData.name;
    if (productData.description !== undefined) updates.description = productData.description;
    if (productData.price !== undefined) updates.price = Number(productData.price);
    if (productData.image_url !== undefined) updates.image_url = productData.image_url;
    if (productData.category_id !== undefined) updates.category_id = productData.category_id;
    
    if (productData.stock_count !== undefined) {
      updates.stock_count = Number(productData.stock_count);
      updates.in_stock = updates.stock_count > 0;
    }
    if (productData.in_stock !== undefined) {
      updates.in_stock = Boolean(productData.in_stock);
    }

    await updateDoc(docRef, updates);
    return {
      id,
      ...updates
    };
  } catch (error) {
    console.error(`Error updating product ${id} in Firestore:`, error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const docRef = doc(db, "products", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting product ${id} from Firestore:`, error);
    throw error;
  }
};

// ==========================================
// 3. Orders (CRUD & Transactions)
// ==========================================

export const getOrders = async () => {
  try {
    const snapshot = await getDocs(collection(db, "orders"));

    // Fetch products and categories to map order item details (N+1 query protection)
    const productsSnapshot = await getDocs(collection(db, "products"));
    const productMap = {};
    productsSnapshot.docs.forEach(doc => {
      productMap[doc.id] = doc.data();
    });

    const categoriesSnapshot = await getDocs(collection(db, "categories"));
    const categoryMap = {};
    categoriesSnapshot.docs.forEach(doc => {
      categoryMap[doc.id] = doc.data();
    });

    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      const items = (data.items || []).map((item, index) => {
        const product = productMap[item.product_id] || {};
        const category = categoryMap[product.category_id] || {};
        return {
          id: `${doc.id}_item_${index}`,
          order_id: doc.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_order: item.price_at_order,
          product_name: product.name || "Unknown Product",
          product_image_url: product.image_url || "",
          category_name: category.name || ""
        };
      });

      return {
        id: doc.id,
        ...data,
        items
      };
    });

    // Sort orders by created_at DESC
    orders.sort((a, b) => {
      const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at || 0);
      const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at || 0);
      return dateB - dateA;
    });

    return orders;
  } catch (error) {
    console.error("Error fetching orders from Firestore:", error);
    throw error;
  }
};

export const getUserOrders = async (userUid) => {
  try {
    const q = query(collection(db, "orders"), where("user_uid", "==", userUid));
    const snapshot = await getDocs(q);

    const productsSnapshot = await getDocs(collection(db, "products"));
    const productMap = {};
    productsSnapshot.docs.forEach(doc => {
      productMap[doc.id] = doc.data();
    });

    const categoriesSnapshot = await getDocs(collection(db, "categories"));
    const categoryMap = {};
    categoriesSnapshot.docs.forEach(doc => {
      categoryMap[doc.id] = doc.data();
    });

    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      const items = (data.items || []).map((item, index) => {
        const product = productMap[item.product_id] || {};
        const category = categoryMap[product.category_id] || {};
        return {
          id: `${doc.id}_item_${index}`,
          order_id: doc.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_order: item.price_at_order,
          product_name: product.name || "Unknown Product",
          product_image_url: product.image_url || "",
          category_name: category.name || ""
        };
      });

      return {
        id: doc.id,
        ...data,
        items
      };
    });

    orders.sort((a, b) => {
      const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at || 0);
      const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at || 0);
      return dateB - dateA;
    });

    return orders;
  } catch (error) {
    console.error(`Error fetching orders for user ${userUid} from Firestore:`, error);
    throw error;
  }
};

export const placeOrder = async (orderData) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Failed to place order via server.");
    }
    
    return {
      success: true,
      orderId: result.orderId,
      totalPrice: result.totalAmount || result.totalPrice,
    };
  } catch (error) {
    console.error("Server checkout failed:", error);
    throw error;
  }
};

export const updateOrderStatus = async (id, status) => {
  try {
    const orderRef = doc(db, "orders", id);

    await runTransaction(db, async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Order not found.");
      }
      const existingOrder = orderDoc.data();

      // All products are prepared after ordered, no stock adjustments needed

      transaction.update(orderRef, { status });
    });

    return { success: true };
  } catch (error) {
    console.error("Order status transaction failed:", error);
    throw error;
  }
};

export const deleteOrder = async (id) => {
  try {
    const orderRef = doc(db, "orders", id);
    await deleteDoc(orderRef);
  } catch (error) {
    console.error(`Error deleting order ${id} from Firestore:`, error);
    throw error;
  }
};

// ==========================================
// 4. Product Reviews
// ==========================================

export const getProductReviews = async (productId) => {
  try {
    const reviewsRef = collection(db, "products", productId, "reviews");
    const q = query(reviewsRef, orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at
      };
    });
  } catch (error) {
    console.error(`Error fetching reviews for product ${productId}:`, error);
    // If query fails due to missing index, fallback to sorting in memory
    try {
      const reviewsRef = collection(db, "products", productId, "reviews");
      const snapshot = await getDocs(reviewsRef);
      const reviews = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at
        };
      });
      reviews.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return reviews;
    } catch (fallbackError) {
      console.error(`Fallback reviews fetch failed:`, fallbackError);
      throw fallbackError;
    }
  }
};

export const addProductReview = async (productId, reviewData) => {
  try {
    const reviewsRef = collection(db, "products", productId, "reviews");
    const docRef = await addDoc(reviewsRef, {
      reviewer_name: reviewData.reviewer_name,
      rating: Number(reviewData.rating),
      comment: reviewData.comment,
      user_uid: reviewData.user_uid,
      created_at: serverTimestamp()
    });
    const newDoc = await getDoc(docRef);
    const data = newDoc.data();
    return {
      id: newDoc.id,
      ...data,
      created_at: new Date().toISOString() // fallback for immediate display
    };
  } catch (error) {
    console.error(`Error adding review for product ${productId}:`, error);
    throw error;
  }
};
