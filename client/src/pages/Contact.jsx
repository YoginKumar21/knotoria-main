import { useState } from "react";
import StitchDivider from "../components/StitchDivider.jsx";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // No backend endpoint for contact messages yet — this just confirms receipt in the UI.
    setSubmitted(true);
  }

  return (
    <section className="bg-apricot/25">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-20 grid md:grid-cols-2 gap-8 md:gap-12 items-start">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-cocoa">Get in Touch</h1>
          <div className="my-4">
            <StitchDivider width={110} />
          </div>
          <p className="text-cocoa/70 max-w-sm mb-6 md:mb-0">
            Questions about an order, custom requests, or just want to say hi? Send a message
            and we'll get back to you soon.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-oat p-6 md:p-7">
          {submitted ? (
            <div className="text-center py-10">
              <p className="font-display text-xl font-semibold text-clay mb-2">
                Message sent!
              </p>
              <p className="text-cocoa/65 text-sm">We'll write back as soon as we can.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full border border-oat rounded-lg px-4 py-3 text-sm focus:border-clay outline-none min-h-[44px]"
                />
                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Your email"
                  className="w-full border border-oat rounded-lg px-4 py-3 text-sm focus:border-clay outline-none min-h-[44px]"
                />
              </div>
              <textarea
                required
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Your message"
                rows={5}
                className="w-full border border-oat rounded-lg px-4 py-3 text-sm focus:border-clay outline-none resize-none min-h-[120px]"
              />
              <button
                type="submit"
                className="w-full sm:w-auto bg-sage hover:bg-sage/85 text-cream font-semibold px-7 py-3 rounded-full transition-colors min-h-[44px]"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
