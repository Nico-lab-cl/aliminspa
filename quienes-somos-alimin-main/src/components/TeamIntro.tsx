import { useScrollReveal } from "@/hooks/useScrollReveal";

const TeamIntro = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-alimin-cream-dark relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-alimin-gold/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-alimin-green/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <span className="reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-alimin-gold mb-4">
          Nuestro Equipo
        </span>

        <h2 className="reveal reveal-delay-1 text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
          Conoce a quienes hacen posible{" "}
          <span className="text-alimin-gold">cada proyecto</span>
        </h2>

        {/* Decorative separator */}
        <div className="reveal reveal-delay-2 flex items-center justify-center gap-3 my-8">
          <div className="w-12 h-px bg-alimin-gold/30" />
          <div className="w-2 h-2 rounded-full bg-alimin-gold/50" />
          <div className="w-12 h-px bg-alimin-gold/30" />
        </div>

        <p className="reveal reveal-delay-3 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
          Por eso queremos presentarte a quienes están detrás de cada terreno, cada llamada y cada decisión que te acompaña en tu camino de inversión. Detrás de cada proyecto hay personas reales, con historias, compromiso y pasión por lo que hacen.
        </p>
      </div>
    </section>
  );
};

export default TeamIntro;
