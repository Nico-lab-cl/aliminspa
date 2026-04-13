import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const NewsletterCTA = () => {
  const ref = useScrollReveal();
  const [email, setEmail] = useState("");

  return (
    <section ref={ref} className="py-24 sm:py-32 bg-alimin-green-deep relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-alimin-green via-alimin-green-deep to-alimin-green-deep" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(43_50%_54%/0.08),transparent_50%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-alimin-gold/20 to-transparent" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Eyebrow */}
        <span className="reveal inline-block text-[11px] font-semibold tracking-[0.25em] uppercase text-alimin-gold mb-6">
          Newsletter
        </span>

        <h2 className="reveal reveal-delay-1 text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
          Recibe nuevas oportunidades antes que el resto
        </h2>
        <p className="reveal reveal-delay-2 text-white/80 text-lg sm:text-xl max-w-xl mx-auto mb-12">
          Déjanos tu correo y recibe novedades, proyectos y oportunidades seleccionadas del litoral central.
        </p>

        {/* Form */}
        <div className="reveal reveal-delay-3 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu correo electrónico"
            className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-alimin-gold focus:border-alimin-gold transition-all"
          />
          <button
            type="button"
            className="px-8 py-4 rounded-xl bg-alimin-gold text-alimin-green-deep font-semibold text-sm hover:bg-alimin-gold-light hover:shadow-lg hover:shadow-alimin-gold/30 transition-all duration-300 whitespace-nowrap"
          >
            Suscribirme
          </button>
        </div>

        <p className="reveal reveal-delay-4 mt-6 text-white/50 text-xs">
          Sin spam. Solo oportunidades reales. Puedes darte de baja en cualquier momento.
        </p>
      </div>
    </section>
  );
};

export default NewsletterCTA;
