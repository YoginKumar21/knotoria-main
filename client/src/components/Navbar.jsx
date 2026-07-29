import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useUserAuth } from "../context/UserAuthContext.jsx";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { totalItems } = useCart();
  const { user, logout } = useUserAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
      navigate("/");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-oat">
      <nav className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center group" onClick={() => { setOpen(false); setShowDropdown(false); }}>
          <img
            src="/knotoria-logo.png"
            alt="Knotoria"
            className="h-[80px] w-auto object-contain"
          />
        </Link>

        <ul className="hidden md:flex items-center gap-9 font-body text-[15px] font-medium">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `transition-colors pb-1 border-b-2 ${isActive
                    ? "text-clay border-clay"
                    : "text-cocoa/80 border-transparent hover:text-clay"
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-4 relative">
          <Link
            to="/cart"
            className="bg-clay hover:bg-clay/90 text-cream font-body font-semibold text-sm px-5 py-2.5 rounded-full transition-colors shadow-sm flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 shrink-0"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <span>Cart</span>
            {totalItems > 0 && (
              <span className="bg-white text-clay text-[11px] font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-cocoa text-cream flex items-center justify-center font-bold text-sm focus:outline-none hover:bg-clay transition-colors shadow-sm overflow-hidden"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                ) : (
                  getInitials(user.displayName)
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white border border-oat shadow-lg py-2 text-cocoa z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-oat/50">
                    <p className="font-semibold text-sm truncate">{user.displayName || "Valued Customer"}</p>
                    <p className="text-xs text-cocoa/50 truncate mt-0.5">{user.email}</p>
                  </div>
                  <Link
                    to="/my-orders"
                    onClick={() => setShowDropdown(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-cream/20 transition-colors text-left"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full block text-left px-4 py-2.5 text-sm hover:bg-cream/20 text-red-600 transition-colors border-t border-oat/50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="border border-cocoa/20 hover:border-clay hover:text-clay text-cocoa font-body font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2 text-cocoa"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-oat bg-cream px-6 py-4 animate-fadeIn">
          <ul className="flex flex-col gap-4 font-body font-medium text-cocoa">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => (isActive ? "text-clay" : "text-cocoa/80")}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 bg-clay text-cream font-semibold text-sm px-5 py-2.5 rounded-full mt-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 shrink-0"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                <span>Cart</span>
                {totalItems > 0 && (
                  <span className="bg-white text-clay text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {totalItems}
                  </span>
                )}
              </Link>
            </li>
            
            {user ? (
              <>
                <li className="border-t border-oat/50 pt-2 text-xs font-semibold text-cocoa/50">
                  Account: {user.displayName || user.email}
                </li>
                <li>
                  <Link
                    to="/my-orders"
                    onClick={() => setOpen(false)}
                    className="text-cocoa/80 hover:text-clay"
                  >
                    My Orders
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="inline-block border border-cocoa/20 text-cocoa font-semibold text-sm px-5 py-2 rounded-full mt-1"
                >
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
