import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE } from '@/lib/constants'
import { BLOG_POSTS } from '@/lib/blog-data'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import ArticleClient from './ArticleClient'

interface Props {
    params: Promise<{ slug: string }>;
}

// Generate static routes for all articles at build time
export async function generateStaticParams() {
    return BLOG_POSTS.map((post) => ({
        slug: post.slug,
    }))
}

// Generate metadata dynamically
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = BLOG_POSTS.find((p) => p.slug === slug)
    if (!post) return {}

    return {
        title: post.metaTitle,
        description: post.metaDescription,
        alternates: { canonical: `${SITE.url}/blog/${post.slug}` },
        openGraph: {
            title: post.metaTitle,
            description: post.metaDescription,
            url: `${SITE.url}/blog/${post.slug}`,
            siteName: SITE.name,
            type: 'article',
            publishedTime: post.date,
            authors: [post.author],
            images: [
                {
                    url: `${SITE.url}${post.coverImage}`,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                }
            ]
        }
    }
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = BLOG_POSTS.find((p) => p.slug === slug)
    if (!post) {
        notFound()
    }

    // BlogPosting Structured Schema for Google Rich Results
    const blogPostingSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: `${SITE.url}${post.coverImage}`,
        datePublished: post.date,
        dateModified: post.date,
        author: {
            '@type': 'Organization',
            name: SITE.name,
            url: SITE.url,
        },
        publisher: {
            '@type': 'Organization',
            name: SITE.name,
            logo: {
                '@type': 'ImageObject',
                url: `${SITE.url}/images/logo-alimin.webp`
            }
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE.url}/blog/${post.slug}`,
        }
    }

    return (
        <>
            {/* Breadcrumb Schema */}
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Blog', url: `${SITE.url}/blog` },
                    { name: post.title, url: `${SITE.url}/blog/${post.slug}` },
                ]}
            />
            {/* Article Structured Metadata */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
            />
            <ArticleClient post={post} />
        </>
    )
}
