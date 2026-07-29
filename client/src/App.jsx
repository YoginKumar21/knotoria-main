import { Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import { useUserAuth } from "./context/UserAuthContext.jsx";

import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Cart from "./pages/Cart.jsx";
import Login from "./pages/Login.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";

// Protected route component to redirect to login if unauthenticated
function ProtectedRoute({ children }) {
  const { user } = useUserAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Layout for user-facing website
function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col font-body bg-cream/30">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* User pages */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/my-orders" element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          } />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Route>

        {/* Fallback route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col bg-cream/30">
              <Navbar />
              <div className="flex-1 max-w-3xl mx-auto px-6 py-24 text-center">
                <h1 className="font-display text-3xl font-semibold text-cocoa mb-3">
                  Page not found
                </h1>
                <p className="text-cocoa/60">
                  That page doesn't exist — try the navigation above to find your way back.
                </p>
              </div>
              <Footer />
            </div>
          }
        />
      </Routes>
    </>
  );
}
