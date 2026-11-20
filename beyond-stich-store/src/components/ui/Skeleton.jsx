import styles from './Skeleton.module.css';

/**
 * Loading placeholder. Give it the size of the thing it stands in for so the
 * layout doesn't shift when real content arrives.
 *
 * Shapes: block (default) | text | circle
 * `lines` renders a stack of text bars, last one short — the standard
 * paragraph tell that makes a skeleton read as text rather than a grey box.
 */
export default function Skeleton({
  width,
  height,
  shape = 'block',
  lines = 1,
  className = '',
  style,
  ...props
}) {
  const classes = [styles.skeleton, styles[shape] ?? '', className]
    .filter(Boolean)
    .join(' ');

  if (shape === 'text' && lines > 1) {
    return (
      <span
        aria-hidden="true"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', ...style }}
        {...props}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className={classes}
            style={{ width: i === lines - 1 ? '60%' : width ?? '100%' }}
          />
        ))}
      </span>
    );
  }

  return (
    <span
      className={classes}
      aria-hidden="true"
      style={{ width, height, display: 'block', ...style }}
      {...props}
    />
  );
}
