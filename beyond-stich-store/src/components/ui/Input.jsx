'use client';

import { forwardRef, useId } from 'react';
import styles from './Input.module.css';

const ErrorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

/**
 * Labelled form field. Renders <input>, <textarea>, or <select> from one
 * component so label, hint, and error treatment stay identical everywhere.
 *
 * Accessibility handled here rather than at each call site:
 *   - label is always associated with the control via a generated id
 *   - errors are wired with aria-invalid + aria-describedby and announced live
 *   - errors carry an icon and text, never colour alone
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    as = 'input',
    id: providedId,
    required = false,
    className = '',
    children,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const Element = as;

  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${styles.wrap} ${className}`}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <Element
        ref={ref}
        id={id}
        className={`${styles.field} ${as === 'textarea' ? styles.textarea : ''} ${
          error ? styles.invalid : ''
        }`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        required={required}
        {...props}
      >
        {children}
      </Element>

      {/* Hint is hidden once an error shows, so the two never stack and
          compete for the same slot under the field. */}
      {hint && !error && (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      )}

      {error && (
        <span className={styles.error} id={errorId} role="alert">
          <ErrorIcon />
          {error}
        </span>
      )}
    </div>
  );
});

export default Input;
