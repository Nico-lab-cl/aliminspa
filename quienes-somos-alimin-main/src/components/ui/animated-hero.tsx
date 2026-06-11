import { motion } from "framer-motion";
import { FlipWords } from "./flip-words";

function AnimatedHero() {
  const words = ["Tu futuro", "una mejor vida", "un mejor camino"];

  const pillars = [
    { icon: "✦", title: "Cercanía real", desc: "Trato humano y personalizado" },
    { icon: "◉", title: "Transparencia", desc: "Claridad en cada paso" },
    { icon: "◈", title: "Visión de futuro", desc: "Inversiones sostenibles" },
  ];

  return (
    <div className="w-full">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col items-center text-center pt-28 pb-12 lg:pt-32 lg:pb-16">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-[11px] font-semibold tracking-[0.25em] uppercase text-alimin-gold mb-8">
              Nuestro Equipo
            </span>
          </motion.div>
          
          {/* Main title with FlipWords */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight text-white mb-6">
              Las personas detrás de cada terreno, cada decisión y{" "}
              <span className="text-alimin-gold">
                <FlipWords words={words} duration={3000} />
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base sm:text-lg md:text-xl leading-relaxed text-white/80 max-w-2xl mb-10"
          >
            En Alimin no solo desarrollamos proyectos. Acompañamos a familias e inversionistas 
            con cercanía, transparencia y visión de largo plazo en cada oportunidad del litoral.
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-24 h-[1px] bg-alimin-gold/40 mb-10"
          />

          {/* 3 Micro Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 max-w-3xl"
          >
            {pillars.map((pillar, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <span className="text-2xl text-alimin-gold mb-3 transition-transform duration-300 group-hover:scale-110">
                  {pillar.icon}
                </span>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {pillar.title}
                </h3>
                <p className="text-xs text-white/70">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { AnimatedHero };
