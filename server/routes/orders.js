const express = require("express");
const db = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

async function resolveOrdersDetails(orderDocs) {
  // Fetch all products and categories once to map them
  const productsSnapshot = await db.collection("products").get();
  const productMap = {};
  productsSnapshot.docs.forEach(doc => {
    productMap[doc.id] = doc.data();
  });

  const categoriesSnapshot = await db.collection("categories").get();
  const categoryMap = {};
  categoriesSnapshot.docs.forEach(doc => {
    categoryMap[doc.id] = doc.data();
  });

  return orderDocs.map(doc => {
    const o = doc.data();
    const items = (o.items || []).map((item, index) => {
      const product = productMap[item.productId || item.product_id] || {};
      const category = categoryMap[product.category_id || product.categoryId] || {};
      return {
        id: `${doc.id}_item_${index}`,
        order_id: doc.id,
        productId: item.productId || item.product_id,
        quantity: item.quantity,
        price: item.price !== undefined ? item.price : item.price_at_order,
        product_name: item.name || product.name || "Unknown Product",
        product_image_url: product.imageUrls?.[0]?.url || product.image_url || "",
        category_name: category.name || ""
      };
    });

    return {
      id: doc.id,
      ...o,
      items
    };
  });
}

// POST /api/orders - public checkout route
router.post("/", async (req, res) => {
  // Support both new nested address payload and legacy flat payload
  const { userId, user_uid, items, address, customer_name, customer_email, customer_phone, customer_address } = req.body;

  let resolvedUserId = userId !== undefined ? userId : (user_uid || null);
  let email = address?.email || customer_email;
  let phone = address?.phone || customer_phone;
  let street = address?.street || customer_address || "";
  let city = address?.city || "";
  let postalCode = address?.postalCode || "";

  if (!email || !phone || !street) {
    return res.status(400).json({ error: "Email, phone, and delivery address street are required." });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Your shopping cart is empty." });
  }

  try {
    let orderId;
    let totalAmount = 0;
    const finalOrderItems = [];

    await db.runTransaction(async (transaction) => {
      const validatedItems = [];

      // 1. Validate all products and stock levels
      for (const item of items) {
        const prodId = item.productId || item.product_id;
        if (!prodId || !item.quantity || item.quantity <= 0) {
          throw new Error("Invalid product or quantity in cart.");
        }

        const productRef = db.collection("products").doc(prodId);
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists) {
          throw new Error(`Product not found.`);
        }

        const productData = productDoc.data();
        
        // Check active flag
        if (productData.isActive === false) {
          throw new Error(`"${productData.name}" is no longer active and cannot be purchased.`);
        }

        // Prepared to order, skip stock checks

        totalAmount += productData.price * item.quantity;
        validatedItems.push({
          ref: productRef,
          data: productData,
          quantity: item.quantity,
          productId: prodId
        });
      }

      // 2. Prepare Order document fields matching schema
      const orderRef = db.collection("orders").doc();
      orderId = orderRef.id;

      const orderItems = validatedItems.map(vi => {
        const itemObj = {
          productId: vi.productId,
          name: vi.data.name,
          price: vi.data.price,
          quantity: vi.quantity
        };
        finalOrderItems.push(itemObj);
        return itemObj;
      });

      // Calculate estimated delivery (7 days from now)
      const estDate = new Date();
      estDate.setDate(estDate.getDate() + 7);
      const estimatedDeliveryDate = estDate.toISOString().split('T')[0];

      transaction.set(orderRef, {
        userId: resolvedUserId,
        user_uid: resolvedUserId,
        status: "pending",
        totalAmount,
        items: orderItems,
        address: {
          email,
          phone,
          street,
          city,
          postalCode
        },
        estimatedDeliveryDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Skip decrementing stock as products are prepared after ordered
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      orderId,
      totalPrice: totalAmount,
      totalAmount
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/orders - fetches all orders (or user orders if filtered)
router.get("/", async (req, res) => {
  const { userId, user_uid } = req.query;
  const resolvedUserId = userId !== undefined ? userId : user_uid;

  try {
    let docs = [];

    if (resolvedUserId) {
      // Filter by user ID (checking both userId and user_uid fields for backward compatibility)
      const snap1 = await db.collection("orders").where("userId", "==", resolvedUserId).get();
      const snap2 = await db.collection("orders").where("user_uid", "==", resolvedUserId).get();
      const docMap = new Map();
      snap1.docs.forEach(doc => docMap.set(doc.id, doc));
      snap2.docs.forEach(doc => docMap.set(doc.id, doc));
      docs = Array.from(docMap.values());
    } else {
      const snapshot = await db.collection("orders").get();
      docs = snapshot.docs;
    }

    let resolvedOrders = await resolveOrdersDetails(docs);

    // Sort by createdAt DESC
    resolvedOrders.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

    res.json(resolvedOrders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders: " + err.message });
  }
});

// PATCH /api/orders/:id - admin only, updates order status & handles stock adjustments
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "processing", "accepted", "rejected", "shipped", "delivered", "cancelled"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Choose from: ${validStatuses.join(", ")}` });
  }

  try {
    const orderRef = db.collection("orders").doc(id);

    await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new Error("Order not found.");
      }

      const existingOrder = orderDoc.data();

      // Skip adjusting stock on order status transitions

      transaction.update(orderRef, { 
        status,
        updatedAt: new Date().toISOString()
      });
    });

    res.json({ success: true, message: `Order status updated to ${status}.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/address - customer route to update shipping address while order is pending/processing
router.patch("/:id/address", async (req, res) => {
  const { id } = req.params;
  const { userId, user_uid, address } = req.body;
  const resolvedUserId = userId !== undefined ? userId : user_uid;

  if (!address || !address.street || !address.phone) {
    return res.status(400).json({ error: "Street and phone number are required to update address." });
  }

  try {
    const orderRef = db.collection("orders").doc(id);
    const doc = await orderRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found." });
    }

    const orderData = doc.data();

    // Verify ownership if user ID provided
    if (resolvedUserId && orderData.userId && orderData.userId !== resolvedUserId && orderData.user_uid !== resolvedUserId) {
      return res.status(403).json({ error: "You are not authorized to modify this order." });
    }

    const modifiableStatuses = ["pending", "accepted", "processing"];
    if (!modifiableStatuses.includes(orderData.status?.toLowerCase())) {
      return res.status(400).json({ error: "Cannot edit delivery address once the order is shipped or completed." });
    }

    const updatedAddress = {
      email: address.email || orderData.address?.email || "",
      phone: address.phone || orderData.address?.phone || "",
      street: address.street || orderData.address?.street || "",
      city: address.city || orderData.address?.city || "",
      postalCode: address.postalCode || orderData.address?.postalCode || ""
    };

    await orderRef.update({
      address: updatedAddress,
      customer_address: `${updatedAddress.street}, ${updatedAddress.city} - ${updatedAddress.postalCode}`,
      customer_phone: updatedAddress.phone,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: "Delivery address updated successfully.", address: updatedAddress });
  } catch (err) {
    res.status(500).json({ error: "Failed to update address: " + err.message });
  }
});

// PATCH /api/orders/:id/cancel - customer route to cancel order while order is pending/processing
router.patch("/:id/cancel", async (req, res) => {
  const { id } = req.params;
  const { userId, user_uid } = req.body;
  const resolvedUserId = userId !== undefined ? userId : user_uid;

  try {
    const orderRef = db.collection("orders").doc(id);
    const doc = await orderRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found." });
    }

    const orderData = doc.data();

    // Verify ownership if user ID provided
    if (resolvedUserId && orderData.userId && orderData.userId !== resolvedUserId && orderData.user_uid !== resolvedUserId) {
      return res.status(403).json({ error: "You are not authorized to cancel this order." });
    }

    const modifiableStatuses = ["pending", "accepted", "processing"];
    if (!modifiableStatuses.includes(orderData.status?.toLowerCase())) {
      return res.status(400).json({ error: "Cannot cancel order once it has been shipped or completed." });
    }

    await orderRef.update({
      status: "cancelled",
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: "Order has been cancelled successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel order: " + err.message });
  }
});

// DELETE /api/orders/:id - admin only, deletes order record
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const orderRef = db.collection("orders").doc(id);
    const doc = await orderRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found." });
    }

    await orderRef.delete();
    res.json({ success: true, message: "Order removed from history." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete order: " + err.message });
  }
});

module.exports = router;
