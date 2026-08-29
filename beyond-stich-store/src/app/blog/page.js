import Link from 'next/link';
import { getAllPosts, BLOG_CATEGORIES } from '@/lib/blog';
import styles from './page.module.css';

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Beyond Stich</p>
          <h1 className={styles.title}>THE JOURNAL</h1>
          <p className={styles.subtitle}>Guides, styling tips, and everything oversized.</p>
        </div>

        <div className={styles.grid}>
          {posts.map((post) => {
            const cat = BLOG_CATEGORIES[post.category] || { label: post.category, color: '#888' };
            return (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.cardLink}>
                <article className={styles.card}>
                  <div className={styles.cardTop}>
                    <span
                      className={styles.categoryBadge}
                      style={{ color: cat.color, backgroundColor: `${cat.color}15` }}
                    >
                      {cat.label}
                    </span>
                    <span className={styles.readTime}>{post.readTime}</span>
                  </div>

                  <h2 className={styles.cardTitle}>{post.title}</h2>

                  <p className={styles.excerpt}>{post.excerpt}</p>

                  <div className={styles.cardFooter}>
                    <span className={styles.date}>
                      {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className={styles.readMore}>READ MORE &rarr;</span>
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
