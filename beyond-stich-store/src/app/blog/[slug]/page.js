import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPosts, BLOG_CATEGORIES } from '@/lib/blog';
import { SEGMENTS } from '@/lib/constants';

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

function renderBody(body) {
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
        <Link
          key={`${i}-${match.index}`}
          href={match[2]}
          style={{
            color: '#06B6D4',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            textDecorationColor: 'rgba(6, 182, 212, 0.3)',
            transition: 'text-decoration-color 0.2s ease',
          }}
        >
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
      <p
        key={i}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          lineHeight: 1.8,
          color: 'var(--color-text-secondary)',
          marginBottom: 24,
          ...(isListItem ? { fontWeight: 600, color: 'var(--color-text-primary)' } : {}),
        }}
      >
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

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text-primary)',
      padding: '120px 24px 80px',
    }}>
      <article style={{ maxWidth: 740, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <nav style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          marginBottom: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          <Link href="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            HOME
          </Link>
          <span>/</span>
          <Link href="/blog" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            BLOG
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {post.title.toUpperCase()}
          </span>
        </nav>

        {/* Category Badge */}
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: cat.color,
          backgroundColor: `${cat.color}15`,
          padding: '5px 12px',
          borderRadius: 4,
          display: 'inline-block',
          marginBottom: 20,
        }}>
          {cat.label}
        </span>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 5vw, 3rem)',
          fontWeight: 700,
          lineHeight: 1.15,
          color: 'var(--color-text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          marginBottom: 20,
        }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--color-text-muted)',
          marginBottom: 48,
          flexWrap: 'wrap',
        }}>
          <span>{post.author}</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--color-border)' }} />
          <span>
            {new Date(post.publishedAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--color-border)' }} />
          <span>{post.readTime}</span>
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          backgroundColor: 'var(--color-border)',
          marginBottom: 40,
        }} />

        {/* Body */}
        <div style={{ marginBottom: 60 }}>
          {renderBody(post.body)}
        </div>

        {/* Related Segments */}
        {linkedSegmentData.length > 0 && (
          <div style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 40,
            marginBottom: 40,
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--color-text-accent)',
              marginBottom: 20,
            }}>
              Related Collections
            </h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              {linkedSegmentData.map((seg) => (
                <Link
                  key={seg.id}
                  href={`/segment/${seg.id}`}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: seg.accent,
                    backgroundColor: `${seg.accent}15`,
                    border: `1px solid ${seg.accent}30`,
                    padding: '8px 18px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {seg.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to blog */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: 32,
        }}>
          <Link
            href="/blog"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            &larr; BACK TO JOURNAL
          </Link>
        </div>
      </article>
    </main>
  );
}
