'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Calendar, Clock, User, ArrowRight, BookOpen, SearchSlash, Mail } from 'lucide-react'
import { BLOG_POSTS, BLOG_CATEGORIES, BlogPost } from '@/lib/blog-data'
import styles from './blog.module.css'

export default function BlogClient() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('Todo')
    const [email, setEmail] = useState('')
    const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')


    // Find the featured post (e.g., the first post)
    const featuredPost = useMemo(() => {
        return BLOG_POSTS[0]
    }, [])

    // Filter posts
    const filteredPosts = useMemo(() => {
        return BLOG_POSTS.filter(post => {
            const matchesCategory = selectedCategory === 'Todo' || post.category === selectedCategory
            const matchesSearch = searchQuery === '' || 
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.content.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesCategory && matchesSearch
        })
    }, [searchQuery, selectedCategory])

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubscribeStatus('loading')
        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            if (!res.ok) throw new Error('Subscription failed')
            setSubscribeStatus('success')
            setEmail('')
        } catch {
            setSubscribeStatus('error')
            setTimeout(() => setSubscribeStatus('idle'), 4000)
        }
    }

    return (
        <main className={styles.blogPage}>
            {/* Header / Hero Introduction */}
            <section className={styles.heroSection}>
                <div className={styles.heroGlowContainer}>
                    <div className={styles.glowSphere1}></div>
                    <div className={styles.glowSphere2}></div>
                </div>
                <div className="container">
                    <div className={styles.heroContent}>
                        <span className={styles.heroLabel}>Blog Inmobiliario</span>
                        <h1 className={styles.heroTitle}>Aprende a invertir en el <span>Litoral Central</span></h1>
                        <p className={styles.heroSubtitle}>
                            Guías legales, análisis de plusvalía y consejos prácticos para comprar parcelas y terrenos con total seguridad.
                        </p>
                    </div>
                </div>
            </section>

            {/* Featured Post Hero */}
            {featuredPost && searchQuery === '' && selectedCategory === 'Todo' && (
                <section className={styles.featuredSection}>
                    <div className="container">
                        <h2 className={styles.subSectionTitle}>Artículo Destacado</h2>
                        <Link href={`/blog/${featuredPost.slug}`} className={styles.featuredCardLink}>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className={styles.featuredCard}
                            >
                                <div className={styles.featuredImgWrapper}>
                                    <Image 
                                        src={featuredPost.coverImage} 
                                        alt={featuredPost.title} 
                                        fill
                                        sizes="(max-width: 992px) 100vw, 50vw"
                                        className={styles.featuredImg}
                                        priority
                                    />
                                </div>
                                <div className={styles.featuredInfo}>
                                    <span className={styles.categoryBadge}>{featuredPost.category}</span>
                                    <h3 className={styles.featuredTitle}>{featuredPost.title}</h3>
                                    <p className={styles.featuredExcerpt}>{featuredPost.excerpt}</p>
                                    
                                    <div className={styles.metaRow}>
                                        <span className={styles.metaItem}>
                                            <Calendar size={14} />
                                            {new Date(featuredPost.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className={styles.metaItem}>
                                            <Clock size={14} />
                                            {featuredPost.readTime}
                                        </span>
                                        <span className={styles.metaItem}>
                                            <User size={14} />
                                            {featuredPost.author}
                                        </span>
                                    </div>
                                    
                                    <span className={styles.featuredCta}>
                                        Leer Artículo Completo <ArrowRight size={16} />
                                    </span>
                                </div>
                            </motion.div>
                        </Link>
                    </div>
                </section>
            )}

            {/* Search and Categories Toolbar */}
            <section className={styles.toolbarSection}>
                <div className="container">
                    <div className={styles.toolbarGrid}>
                        {/* Categories List */}
                        <div className={styles.categoriesWrapper}>
                            {BLOG_CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.activeCategory : ''}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className={styles.searchWrapper}>
                            <Search className={styles.searchIcon} size={18} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Buscar artículos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Articles Grid */}
            <section className={styles.gridSection}>
                <div className="container">
                    <AnimatePresence mode="wait">
                        {filteredPosts.length > 0 ? (
                            <motion.div 
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={styles.postsGrid}
                            >
                                {filteredPosts.map((post) => (
                                    <motion.article 
                                        layout
                                        key={post.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.4 }}
                                        className={styles.postCard}
                                    >
                                        <Link href={`/blog/${post.slug}`} className={styles.cardImgLink}>
                                            <div className={styles.cardImgWrapper}>
                                                <Image 
                                                    src={post.coverImage} 
                                                    alt={post.title} 
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    className={styles.cardImg}
                                                />
                                            </div>
                                        </Link>
                                        <div className={styles.cardContent}>
                                            <div className={styles.cardHeader}>
                                                <span className={styles.cardCategory}>{post.category}</span>
                                                <span className={styles.cardReadTime}>
                                                    <Clock size={12} /> {post.readTime}
                                                </span>
                                            </div>
                                            <h3 className={styles.cardTitle}>
                                                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                                            </h3>
                                            <p className={styles.cardExcerpt}>{post.excerpt}</p>
                                            
                                            <div className={styles.cardFooter}>
                                                <div className={styles.cardAuthor}>
                                                    <User size={12} />
                                                    <span>{post.author}</span>
                                                </div>
                                                <Link href={`/blog/${post.slug}`} className={styles.readMoreLink}>
                                                    Leer más <ArrowRight size={14} />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.article>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={styles.noResults}
                            >
                                <SearchSlash size={48} className={styles.noResultsIcon} />
                                <h3>No encontramos artículos</h3>
                                <p>Prueba buscando con palabras clave diferentes o cambia de categoría.</p>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => { setSearchQuery(''); setSelectedCategory('Todo'); }}
                                >
                                    Limpiar filtros
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* Newsletter Subscription Box */}
            <section className={styles.newsletterSection}>
                <div className="container">
                    <div className={styles.newsletterCard}>
                        <div className={styles.newsletterInfo}>
                            <div className={styles.newsletterIconWrapper}>
                                <Mail size={24} />
                            </div>
                            <h3 className={styles.newsletterTitle}>Suscríbete a nuestra guía de inversión</h3>
                            <p className={styles.newsletterDesc}>
                                Recibe directamente en tu correo las últimas guías legales, análisis de plusvalía y ofertas exclusivas de parcelas en El Tabo.
                            </p>
                        </div>
                        <form className={styles.newsletterForm} onSubmit={handleSubscribe}>
                            <input
                                type="email"
                                placeholder="Tu correo electrónico"
                                className={styles.newsletterInput}
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={subscribeStatus === 'loading'}
                            />
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={subscribeStatus === 'loading'}
                            >
                                {subscribeStatus === 'loading' ? 'Suscribiendo...' : 'Suscribirme'}
                            </button>
                            
                            {subscribeStatus === 'success' && (
                                <p className={styles.subscribeSuccess}>
                                    🎉 ¡Suscripción exitosa! Mantente atento a tu bandeja de entrada.
                                </p>
                            )}
                            {subscribeStatus === 'error' && (
                                <p className={styles.subscribeError}>
                                    ❌ Hubo un problema al procesar tu suscripción. Intenta nuevamente.
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </section>
        </main>
    )
}
