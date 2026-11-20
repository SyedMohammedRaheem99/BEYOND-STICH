import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProductType from '@/lib/models/ProductType';
import { getAdminFromRequest } from '@/lib/auth';

/** Strips empty rows so a half-filled form doesn't persist blanks. */
function cleanPairs(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((r) => ({
      label: String(r?.label || '').trim().slice(0, 60),
      defaultValue: String(r?.defaultValue || '').trim().slice(0, 200),
    }))
    .filter((r) => r.label);
}

function cleanChartRows(rows, columns) {
  return (Array.isArray(rows) ? rows : [])
    .map((r) => {
      const measurements = {};
      for (const col of columns) {
        const v = String(r?.measurements?.[col] ?? '').trim();
        if (v) measurements[col] = v.slice(0, 40);
      }
      return { size: String(r?.size || '').trim().slice(0, 20), measurements };
    })
    .filter((r) => r.size);
}

function cleanList(list, max = 40) {
  return (Array.isArray(list) ? list : [])
    .map((s) => String(s || '').trim().slice(0, max))
    .filter(Boolean);
}

/** Shared shape for POST and PUT. */
export function buildPayload(body) {
  const chartColumns = cleanList(body.chartColumns);
  return {
    name: String(body.name || '').trim().slice(0, 60),
    sizes: cleanList(body.sizes, 20),
    specTemplate: cleanPairs(body.specTemplate),
    chartColumns,
    chartRows: cleanChartRows(body.chartRows, chartColumns),
    chartNote: String(body.chartNote || '').trim().slice(0, 300),
    measureGuide: cleanPairs(body.measureGuide),
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    active: body.active !== false,
  };
}

// GET /api/product-types
export async function GET(request) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const types = await ProductType.find({}).sort({ sortOrder: 1, name: 1 }).lean();
    return NextResponse.json({ types });
  } catch (error) {
    console.error('[product-types] GET error:', error);
    return NextResponse.json({ error: 'Failed to load product types' }, { status: 500 });
  }
}

// POST /api/product-types
export async function POST(request) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = buildPayload(await request.json());

    if (!payload.name) {
      return NextResponse.json({ error: 'Type name is required' }, { status: 400 });
    }

    await connectDB();

    // Case-insensitive, so 't-shirt' can't shadow 'T-Shirt' — products
    // reference the type by name, and two spellings would silently split
    // the catalogue.
    const clash = await ProductType.findOne({
      name: new RegExp(`^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    }).lean();
    if (clash) {
      return NextResponse.json({ error: 'A type with that name already exists' }, { status: 409 });
    }

    const type = await ProductType.create(payload);
    return NextResponse.json({ type }, { status: 201 });
  } catch (error) {
    console.error('[product-types] POST error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A type with that name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product type' }, { status: 500 });
  }
}
