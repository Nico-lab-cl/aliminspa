import { useScrollReveal } from "@/hooks/useScrollReveal";
import { GlowCard } from "@/components/ui/spotlight-card";

const cards = [
  {
    title: "Misión",
    text: "Ayudamos a las familias y emprendedores a acceder a bienes raíces urbanizados y asequibles, facilitando espacios para vivir, invertir y crecer. Nuestro compromiso es entregar soluciones rentables, seguras y con impacto a largo plazo.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    title: "Visión",
    text: "Convertirnos en la inmobiliaria referente en Chile para terrenos urbanizados, reconocida por nuestra transparencia, innovación y cercanía con el cliente, generando comunidades sostenibles y accesibles para todos.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Compromiso",
    text: "Cada proyecto que emprendemos lleva nuestra firma de honestidad, dedicación y responsabilidad. Nos comprometemos a ser transparentes en cada etapa, desde el primer contacto hasta la entrega final.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

const MisionVision = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="py-12 sm:py-16 bg-alimin-green/30 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="reveal inline-block text-xs font-semibold tracking-[0.2em] uppercase text-alimin-gold mb-3">
            Nuestros Pilares
          </span>
          <h2 className="reveal reveal-delay-1 text-3xl sm:text-4xl font-bold text-foreground">
            Lo que nos <span className="text-alimin-gold">define</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, i) => (
            <div
              key={card.title}
              className={`reveal ${i === 1 ? "reveal-delay-2" : i === 2 ? "reveal-delay-3" : "reveal-delay-1"} group h-full`}
            >
              <GlowCard glowColor="green" customSize className="h-full">
                <div className="relative bg-white rounded-2xl p-10 lg:p-12 border border-alimin-gold/10 h-full flex flex-col">
                  {/* Gold accent line top */}
                  <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-alimin-gold/60 to-transparent rounded-full" />

                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-alimin-green/10 flex items-center justify-center text-alimin-gold mb-8 group-hover:bg-alimin-gold/10 transition-colors duration-300">
                    {card.icon}
                  </div>

                  <h3 className="text-xl font-bold text-alimin-green-deep mb-4">{card.title}</h3>
                  <p className="text-alimin-green/70 leading-[1.7] text-[15px] flex-1">{card.text}</p>
                </div>
              </GlowCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MisionVision;
