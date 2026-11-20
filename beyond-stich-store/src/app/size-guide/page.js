import InfoPageLayout from '@/components/layout/InfoPageLayout';
import SizeChart from '@/components/product/SizeChart';
import connectDB from '@/lib/mongodb';
import ProductType from '@/lib/models/ProductType';

export const metadata = {
  title: 'Size Guide | Beyond Stich',
  description:
    'Measurements and how to measure for every Beyond Stich product — tees, hoodies, sweatshirts and more.',
  alternates: { canonical: 'https://beyondstich.com/size-guide' },
};

// Charts change rarely; serve from cache rather than hitting the database
// on every visit.
export const revalidate = 3600;

/**
 * Every type that has a chart, in display order.
 *
 * This page used to carry its own hard-coded copy of a tee chart as a
 * bulleted list, while the product-page modal carried the same numbers as
 * a table. Correcting a measurement meant remembering to edit both, and
 * the two had already drifted apart.
 */
async function getCharts() {
  try {
    await connectDB();
    const types = await ProductType.find({ active: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return types
      .filter((t) => t.chartRows?.length)
      .map((t) => ({
        name: t.name,
        columns: t.chartColumns?.length
          ? t.chartColumns
          : Object.keys(t.chartRows[0]?.measurements || {}),
        // Mongoose returns a Map; the client component expects a plain
        // object it can index by column name.
        rows: t.chartRows.map((r) => ({
          size: r.size,
          measurements:
            r.measurements instanceof Map
              ? Object.fromEntries(r.measurements)
              : { ...(r.measurements || {}) },
        })),
        note: t.chartNote || '',
        measureGuide: (t.measureGuide || []).map((g) => ({
          label: g.label,
          defaultValue: g.defaultValue,
        })),
      }));
  } catch {
    // An outage shows the page without charts rather than a 500.
    return [];
  }
}

export default async function SizeGuidePage() {
  const charts = await getCharts();

  return (
    <InfoPageLayout
      eyebrow="HELP"
      title="Size Guide"
      intro="Measurements for everything we make. Switch between inches and centimetres, and compare against a garment you already own."
    >
      {charts.length === 0 ? (
        <p>
          Size measurements aren&apos;t available right now. Message us on
          WhatsApp and we&apos;ll send them straight over.
        </p>
      ) : (
        charts.map((c) => (
          <section key={c.name} style={{ marginBottom: 'var(--space-12)' }}>
            <h2>{c.name}</h2>
            <SizeChart
              columns={c.columns}
              rows={c.rows}
              note={c.note}
              measureGuide={c.measureGuide}
            />
          </section>
        ))
      )}
    </InfoPageLayout>
  );
}
