import Link from 'next/link';
import { getAllPosts, BLOG_CATEGORIES } from '@/lib/blog';

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text-primary)',
      padding: '120px 24px 80px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 60, textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            letterSpacing: '0.15em',
            color: 'var(--color-text-muted)',
            marginBottom: 12,
            textTransform: 'uppercase',
          }}>
            Beyond Stich
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--color-text-accent)',
            textTransform: 'uppercase',
          }}>
            THE JOURNAL
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: 'var(--color-text-secondary)',
            marginTop: 16,
            maxWidth: 520,
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6,
          }}>
            Guides, styling tips, and everything oversized.
          </p>
        </div>

        {/* Post Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 28,
        }}>
          {posts.map((post) => {
            const cat = BLOG_CATEGORIES[post.category] || { label: post.category, color: '#888' };
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                }}
              >
                <article style={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: 28,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'border-color 0.2s ease, transform 0.2s ease',
                }}>
                  {/* Category + Meta */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: cat.color,
                      backgroundColor: `${cat.color}15`,
                      padding: '4px 10px',
                      borderRadius: 4,
                    }}>
                      {cat.label}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                    }}>
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: 'var(--color-text-accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                  }}>
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: 'var(--color-text-secondary)',
                    flex: 1,
                  }}>
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 14,
                    marginTop: 4,
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                    }}>
                      {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-primary)',
                    }}>
                      READ MORE &rarr;
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
