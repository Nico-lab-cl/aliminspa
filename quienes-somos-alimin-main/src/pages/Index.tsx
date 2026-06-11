import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MisionVision from "@/components/MisionVision";
import DirectionSection from "@/components/DirectionSection";
import AdvisorsSection from "@/components/AdvisorsSection";
import NewsletterCTA from "@/components/NewsletterCTA";
import Footer from "@/components/Footer";
import { AuroraBackground } from "@/components/ui/aurora-background";

const Index = () => {
  return (
    <AuroraBackground className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <MisionVision />
        <DirectionSection />
        <AdvisorsSection />
        <NewsletterCTA />
      </main>
      <Footer />
    </AuroraBackground>
  );
};

export default Index;
