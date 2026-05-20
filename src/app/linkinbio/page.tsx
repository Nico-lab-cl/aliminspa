import Image from 'next/image';
import Link from 'next/link';
import { Globe, Map, Sunset, Trees, Instagram, Facebook, Youtube } from 'lucide-react';
import styles from './page.module.css';

export const metadata = {
  title: 'AliminSPA | Enlaces',
  description: 'Conoce nuestros proyectos inmobiliarios: Lomas del Mar, Libertad y Alegría, Arena y Sol.',
};

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
      url: 'https://instagram.com/aliminspa',
      icon: <Instagram size={22} />,
    },
    {
      name: 'Facebook',
      url: 'https://facebook.com/aliminspa',
      icon: <Facebook size={22} />,
    },
    {
      name: 'YouTube',
      url: 'https://youtube.com/@aliminspa',
      icon: <Youtube size={22} />,
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
