import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';

export async function GET() {
  const baseUrl = 'https://beyondstich.com';

  let products = [];
  try {
    await connectDB();
    products = await Product.find({ isActive: true }).lean();
  } catch (err) {
    console.error('[feed/google] DB error', err);
  }

  // Never fall back to seed products: submitting tees that aren't for sale
  // (with fabricated ratings and slugs that 404) is a Merchant Center
  // misrepresentation risk. An empty feed is the honest answer.

  const items = products
    // An item with no image is a hard disapproval, so skip those outright.
    .filter((p) => p.images?.[0])
    .flatMap((p) => {
      const sizes = (p.sizes || []).filter((s) => s.size);
      // Apparel must be submitted as size variants sharing an item_group_id,
      // otherwise the whole S–XXL range collapses into one unsized listing
      // and gets disapproved for a missing size attribute.
      const variants = sizes.length > 0 ? sizes : [{ size: 'One Size', stock: 1 }];

      return variants.map((variant) => {
        const availability = variant.stock > 0 ? 'in_stock' : 'out_of_stock';
        const onSale = p.mrp > p.price;

        return `
    <item>
      <g:id>${escapeXml(`${p.slug}-${variant.size}`)}</g:id>
      <g:item_group_id>${escapeXml(p.slug)}</g:item_group_id>
      <title>${escapeXml(p.name)} - Beyond Stich</title>
      <description>${escapeXml(p.description || 'Premium oversized graphic tee from Beyond Stich. 240 GSM combed cotton.')}</description>
      <link>${escapeXml(`${baseUrl}/product/${p.slug}`)}</link>
      <g:image_link>${escapeXml(p.images[0])}</g:image_link>
      ${(p.images || [])
        .slice(1, 11)
        .map((img) => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`)
        .join('\n      ')}
      <g:price>${onSale ? p.mrp : p.price} INR</g:price>
      ${onSale ? `<g:sale_price>${p.price} INR</g:sale_price>` : ''}
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Beyond Stich</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>212</g:google_product_category>
      <g:product_type>Apparel &gt; Tops &gt; T-Shirts</g:product_type>
      <g:gender>male</g:gender>
      <g:age_group>adult</g:age_group>
      <g:size>${escapeXml(variant.size)}</g:size>
      <g:material>${escapeXml(p.material || '240 GSM Combed Cotton')}</g:material>
      <g:color>${escapeXml(p.colors?.[0] || 'Black')}</g:color>
      <g:shipping>
        <g:country>IN</g:country>
        <g:price>${p.price >= 999 ? '0' : '79'} INR</g:price>
      </g:shipping>
    </item>`;
      });
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Beyond Stich — Premium Oversized Graphic Tees</title>
    <link>${baseUrl}</link>
    <description>Premium oversized graphic tees for men. 240 GSM combed cotton.</description>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
