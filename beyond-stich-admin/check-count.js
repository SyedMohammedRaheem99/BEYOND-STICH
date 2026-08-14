import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
import mongoose from 'mongoose';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const count = await db.collection('products').countDocuments();
  console.log(`TOTAL_PRODUCTS_IN_DB=${count}`);
  const sample = await db.collection('products').find({}).limit(5).toArray();
  sample.forEach(s => console.log(`ITEM: [${s.segment}] ${s.name} - ${s.images?.[0]}`));
  process.exit(0);
}
check().catch(err => { console.error(err); process.exit(1); });
