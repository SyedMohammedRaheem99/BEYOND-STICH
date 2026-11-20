import styles from './Section.module.css';

/**
 * Page section wrapper. Owns vertical rhythm and the eyebrow/title/subtitle
 * pattern so every section on the site breathes identically.
 *
 * Renders a <section> with an optional header. Pass `action` for a trailing
 * link (e.g. "VIEW ALL"). The heading level is configurable via `as` so page
 * outlines stay correct — h2 by default.
 */
export default function Section({
  children,
  eyebrow,
  title,
  subtitle,
  action,
  as: Heading = 'h2',
  tight = false,
  bordered = false,
  secondary = false,
  centered = false,
  container = true,
  className = '',
  ...props
}) {
  const classes = [
    styles.section,
    tight ? styles.tight : '',
    bordered ? styles.bordered : '',
    secondary ? styles.secondary : '',
    centered ? styles.centered : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const hasHeader = eyebrow || title || subtitle || action;

  return (
    <section className={classes} {...props}>
      <div className={container ? 'container' : undefined}>
        {hasHeader && (
          <div className={styles.header}>
            <div className={styles.headings}>
              {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
              {title && <Heading className={styles.title}>{title}</Heading>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {action && <div className={styles.action}>{action}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
