import { useScrollReveal } from "@/hooks/useScrollReveal";
import { GlowCard } from "@/components/ui/spotlight-card";

const advisors = [
  {
    name: "Marcela Escobar",
    role: "Asesora Inmobiliaria",
    image: "/images/asesores/Marcela.png",
    description: "Experta en entender necesidades y convertirlas en decisiones seguras. Siempre con una sonrisa y soluciones prácticas.",
    whatsapp: "https://wa.me/56956654833?text=Hola%20Marcela,%20me%20comunico%20desde%20aliminspa.cl%20%F0%9F%91%8B",
  },
  {
    name: "Bárbara Arias",
    role: "Asesora Inmobiliaria",
    image: "/images/asesores/Barbara.png",
    description: "Energía contagiosa y enfoque profesional. Te entrega toda la información que necesitas para invertir con confianza.",
    whatsapp: "https://wa.me/56948775227?text=Hola%20B%C3%A1rbara,%20me%20comunico%20desde%20aliminspa.cl%20%F0%9F%91%8B",
  },
  {
    name: "Orlando Costa",
    role: "Asesor Inmobiliario",
    image: "/images/asesores/Orlando.png",
    description: "Cercano, claro y confiable. Te acompaña paso a paso para encontrar el terreno perfecto según tus metas.",
    whatsapp: "https://wa.me/56973077128?text=Hola%20Orlando,%20me%20comunico%20desde%20aliminspa.cl%20%F0%9F%91%8B",
  },
];

const AdvisorsSection = () => {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="py-12 sm:py-16 bg-alimin-green/30 backdrop-blur-sm">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="reveal inline-block text-[11px] font-semibold tracking-[0.25em] uppercase text-alimin-gold mb-4">
            Asesores Comerciales
          </span>
          <h2 className="reveal reveal-delay-1 text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Tu conexión <span className="text-alimin-gold">directa</span>
          </h2>
          <p className="reveal reveal-delay-2 text-white/70 max-w-xl mx-auto text-base">
            Profesionales dedicados a acompañarte en cada paso de tu inversión
          </p>
        </div>

        {/* Advisor cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {advisors.map((advisor, i) => (
            <div
              key={advisor.name}
              className={`reveal reveal-delay-${i + 1} group h-full`}
            >
              <GlowCard glowColor="green" customSize className="h-full">
                <div className="relative bg-white rounded-2xl overflow-hidden border border-alimin-gold/10 h-full flex flex-col">
                  {/* Image */}
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={advisor.image}
                      alt={advisor.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-alimin-green/40 via-transparent to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-6 lg:p-8 flex flex-col flex-1">
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-alimin-gold mb-2">
                      {advisor.role}
                    </span>
                    <h3 className="text-xl font-bold text-alimin-green-deep mb-3">{advisor.name}</h3>
                    <p className="text-alimin-green/70 text-sm leading-relaxed flex-1 mb-5">
                      {advisor.description}
                    </p>

                    {/* Compact WhatsApp CTA */}
                    <a
                      href={advisor.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-[14px] bg-alimin-green-deep text-white font-medium text-sm hover:bg-alimin-green hover:shadow-lg hover:shadow-alimin-green/20 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Hablar por WhatsApp
                    </a>
                  </div>
                </div>
              </GlowCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvisorsSection;
