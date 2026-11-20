'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import styles from './Button.module.css';

/**
 * The single button primitive for the store.
 *
 * Renders the right element for the job automatically:
 *   - `href` starting with http(s):// or //  → <a> (external, safe rel)
 *   - `href` otherwise                       → next/link (SPA navigation)
 *   - no `href`                              → <button>
 *
 * Variants: primary | secondary | ghost | danger
 * Sizes:    sm | md | lg   (all clear the 44px touch minimum)
 *
 * `loading` keeps the label's box while hiding it, so the button never
 * resizes mid-request and shifts surrounding layout.
 */
const Button = forwardRef(function Button(
  {
    children,
    href,
    variant = 'primary',
    size = 'md',
    block = false,
    loading = false,
    disabled = false,
    icon,
    className = '',
    type,
    ...props
  },
  ref
) {
  const classes = [
    styles.button,
    styles[variant] ?? styles.primary,
    styles[size] ?? styles.md,
    block ? styles.block : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <span className={styles.label}>{children}</span>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </>
  );

  // A disabled link is not a real thing in HTML — anchors ignore `disabled`
  // and stay clickable. Render it as an inert <span> so the disabled state is
  // honoured for both mouse and keyboard.
  if (href && (disabled || loading)) {
    return (
      <span ref={ref} className={classes} aria-disabled="true" role="link" {...props}>
        {content}
      </span>
    );
  }

  if (href) {
    const isExternal = /^(https?:)?\/\//.test(href);

    if (isExternal) {
      return (
        <a
          ref={ref}
          href={href}
          className={classes}
          rel="noopener noreferrer"
          {...props}
        >
          {content}
        </a>
      );
    }

    return (
      <Link ref={ref} href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      // Buttons inside a form default to type="submit", which silently submits
      // the form. Default to "button" unless a type is explicitly given.
      type={type ?? 'button'}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
});

export default Button;
