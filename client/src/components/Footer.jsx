import { Link } from "react-router-dom";
import StitchDivider from "./StitchDivider.jsx";

export default function Footer() {
  return (
    <footer className="bg-cocoa text-cream/90">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center mb-3">
            <img
              src="/knotoria-logo.png"
              alt="Knotoria"
              className="h-[75px] w-auto object-contain brightness-0 invert"
            />
          </div>
          <p className="text-sm text-cream/65 max-w-xs">
            Every piece is looped, stitched, and finished by hand. No two are exactly alike.
          </p>
        </div>

        <div>
          <h4 className="font-body font-semibold text-cream mb-3 text-sm uppercase tracking-wide">
            Explore
          </h4>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><Link to="/" className="hover:text-apricot transition-colors">Home</Link></li>
            <li><Link to="/shop" className="hover:text-apricot transition-colors">Shop</Link></li>
            <li><Link to="/about" className="hover:text-apricot transition-colors">About</Link></li>
            <li><Link to="/contact" className="hover:text-apricot transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-body font-semibold text-cream mb-3 text-sm uppercase tracking-wide">
            Get in touch
          </h4>
          <p className="text-sm text-cream/70">hello@knotoria.shop</p>
          <p className="text-sm text-cream/70 mt-1">Karkala, Karnataka, India</p>
        </div>
      </div>

      <div className="border-t border-cream/10 py-5">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-cream/50">© {new Date().getFullYear()} Knotoria. Handmade with care.</p>
          <StitchDivider width={90} color="#E8A87C" />
        </div>
      </div>
    </footer>
  );
}
