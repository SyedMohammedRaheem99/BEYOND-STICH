import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAdminFromRequest } from '@/lib/auth';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_PRESETS = {
  product: {
    folder: 'beyond-stich/products',
    transformation: [{ width: 800, height: 1000, crop: 'fill', quality: 'auto:good' }],
  },
  // Wide desktop hero. 'limit' only shrinks oversized files — it never crops,
  // so the composition the designer set is the composition that ships.
  'banner-desktop': {
    folder: 'beyond-stich/banners',
    transformation: [{ width: 2400, crop: 'limit', quality: 'auto:good' }],
  },
  // Tall phone hero.
  'banner-mobile': {
    folder: 'beyond-stich/banners',
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto:good' }],
  },
};

// POST /api/upload — Upload image to Cloudinary
export async function POST(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    // Products are portrait cards; banners are wide. Cropping a hero to
    // 800x1000 would throw away most of it, so the shape is chosen by the
    // caller and defaults to the product card it has always been.
    const purpose = String(formData.get('purpose') || 'product');
    const preset = UPLOAD_PRESETS[purpose] || UPLOAD_PRESETS.product;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: preset.folder,
            transformation: preset.transformation,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
