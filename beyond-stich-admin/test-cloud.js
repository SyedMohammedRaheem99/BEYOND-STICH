import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function test() {
  console.log('Testing Cloudinary upload with credentials:');
  console.log('Cloud:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('Key:', process.env.CLOUDINARY_API_KEY);
  console.log('Secret length:', process.env.CLOUDINARY_API_SECRET?.length);

  try {
    const res = await cloudinary.uploader.upload('C:\\Users\\starc\\Downloads\\catalogue-beyond-stich\\men-ten-catalogue\\1.png', {
      folder: 'test-folder'
    });
    console.log('✅ UPLOAD SUCCESS! URL:', res.secure_url);
  } catch (err) {
    console.error('❌ UPLOAD ERROR:', JSON.stringify(err, null, 2));
  }
}
test();
