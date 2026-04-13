import { useScrollReveal } from "@/hooks/useScrollReveal";
import { LeaderGlassCard } from "@/components/ui/leader-glass-card";

const directors = [
  {
    name: "Patricio Escobar",
    role: "CEO",
    image: "/images/lideres/Patricio Escobar.png",
    description: "Estratega y motor del crecimiento. Impulsa decisiones clave con visión enfocada en resultados sostenibles.",
  },
  {
    name: "Marcela López",
    role: "CEO",
    image: "/images/lideres/Marcela Lopez.png",
    description: "Lidera con energía y pasión por el desarrollo territorial responsable. Acerca oportunidades reales a personas reales.",
  },
];

const DirectionSection = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="py-12 sm:py-16 bg-alimin-green/30 backdrop-blur-sm relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-alimin-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-alimin-green/5 rounded-full blur-3xl" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        {/* Transition text */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-white/60 text-lg leading-relaxed italic">
            "Detrás de cada proyecto hay dirección, visión y personas comprometidas con hacer las cosas bien."
          </p>
        </div>

        {/* Section header */}
        <div className="text-center mb-10">
          <span className="reveal inline-block text-[11px] font-semibold tracking-[0.25em] uppercase text-alimin-gold/80 mb-4">
            Dirección
          </span>
          <h2 className="reveal reveal-delay-1 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Liderazgo con <span className="text-alimin-gold">visión</span>
          </h2>
        </div>

        {/* Director cards with glassmorphism */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
          {directors.map((director) => (
            <LeaderGlassCard
              key={director.name}
              name={director.name}
              role={director.role}
              description={director.description}
              image={director.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DirectionSection;
