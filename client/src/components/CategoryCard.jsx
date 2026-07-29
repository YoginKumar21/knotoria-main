import { Link } from "react-router-dom";

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/shop?category=${category.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-oat hover:shadow-lg transition-shadow duration-300"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={category.image_url}
          alt={category.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-5 text-center">
        <h3 className="font-display text-xl font-semibold text-cocoa">{category.name}</h3>
        <p className="text-sm text-cocoa/60 mt-1">{category.description}</p>
      </div>
    </Link>
  );
}
