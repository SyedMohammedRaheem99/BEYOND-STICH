import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyData';

export async function GET() {
  const baseUrl = 'https://beyondstich.com';

  let products = [];
  try {
    await connectDB();
    const docs = await Product.find({ isActive: true }).lean();
    if (docs.length > 0) products = docs;
  } catch {}
  if (products.length === 0) products = DUMMY_PRODUCTS;

  const items = products.map(p => {
    const inStock = p.sizes?.some(s => s.stock > 0);
    const availability = inStock ? 'in_stock' : 'out_of_stock';

    return `
    <item>
      <g:id>${p.slug}</g:id>
      <title>${escapeXml(p.name)} - Beyond Stich</title>
      <description>${escapeXml(p.description || `Premium oversized graphic tee from Beyond Stich. 240 GSM combed cotton.`)}</description>
      <link>${baseUrl}/product/${p.slug}</link>
      <g:image_link>${p.images?.[0] || ''}</g:image_link>
      ${(p.images || []).slice(1).map(img => `<g:additional_image_link>${img}</g:additional_image_link>`).join('\n      ')}
      <g:price>${p.price} INR</g:price>
      ${p.mrp > p.price ? `<g:sale_price>${p.price} INR</g:sale_price>` : ''}
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Beyond Stich</g:brand>
      <g:google_product_category>212</g:google_product_category>
      <g:product_type>Apparel &gt; Tops &gt; T-Shirts</g:product_type>
      <g:gender>male</g:gender>
      <g:age_group>adult</g:age_group>
      <g:material>${escapeXml(p.material || '240 GSM Combed Cotton')}</g:material>
      <g:color>${escapeXml(p.colors?.[0] || 'Black')}</g:color>
      <g:shipping>
        <g:country>IN</g:country>
        <g:price>${p.price >= 999 ? '0' : '79'} INR</g:price>
      </g:shipping>
    </item>`;
  }).join('\n');

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
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
