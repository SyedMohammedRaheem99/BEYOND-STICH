import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPosts, BLOG_CATEGORIES } from '@/lib/blog';
import { SEGMENTS } from '@/lib/constants';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import styles from './page.module.css';

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found | Beyond Stich' };
  return {
    title: `${post.title} | Beyond Stich Blog`,
    description: post.excerpt,
    keywords: post.keywords,
    alternates: { canonical: `https://beyondstich.com/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  };
}

function renderBody(body, styles) {
  const paragraphs = body.split('\n\n');
  return paragraphs.map((para, i) => {
    // Convert markdown-style links [text](url) to link elements
    const parts = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(para)) !== null) {
      // Text before the link
      if (match.index > lastIndex) {
        parts.push(para.slice(lastIndex, match.index));
      }
      // The link itself
      parts.push(
        <Link key={`${i}-${match.index}`} href={match[2]}>
          {match[1]}
        </Link>
      );
      lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < para.length) {
      parts.push(para.slice(lastIndex));
    }

    // Check if it looks like a heading (starts with a number and period, or is short and bold-like)
    const isListItem = /^\d+\.\s/.test(para.trim());

    return (
      <p key={i} className={isListItem ? styles.listItem : undefined}>
        {parts.length > 0 ? parts : para}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const cat = BLOG_CATEGORIES[post.category] || { label: post.category, color: '#888' };

  const linkedSegmentData = (post.linkedSegments || [])
    .map(id => SEGMENTS.find(s => s.id === id))
    .filter(Boolean);

  // These guides are the store's top-of-funnel content, but carried no
  // structured data at all — so no author/date rich results and no article
  // carousel eligibility, which is most of the reason to publish them.
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.author || 'Beyond Stich',
      url: 'https://beyondstich.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Beyond Stich',
      logo: {
        '@type': 'ImageObject',
        url: 'https://beyondstich.com/logos/icon-512.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://beyondstich.com/blog/${post.slug}`,
    },
    image: 'https://beyondstich.com/banners/og/og-default.jpg',
    articleSection: cat.label,
    inLanguage: 'en-IN',
  };

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Journal', url: '/blog' },
          { name: post.title },
        ]}
      />
      <article className={styles.article}>
        <nav className={styles.breadcrumb}>
          <Link href="/">HOME</Link>
          <span>/</span>
          <Link href="/blog">BLOG</Link>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{post.title.toUpperCase()}</span>
        </nav>

        <span
          className={styles.categoryBadge}
          style={{ color: cat.color, backgroundColor: `${cat.color}15` }}
        >
          {cat.label}
        </span>

        <h1 className={styles.title}>{post.title}</h1>

        <div className={styles.meta}>
          <span>{post.author}</span>
          <span className={styles.metaDot} />
          <span>
            {new Date(post.publishedAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className={styles.metaDot} />
          <span>{post.readTime}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.body}>{renderBody(post.body, styles)}</div>

        {linkedSegmentData.length > 0 && (
          <div className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>Related Collections</h2>
            <div className={styles.relatedGrid}>
              {linkedSegmentData.map((seg) => (
                <Link
                  key={seg.id}
                  href={`/segment/${seg.id}`}
                  className={styles.relatedTag}
                  style={{
                    color: seg.accent,
                    backgroundColor: `${seg.accent}15`,
                    border: `1px solid ${seg.accent}30`,
                  }}
                >
                  {seg.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className={styles.backLinkWrap}>
          <Link href="/blog" className={styles.backLink}>
            &larr; BACK TO JOURNAL
          </Link>
        </div>
      </article>
    </main>
  );
}
