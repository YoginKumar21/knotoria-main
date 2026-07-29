import StitchDivider from "../components/StitchDivider.jsx";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-16">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-cocoa">Our Story</h1>
        <div className="flex justify-center my-4">
          <StitchDivider width={100} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center mb-12 md:mb-16">
        <img
          src="https://images.unsplash.com/photo-1591561582301-7ce6588cc286?w=700&q=80"
          alt="A handmade crochet bunny sitting beside balls of yarn"
          className="rounded-2xl shadow-md w-full aspect-square object-cover"
        />
        <div>
          <h2 className="font-display text-xl md:text-2xl font-semibold text-cocoa mb-3">
            Started with one hook and too much yarn
          </h2>
          <p className="text-cocoa/70 leading-relaxed mb-4">
            Knotoria began the way most craft obsessions do: with a single skein of yarn and a
            promise to "just try one pattern." That one pattern turned into a basket of
            amigurumi, then a closet of scarves, then a small shop full of pieces made for
            people who like things a little imperfect, a little warm, and entirely handmade.
          </p>
          <p className="text-cocoa/70 leading-relaxed">
            Every item here is stitched by hand, which means no two pieces are ever quite
            identical, and that's exactly the point.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 text-center">
        {[
          { title: "Hand-stitched", desc: "Every loop made by hand, no machines involved." },
          { title: "Small batches", desc: "We make in limited runs, so stock changes often." },
          { title: "Built to last", desc: "Sturdy cotton and acrylic yarns chosen for durability." },
        ].map((item) => (
          <div key={item.title} className="bg-white border border-oat rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold text-clay mb-2">{item.title}</h3>
            <p className="text-sm text-cocoa/65">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
