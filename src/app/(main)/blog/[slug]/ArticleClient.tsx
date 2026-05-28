'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, User, Share2, MessageCircle, Link as LinkIcon, ChevronRight } from 'lucide-react'
import { BlogPost, BLOG_POSTS } from '@/lib/blog-data'
import { SITE } from '@/lib/constants'
import styles from './article.module.css'

const Facebook = ({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
)

const Twitter = ({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
)

interface ArticleClientProps {
    post: BlogPost;
}

export default function ArticleClient({ post }: ArticleClientProps) {
    const [copied, setCopied] = useState(false)

    // Filter related posts (exclude current post, limit to 2)
    const relatedPosts = BLOG_POSTS
        .filter(p => p.id !== post.id)
        .slice(0, 2)

    const handleCopyLink = () => {
        if (typeof window === 'undefined') return
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
    }

    const shareUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''
    const shareText = encodeURIComponent(post.title)

    return (
        <main className={styles.articlePage}>
            {/* Header / Breadcrumb navigation */}
            <div className={styles.topBar}>
                <div className="container">
                    <div className={styles.breadcrumbRow}>
                        <Link href="/" className={styles.breadcrumbLink}>Inicio</Link>
                        <ChevronRight size={14} className={styles.breadcrumbSeparator} />
                        <Link href="/blog" className={styles.breadcrumbLink}>Blog</Link>
                        <ChevronRight size={14} className={styles.breadcrumbSeparator} />
                        <span className={`${styles.breadcrumbLink} ${styles.activeBreadcrumb}`}>{post.category}</span>
                    </div>
                    
                    <Link href="/blog" className={styles.backButton}>
                        <ArrowLeft size={16} /> Volver al Blog
                    </Link>
                </div>
            </div>

            {/* Article Container */}
            <article className={styles.articleContainer}>
                <div className="container">
                    <header className={styles.articleHeader}>
                        <span className={styles.categoryBadge}>{post.category}</span>
                        <h1 className={styles.articleTitle}>{post.title}</h1>
                        
                        <div className={styles.metaRow}>
                            <div className={styles.metaAuthor}>
                                <div className={styles.authorAvatar}>
                                    {post.author[0]}
                                </div>
                                <div className={styles.authorInfo}>
                                    <span className={styles.authorLabel}>Escrito por</span>
                                    <span className={styles.authorName}>{post.author}</span>
                                </div>
                            </div>
                            
                            <div className={styles.metaDetails}>
                                <span className={styles.metaDetailItem}>
                                    <Calendar size={15} />
                                    {new Date(post.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                                <span className={styles.metaDetailItem}>
                                    <Clock size={15} />
                                    {post.readTime}
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* Cover Image */}
                    <div className={styles.coverImageWrapper}>
                        <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            sizes="100vw"
                            className={styles.coverImage}
                            priority
                        />
                    </div>

                    <div className={styles.articleGrid}>
                        {/* Article Content */}
                        <div className={styles.mainContent}>
                            <div 
                                className={styles.articleBody}
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                            
                            {/* Share & tags section */}
                            <footer className={styles.articleFooter}>
                                <div className={styles.tagsContainer}>
                                    {post.tags.map((tag) => (
                                        <span key={tag} className={styles.tagBadge}>#{tag}</span>
                                    ))}
                                </div>
                                
                                <div className={styles.shareContainer}>
                                    <span className={styles.shareLabel}>Compartir artículo:</span>
                                    <div className={styles.shareButtons}>
                                        <a
                                            href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${styles.shareButton} ${styles.shareWhatsapp}`}
                                            aria-label="Compartir en WhatsApp"
                                        >
                                            <MessageCircle size={18} />
                                        </a>
                                        <a
                                            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${styles.shareButton} ${styles.shareFacebook}`}
                                            aria-label="Compartir en Facebook"
                                        >
                                            <Facebook size={18} />
                                        </a>
                                        <a
                                            href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${styles.shareButton} ${styles.shareTwitter}`}
                                            aria-label="Compartir en Twitter"
                                        >
                                            <Twitter size={18} />
                                        </a>
                                        <button
                                            onClick={handleCopyLink}
                                            className={`${styles.shareButton} ${styles.shareLink}`}
                                            aria-label="Copiar enlace"
                                        >
                                            <LinkIcon size={18} />
                                        </button>
                                    </div>
                                    {copied && <span className={styles.copiedMessage}>¡Enlace copiado!</span>}
                                </div>
                            </footer>

                            {/* Direct Call to Action Block */}
                            <section className={styles.ctaBlock}>
                                <h3 className={styles.ctaTitle}>¿Buscas comprar terrenos en El Tabo de forma legal y segura?</h3>
                                <p className={styles.ctaDesc}>
                                    Todos nuestros proyectos cuentan con Rol Propio individual, factibilidad de luz y agua certificada por la Seremi de Salud. Te brindamos asesoría legal gratuita en todo el proceso.
                                </p>
                                <div className={styles.ctaActions}>
                                    <a
                                        href={`https://wa.me/${SITE.whatsapp}?text=Hola,%20vengo%20del%20blog%20de%20Alimin%20y%20necesito%20m%C3%A1s%20informaci%C3%B3n%20sobre%20los%20terrenos`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-whatsapp"
                                    >
                                        <MessageCircle size={18} /> Hablar con un Asesor
                                    </a>
                                    <Link href="/proyectos" className="btn btn-secondary">
                                        Explorar Proyectos
                                    </Link>
                                </div>
                            </section>
                        </div>

                        {/* Sidebar */}
                        <aside className={styles.sidebar}>
                            <div className={styles.sidebarWidget}>
                                <h4 className={styles.widgetTitle}>Asesoría Gratuita</h4>
                                <p className={styles.widgetText}>
                                    ¿Te quedaron dudas legales sobre el Rol Propio o la subdivisión de parcelas en El Tabo? Conversa directamente con nuestro equipo legal por WhatsApp.
                                </p>
                                <a
                                    href={`https://wa.me/${SITE.whatsapp}?text=Hola,%20tengo%20dudas%20legales%20sobre%20compra%20de%20terrenos`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.sidebarButton} btn btn-primary`}
                                >
                                    Consúltanos aquí
                                </a>
                            </div>

                            <div className={styles.sidebarWidget}>
                                <h4 className={styles.widgetTitle}>Nuestros Proyectos</h4>
                                <div className={styles.sidebarProjects}>
                                    <div className={styles.sidebarProjectCard}>
                                        <h5 className={styles.sidebarProjectName}>Lomas del Mar</h5>
                                        <span className={styles.sidebarProjectLabel}>Desde $26.000.000 (Contado)</span>
                                        <Link href="/proyectos/lomas-del-mar" className={styles.sidebarProjectLink}>
                                            Ver detalles <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                    <div className={styles.sidebarProjectCard}>
                                        <h5 className={styles.sidebarProjectName}>Arena y Sol</h5>
                                        <span className={styles.sidebarProjectLabel}>Desde $39.000.000 (Contado)</span>
                                        <Link href="/proyectos/arena-y-sol" className={styles.sidebarProjectLink}>
                                            Ver detalles <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </article>

            {/* Related Articles Grid */}
            {relatedPosts.length > 0 && (
                <section className={styles.relatedSection}>
                    <div className="container">
                        <h3 className={styles.relatedTitle}>Te podría interesar</h3>
                        <div className={styles.relatedGrid}>
                            {relatedPosts.map((rPost) => (
                                <article key={rPost.id} className={styles.relatedCard}>
                                    <Link href={`/blog/${rPost.slug}`} className={styles.relatedCardImgLink}>
                                        <div className={styles.relatedCardImgWrapper}>
                                            <Image
                                                src={rPost.coverImage}
                                                alt={rPost.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                className={styles.relatedCardImg}
                                            />
                                        </div>
                                    </Link>
                                    <div className={styles.relatedCardContent}>
                                        <span className={styles.relatedCardCategory}>{rPost.category}</span>
                                        <h4 className={styles.relatedCardTitle}>
                                            <Link href={`/blog/${rPost.slug}`}>{rPost.title}</Link>
                                        </h4>
                                        <Link href={`/blog/${rPost.slug}`} className={styles.relatedCardLinkBtn}>
                                            Leer artículo <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </main>
    )
}
