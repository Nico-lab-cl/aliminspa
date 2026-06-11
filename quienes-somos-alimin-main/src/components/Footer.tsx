const footerLinks = [
  {
    title: "Navegación",
    links: [
      { label: "Inicio", href: "/" },
      { label: "Proyectos", href: "/#proyectos" },
      { label: "Beneficios", href: "/#beneficios" },
      { label: "Ubicación", href: "/#ubicacion" },
      { label: "Quiénes Somos", href: "/quienes-somos" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Política de Privacidad", href: "/politica-de-privacidad" },
      { label: "Términos del Servicio", href: "/terminos-del-servicio" },
    ],
  },
  {
    title: "Contacto",
    links: [
      { label: "WhatsApp", href: "https://wa.me/56956654833" },
      { label: "bienesraices@aliminspa.cl", href: "mailto:bienesraices@aliminspa.cl" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-alimin-green-deep text-white/70">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Main footer */}
        <div className="py-16 sm:py-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <a href="/" className="inline-block mb-6">
              <img
                src="https://aliminspa.cl/images/home_redesign/logo.png.webp"
                alt="Alimin Inmobiliaria"
                className="h-10 w-auto opacity-90"
              />
            </a>
            <p className="text-sm leading-relaxed text-white/50 mb-6">
              Inmobiliaria chilena enfocada en terrenos urbanizados en el Litoral Central.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {[
                { name: "instagram", href: "https://www.instagram.com/inmobiliaria.alimin/" },
                { name: "facebook", href: "https://www.facebook.com/alimininmobiliaria/" },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-alimin-gold hover:border-alimin-gold/30 hover:bg-alimin-gold/5 transition-all duration-300"
                  aria-label={social.name}
                >
                  {social.name === "instagram" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold text-white/90 uppercase tracking-[0.2em] mb-5">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/50 hover:text-alimin-gold transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © 2026 Alimin Inmobiliaria. Todos los derechos reservados.
          </p>
          <p className="text-xs text-alimin-cream/30">
            El Tabo, Región de Valparaíso, Chile
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
