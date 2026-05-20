import Image from 'next/image';
import Link from 'next/link';
import { Globe, Map, Sunset, Trees } from 'lucide-react';
import styles from './page.module.css';

export const metadata = {
  title: 'AliminSPA | Enlaces',
  description: 'Conoce nuestros proyectos inmobiliarios: Lomas del Mar, Libertad y Alegría, Arena y Sol.',
};

const FacebookIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.6l.4-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const InstagramIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const LinkedinIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export default function LinkInBio() {
  const links = [
    {
      title: 'Página Web Oficial',
      url: '/',
      icon: <Globe size={20} />,
    },
    {
      title: 'Proyecto Lomas del Mar',
      url: '/proyectos/lomas-del-mar',
      icon: <Map size={20} />,
    },
    {
      title: 'Proyecto Libertad y Alegría',
      url: '/proyectos/libertad-y-alegria',
      icon: <Trees size={20} />,
    },
    {
      title: 'Proyecto Arena y Sol',
      url: '/proyectos/arena-y-sol',
      icon: <Sunset size={20} />,
    },
  ];

  const socials = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/inmobiliaria.alimin/',
      icon: <InstagramIcon size={22} />,
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/alimininmobiliaria/',
      icon: <FacebookIcon size={22} />,
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@alimininmobiliaria/shorts',
      icon: <YoutubeIcon size={22} />,
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/inmobiliaria-alimin',
      icon: <LinkedinIcon size={22} />,
    }
  ];

  const videos = [
    {
      title: 'Lomas del Mar',
      src: '/videos/lomas-del-mar/Lomas web optimized.mp4',
    },
    {
      title: 'Libertad y Alegría',
      src: '/videos/Hero-pagina-libertad-y-alegria.mp4',
    }
  ];

  return (
    <main className={styles.container}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />
      <header className={styles.profile}>
        <div className={styles.logoWrapper}>
          <Image
            src="/images/logo-alimin-color.webp"
            alt="AliminSPA Logo"
            width={100}
            height={100}
            className={styles.logo}
            priority
          />
        </div>
        <h1 className={styles.title}>AliminSPA</h1>
        <p className={styles.description}>
          Hacemos realidad tu sueño de la casa propia. Proyectos inmobiliarios en las mejores ubicaciones.
        </p>
      </header>

      <section className={styles.linksContainer}>
        {links.map((link) => (
          <Link key={link.url} href={link.url} className={styles.link}>
            {link.icon}
            <span>{link.title}</span>
          </Link>
        ))}
      </section>

      <section className={styles.socials}>
        {socials.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialIcon}
            aria-label={social.name}
          >
            {social.icon}
          </a>
        ))}
      </section>

      <section className={styles.videosSection}>
        <h2 className={styles.sectionTitle}>Nuestros Terrenos</h2>
        {videos.map((video) => (
          <div key={video.src} className={styles.videoCard}>
            <div className={styles.videoTitle}>{video.title}</div>
            <video 
              className={styles.video} 
              src={video.src} 
              autoPlay 
              muted 
              loop 
              playsInline
              controls
            />
          </div>
        ))}
      </section>
    </main>
  );
}
