import { useState, useEffect } from "react";

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Proyectos", href: "/#proyectos" },
  { label: "Beneficios", href: "/#beneficios" },
  { label: "Ubicación", href: "/#ubicacion" },
  { label: "Quiénes Somos", href: "/quienes-somos" },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Handle scroll and body lock
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      // Close mobile menu when scrolling significantly
      if (menuOpen && window.scrollY > 10) {
        setMenuOpen(false);
      }
    };
    
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [menuOpen]);

  return (
    <>
      {/* Desktop Header - Unchanged */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b hidden lg:block ${
          scrolled
            ? "bg-alimin-green/90 backdrop-blur-md border-alimin-gold/10 shadow-sm"
            : "bg-alimin-green/80 backdrop-blur-sm border-transparent"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-[76px] flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center group">
            <img
              src="https://aliminspa.cl/images/home_redesign/logo.png.webp"
              alt="Alimin Inmobiliaria"
              className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </a>

          {/* Desktop Nav */}
          <nav className="flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-alimin-gold after:transition-all after:duration-300 hover:after:w-full ${
                  link.label === "Quiénes Somos"
                    ? "text-alimin-gold"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/contacto"
              className="ml-2 px-5 py-2 text-sm font-semibold rounded-full bg-alimin-green-deep text-white hover:bg-alimin-green-light transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Contacto
            </a>
          </nav>
        </div>
      </header>

      {/* Mobile Header - Premium Redesign */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[100]">
        {/* Mobile Header Bar - Solid Background */}
        <div 
          className={`relative transition-all duration-300 ${
            menuOpen 
              ? "bg-alimin-green-deep" 
              : scrolled 
                ? "bg-alimin-green shadow-lg" 
                : "bg-alimin-green"
          }`}
        >
          <div className="h-[64px] px-4 flex items-center justify-between">
            {/* Mobile Logo */}
            <a href="/" className="flex items-center">
              <img
                src="https://aliminspa.cl/images/home_redesign/logo.png.webp"
                alt="Alimin Inmobiliaria"
                className="h-9 w-auto"
              />
            </a>

            {/* Mobile Menu Button - Premium Styled */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 ${
                menuOpen 
                  ? "bg-white/15 text-alimin-gold" 
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <div className="w-5 flex flex-col gap-[5px]">
                <span 
                  className={`block h-[2px] bg-current rounded-full transition-all duration-300 origin-center ${
                    menuOpen ? "rotate-45 translate-y-[7px]" : ""
                  }`} 
                />
                <span 
                  className={`block h-[2px] bg-current rounded-full transition-all duration-300 ${
                    menuOpen ? "opacity-0 scale-x-0" : ""
                  }`} 
                />
                <span 
                  className={`block h-[2px] bg-current rounded-full transition-all duration-300 origin-center ${
                    menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
                  }`} 
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu - Premium Full Screen Drawer */}
        <div
          className={`fixed inset-0 top-[64px] bg-alimin-green-deep transition-all duration-500 ease-out ${
            menuOpen 
              ? "opacity-100 visible" 
              : "opacity-0 invisible pointer-events-none"
          }`}
          style={{ height: "calc(100vh - 64px)" }}
        >
          {/* Solid Background Layer */}
          <div className="absolute inset-0 bg-alimin-green-deep" />
          
          {/* Decorative gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-alimin-gold/30 to-transparent" />
          
          {/* Menu Content Container */}
          <nav className="relative h-full flex flex-col px-5 py-6 overflow-y-auto">
            {/* Navigation Links Section */}
            <div className="flex-1 flex flex-col pt-4">
              {navLinks.map((link, index) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`group flex items-center justify-between py-4 border-b border-white/10 transition-all duration-300 ${
                    index === 0 ? "border-t" : ""
                  }`}
                  style={{ 
                    animationDelay: `${index * 75}ms`,
                    opacity: menuOpen ? 1 : 0,
                    transform: menuOpen ? "translateY(0)" : "translateY(10px)",
                    transition: `all 0.4s ease-out ${index * 75}ms`
                  }}
                >
                  <span 
                    className={`text-lg font-medium transition-colors duration-300 ${
                      link.label === "Quiénes Somos"
                        ? "text-alimin-gold"
                        : "text-white group-hover:text-alimin-gold"
                    }`}
                  >
                    {link.label}
                  </span>
                  <svg 
                    className={`w-5 h-5 transition-all duration-300 ${
                      link.label === "Quiénes Somos"
                        ? "text-alimin-gold"
                        : "text-white/30 group-hover:text-alimin-gold group-hover:translate-x-1"
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
            
            {/* Contact CTA Section - Fixed at bottom */}
            <div className="pt-6 pb-8">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <p className="text-white/60 text-sm mb-4 text-center">
                  ¿Listo para encontrar tu terreno ideal?
                </p>
                <a
                  href="/contacto"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 text-base font-semibold rounded-xl bg-alimin-gold text-alimin-green-deep hover:bg-alimin-gold-light active:scale-[0.98] transition-all duration-300 shadow-lg shadow-alimin-gold/20"
                >
                  <span>Hablemos</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </a>
              </div>
              
              {/* Footer text */}
              <p className="mt-4 text-center text-white/30 text-xs">
                Alimin Inmobiliaria © 2025
              </p>
            </div>
          </nav>
        </div>

        {/* Overlay Backdrop - Darkens content behind menu */}
        <div 
          className={`fixed inset-0 top-[64px] bg-black/60 backdrop-blur-sm transition-opacity duration-500 lg:hidden ${
            menuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
          }`}
          style={{ zIndex: -1 }}
          onClick={() => setMenuOpen(false)}
        />
      </header>

      {/* Spacer for fixed header on mobile */}
      <div className="lg:hidden h-[64px]" />
    </>
  );
};

export default Header;
