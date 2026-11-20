'use client';

import { useState } from 'react';
import styles from './SizeChart.module.css';

/**
 * The size chart itself — table, unit toggle and measuring guide.
 *
 * Extracted so the modal on the product page and the standalone
 * /size-guide page render the same thing. Both previously hard-coded
 * their own copy of a tee chart, in two different shapes (a table and a
 * bulleted list), so correcting a measurement meant editing both and the
 * two had already drifted apart.
 *
 * Takes its data from a ProductType, so a pant shows waist/inseam and a
 * cap shows head circumference without this component knowing what any of
 * those mean.
 */

const INCH_TO_CM = 2.54;

/**
 * Convert a measurement for display.
 *
 * Values are authored in inches but may be ranges ("21–23") or carry
 * stray units, so this converts each number it finds and leaves the rest
 * of the string intact rather than assuming a bare number.
 */
function toCm(value) {
  return String(value).replace(/\d+(\.\d+)?/g, (n) => {
    const cm = parseFloat(n) * INCH_TO_CM;
    // One decimal unless it would read as a false precision (.0).
    return Number.isInteger(cm) ? String(cm) : cm.toFixed(1);
  });
}

export default function SizeChart({
  columns = [],
  rows = [],
  note = '',
  measureGuide = [],
  accentColor = 'var(--accent)',
  highlightSize = null,
}) {
  // Most Indian customers think in cm, but garment charts are authored in
  // inches — so offer both rather than picking one and being wrong half
  // the time.
  const [unit, setUnit] = useState('in');

  if (!rows.length || !columns.length) {
    return (
      <p className={styles.empty}>
        Size measurements for this product aren&apos;t available yet. Message us
        and we&apos;ll send them over.
      </p>
    );
  }

  const format = (raw) => {
    const v = String(raw ?? '').trim();
    if (!v) return '—';
    return unit === 'cm' ? toCm(v) : v;
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        {note && <p className={styles.note}>{note}</p>}

        <div className={styles.unitToggle} role="group" aria-label="Measurement unit">
          {['in', 'cm'].map((u) => (
            <button
              key={u}
              type="button"
              className={`${styles.unitBtn} ${unit === u ? styles.unitActive : ''}`}
              onClick={() => setUnit(u)}
              aria-pressed={unit === u}
            >
              {u === 'in' ? 'INCHES' : 'CM'}
            </button>
          ))}
        </div>
      </div>

      {/* The scroll container is only ever reached on a very narrow screen
          with many columns; the table itself is sized to avoid it in the
          common case. */}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Size</th>
              {columns.map((c) => (
                <th key={c} scope="col">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isCurrent = highlightSize && row.size === highlightSize;
              return (
                <tr key={row.size} className={isCurrent ? styles.current : ''}>
                  <th scope="row" style={isCurrent ? { color: accentColor } : undefined}>
                    {row.size}
                  </th>
                  {columns.map((c) => (
                    <td key={c}>{format(row.measurements?.[c])}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {measureGuide.length > 0 && (
        <div className={styles.guide}>
          <h3 className={styles.guideTitle}>How to measure</h3>
          <dl className={styles.guideList}>
            {measureGuide.map((g) => (
              <div key={g.label} className={styles.guideRow}>
                <dt>{g.label}</dt>
                <dd>{g.defaultValue}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p className={styles.tip}>
        Tip: lay a garment you already like flat and compare it against the
        numbers above — it is the most reliable way to judge the fit.
      </p>
    </div>
  );
}
