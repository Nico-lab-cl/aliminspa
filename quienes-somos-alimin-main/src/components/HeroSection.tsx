import { AnimatedHero } from "@/components/ui/animated-hero";

const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] sm:min-h-[85vh] flex items-start justify-center overflow-hidden">
      {/* Semi-transparent background to show aurora */}
      <div className="absolute inset-0 bg-white/10" />

      <div className="relative z-10 w-full">
        <AnimatedHero />
      </div>
    </section>
  );
};

export default HeroSection;
