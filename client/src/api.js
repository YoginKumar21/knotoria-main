import * as productService from "./services/productService.js";

export const api = {
  // Categories
  getCategories: () => productService.getCategories(),

  // Products
  getProducts: (params = {}) => productService.getProducts(params),
  getProduct: (id) => productService.getProduct(id),
  createProduct: (token, payload) => productService.createProduct(payload),
  updateProduct: (token, id, payload) => productService.updateProduct(id, payload),
  deleteProduct: (token, id) => productService.deleteProduct(id),

  // Orders
  placeOrder: (payload) => productService.placeOrder(payload),
  getOrders: (token) => productService.getOrders(),
  getUserOrders: (uid) => productService.getUserOrders(uid),
  updateOrderStatus: (token, id, status) => productService.updateOrderStatus(id, status),
  deleteOrder: (token, id) => productService.deleteOrder(id),

  // Reviews
  getProductReviews: (productId) => productService.getProductReviews(productId),
  addProductReview: (productId, payload) => productService.addProductReview(productId, payload),
};
