import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";
import { api } from "../api";
import StitchDivider from "../components/StitchDivider";

export default function MyOrders() {
  const { user } = useUserAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Action states for inline edit & cancellation
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editAddressForm, setEditAddressForm] = useState({
    street: "",
    city: "",
    postalCode: "",
    phone: "",
    email: ""
  });
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      try {
        const userOrders = await api.getUserOrders(user.uid);
        setOrders(userOrders);
      } catch (err) {
        console.error(err);
        setError("Failed to load your orders. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "delivered":
        return "bg-sage/10 text-sage border-sage/20";
      case "shipped":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "accepted":
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cancelled":
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "pending":
      default:
        return "bg-clay/10 text-clay border-clay/20";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleStartEditAddress = (order) => {
    const existingAddress = order.address || {};
    setEditAddressForm({
      street: existingAddress.street || order.customer_address || "",
      city: existingAddress.city || "",
      postalCode: existingAddress.postalCode || "",
      phone: existingAddress.phone || order.customer_phone || "",
      email: existingAddress.email || user?.email || ""
    });
    setEditingOrderId(order.id);
    setCancellingOrderId(null);
    setActionMessage(null);
  };

  const handleSaveAddress = async (orderId) => {
    if (!editAddressForm.street || !editAddressForm.phone) {
      setActionMessage({ type: "error", text: "Street address and phone number are required." });
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const result = await api.updateOrderAddress(orderId, editAddressForm, user.uid);
      if (result.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  address: result.address || editAddressForm,
                  customer_address: `${editAddressForm.street}, ${editAddressForm.city} - ${editAddressForm.postalCode}`,
                  customer_phone: editAddressForm.phone
                }
              : o
          )
        );
        setEditingOrderId(null);
        setActionMessage({ type: "success", text: "Delivery address updated successfully!" });
      } else {
        throw new Error(result.error || "Failed to update address.");
      }
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Could not update delivery address." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancelOrder = async (orderId) => {
    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const result = await api.cancelOrder(orderId, user.uid);
      if (result.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
        );
        setCancellingOrderId(null);
        setActionMessage({ type: "success", text: "Order has been cancelled successfully." });
      } else {
        throw new Error(result.error || "Failed to cancel order.");
      }
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Could not cancel order." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-clay border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="mb-6 md:mb-8">
        <span className="text-xs uppercase tracking-wider font-semibold text-clay bg-clay/10 px-3.5 py-1 rounded-full">
          Customer Space
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-cocoa mt-4 mb-2">
          Your Cozy Orders
        </h1>
        <p className="text-cocoa/60 text-sm">
          Track and view your handmade crochet purchases with Knotoria.
        </p>
      </div>

      <div className="my-6">
        <StitchDivider width={120} />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
          {error}
        </div>
      )}

      {actionMessage && (
        <div
          className={`mb-6 p-4 border text-sm rounded-2xl ${
            actionMessage.type === "success"
              ? "bg-sage/10 border-sage/30 text-sage"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-oat rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="text-5xl mb-4">🧶</div>
          <h2 className="font-display text-xl font-bold text-cocoa mb-2">No orders found</h2>
          <p className="text-cocoa/60 text-sm max-w-sm mx-auto mb-6">
            You haven't adopted any crochet companions yet! Your home is waiting for stitches.
          </p>
          <Link
            to="/shop"
            className="inline-block px-8 py-3 rounded-full bg-cocoa text-cream font-semibold hover:bg-clay hover:text-white transition-colors text-sm shadow-sm min-h-[44px] flex items-center justify-center max-w-[200px] mx-auto"
          >
            Explore our Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusLower = (order.status || "pending").toLowerCase();
            const isModifiable = ["pending", "accepted", "processing"].includes(statusLower);

            return (
              <div
                key={order.id}
                className="bg-white border border-oat rounded-3xl overflow-hidden shadow-xs hover:shadow-sm transition-shadow"
              >
                {/* Order Header */}
                <div className="bg-cream/15 px-4 sm:px-6 py-4 border-b border-oat grid grid-cols-2 md:flex md:flex-wrap md:justify-between items-center gap-4">
                  <div>
                    <p className="text-xs font-semibold text-cocoa/40 uppercase tracking-wider">
                      Order Placed
                    </p>
                    <p className="text-sm font-semibold text-cocoa">
                      {formatDate(order.createdAt || order.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-cocoa/40 uppercase tracking-wider text-left md:text-right">
                      Order Reference
                    </p>
                    <p className="text-sm font-mono font-bold text-cocoa text-left md:text-right">
                      #KN-{order.id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-cocoa/40 uppercase tracking-wider text-left md:text-right">
                      Total Amount
                    </p>
                    <p className="text-sm font-bold text-clay text-left md:text-right">
                      ₹{(order.totalAmount !== undefined ? order.totalAmount : order.total_price)?.toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-full border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Pending"}
                  </span>
                </div>

                {/* Order Items */}
                <div className="p-6 divide-y divide-oat/50">
                  {order.items?.map((item) => {
                    const itemPrice = item.price !== undefined ? item.price : item.price_at_order;
                    return (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {item.product_image_url ? (
                            <img
                              src={item.product_image_url}
                              alt={item.product_name}
                              className="w-16 h-16 rounded-2xl object-cover bg-oat border border-oat"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-oat flex items-center justify-center text-xl">
                              🧶
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-cocoa text-sm">
                              {item.product_name}
                            </h4>
                            <p className="text-xs text-cocoa/50 mt-0.5">
                              Category: {item.category_name || "Handmade"}
                            </p>
                            <p className="text-xs text-cocoa/60 mt-1 font-medium">
                              Qty: {item.quantity} × ₹{itemPrice?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-cocoa">
                            ₹{(item.quantity * itemPrice)?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Details & Actions Footer */}
                <div className="bg-cream/5 px-6 py-4 border-t border-oat text-xs text-cocoa/60 space-y-2">
                  {/* Delivery Address Details */}
                  {order.address && (
                    <p>
                      <span className="font-semibold text-cocoa/80">Shipping Address: </span>
                      {order.address.street}, {order.address.city} - {order.address.postalCode}
                    </p>
                  )}
                  {!order.address && order.customer_address && (
                    <p>
                      <span className="font-semibold text-cocoa/80">Shipping Address: </span>
                      {order.customer_address}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold text-cocoa/80">Recipient Contact: </span>
                    {order.address?.phone || order.customer_phone || "N/A"}
                  </p>
                  {order.estimatedDeliveryDate && (
                    <p className="text-sage font-semibold">
                      <span>Estimated Delivery: </span>
                      {order.estimatedDeliveryDate}
                    </p>
                  )}

                  {/* Modifiable Action Buttons (Visible ONLY during pending / accepted / processing) */}
                  {isModifiable && editingOrderId !== order.id && cancellingOrderId !== order.id && (
                    <div className="pt-3 border-t border-oat/60 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleStartEditAddress(order)}
                        className="px-4 py-1.5 rounded-full border border-cocoa/20 hover:border-cocoa text-xs font-semibold text-cocoa transition-colors flex items-center gap-1.5"
                      >
                        ✏️ Edit Shipping Address
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCancellingOrderId(order.id);
                          setEditingOrderId(null);
                          setActionMessage(null);
                        }}
                        className="px-4 py-1.5 rounded-full border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        ✕ Cancel Order
                      </button>
                    </div>
                  )}

                  {/* Inline Address Edit Form */}
                  {editingOrderId === order.id && (
                    <div className="mt-3 p-4 bg-white border border-oat rounded-2xl space-y-3">
                      <p className="font-bold text-cocoa text-xs uppercase tracking-wider">
                        Update Shipping Address
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-cocoa/70 mb-1">
                            Street Address
                          </label>
                          <input
                            type="text"
                            value={editAddressForm.street}
                            onChange={(e) =>
                              setEditAddressForm({ ...editAddressForm, street: e.target.value })
                            }
                            className="w-full px-3 py-1.5 border border-oat rounded-xl text-xs text-cocoa focus:outline-none focus:border-clay"
                            placeholder="Street / Flat / House No."
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-cocoa/70 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={editAddressForm.city}
                            onChange={(e) =>
                              setEditAddressForm({ ...editAddressForm, city: e.target.value })
                            }
                            className="w-full px-3 py-1.5 border border-oat rounded-xl text-xs text-cocoa focus:outline-none focus:border-clay"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-cocoa/70 mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={editAddressForm.postalCode}
                            onChange={(e) =>
                              setEditAddressForm({ ...editAddressForm, postalCode: e.target.value })
                            }
                            className="w-full px-3 py-1.5 border border-oat rounded-xl text-xs text-cocoa focus:outline-none focus:border-clay"
                            placeholder="PIN / Postal Code"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-cocoa/70 mb-1">
                            Contact Phone
                          </label>
                          <input
                            type="text"
                            value={editAddressForm.phone}
                            onChange={(e) =>
                              setEditAddressForm({ ...editAddressForm, phone: e.target.value })
                            }
                            className="w-full px-3 py-1.5 border border-oat rounded-xl text-xs text-cocoa focus:outline-none focus:border-clay"
                            placeholder="Phone number"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleSaveAddress(order.id)}
                          className="px-4 py-1.5 rounded-full bg-cocoa text-cream text-xs font-semibold hover:bg-clay transition-colors disabled:opacity-50"
                        >
                          {isSubmitting ? "Saving..." : "Save Address"}
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setEditingOrderId(null)}
                          className="px-4 py-1.5 rounded-full border border-oat text-xs font-semibold text-cocoa/70 hover:bg-oat/30 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Cancel Order Confirmation */}
                  {cancellingOrderId === order.id && (
                    <div className="mt-3 p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-2">
                      <p className="font-semibold text-red-800 text-xs">
                        Are you sure you want to cancel order #KN-{order.id.slice(-6).toUpperCase()}?
                      </p>
                      <p className="text-[11px] text-red-600">
                        This action will mark your order as cancelled.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleConfirmCancelOrder(order.id)}
                          className="px-4 py-1.5 rounded-full bg-red-700 text-white text-xs font-semibold hover:bg-red-800 transition-colors disabled:opacity-50"
                        >
                          {isSubmitting ? "Cancelling..." : "Yes, Cancel Order"}
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setCancellingOrderId(null)}
                          className="px-4 py-1.5 rounded-full border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                        >
                          Keep Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
