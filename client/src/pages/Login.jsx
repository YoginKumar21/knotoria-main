import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";
import StitchDivider from "../components/StitchDivider";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to checkout if they came from cart, otherwise home
  const from = location.state?.from?.pathname || "/";

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 md:py-12 bg-cream/20">
      <div className="bg-white border border-oat rounded-3xl w-full max-w-lg shadow-md overflow-hidden relative p-6 sm:p-8 md:p-12 transition-all">
        
        {/* Soft decorative circles matching the cozy aesthetic */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-clay/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-sage/5 rounded-full pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <span className="text-xs uppercase tracking-wider font-semibold text-clay bg-clay/10 px-3.5 py-1 rounded-full">
            {isSignUp ? "Join Knotoria Family" : "Welcome Back Friend"}
          </span>
          <h1 className="font-display text-3xl font-bold text-cocoa mt-4 mb-2">
            {isSignUp ? "Create an Account" : "Sign In to Your Space"}
          </h1>
          <p className="text-cocoa/60 text-sm">
            {isSignUp 
              ? "Start saving your handmade favorites and tracking orders." 
              : "Access your personalized companions, cart, and order history."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-2 animate-shake">
            <span className="text-lg">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cocoa/70 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your lovely name"
                className="w-full px-5 py-3 rounded-2xl border border-oat bg-cream/10 text-cocoa placeholder-cocoa/30 focus:outline-none focus:border-clay focus:bg-white transition-all text-sm"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cocoa/70 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-5 py-3 rounded-2xl border border-oat bg-cream/10 text-cocoa placeholder-cocoa/30 focus:outline-none focus:border-clay focus:bg-white transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cocoa/70 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-3 rounded-2xl border border-oat bg-cream/10 text-cocoa placeholder-cocoa/30 focus:outline-none focus:border-clay focus:bg-white transition-all text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-6 rounded-2xl bg-cocoa text-cream font-semibold hover:bg-clay hover:text-white disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              "Sign Up"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="relative my-8 flex items-center justify-center z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-oat"></div>
          </div>
          <span className="relative px-4 text-xs uppercase tracking-wider text-cocoa/40 bg-white font-medium">
            or continue with
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl border border-oat bg-white hover:bg-cream/20 text-cocoa font-semibold text-sm transition-all flex items-center justify-center gap-3 shadow-xs z-10 relative"
        >
          {/* Flat Google logo */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google Account
        </button>

        <div className="mt-8 text-center text-sm text-cocoa/70 relative z-10">
          {isSignUp ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="font-bold text-clay hover:underline ml-1"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New to Knotoria?{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="font-bold text-clay hover:underline ml-1"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
