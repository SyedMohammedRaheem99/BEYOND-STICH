import styles from './Badge.module.css';

/**
 * Status/label pill.
 *
 * Variants: neutral | accent | success | danger | soldout | segment
 * The `segment` variant colours itself from the `color` prop (a segment
 * accent), applied as text on a dark scrim rather than as a fill.
 */
export default function Badge({
  children,
  variant = 'neutral',
  pill = false,
  color,
  className = '',
  ...props
}) {
  const classes = [
    styles.badge,
    styles[variant] ?? styles.neutral,
    pill ? styles.pill : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      style={color ? { '--badge-color': color } : undefined}
      {...props}
    >
      {children}
    </span>
  );
}
