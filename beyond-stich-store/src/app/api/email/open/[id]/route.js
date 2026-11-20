import connectDB from '@/lib/mongodb';
import EmailLog from '@/lib/models/EmailLog';

// A 1x1 transparent GIF, the smallest valid image that renders in every mail
// client. Inlined so serving it needs no filesystem read.
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * GET /api/email/open/[id]
 *
 * Hit by the tracking pixel in a sent message. Marks that EmailLog row as
 * opened, which is the only hard evidence available on shared-hosting SMTP
 * that a message reached an inbox rather than a spam folder.
 *
 * Always returns the image, whatever happens — a broken log lookup must
 * never render as a missing-image icon in a customer's inbox.
 */
export async function GET(request, { params }) {
  const { id } = await params;

  try {
    // Only ever the first open: later loads are the same person re-reading,
    // and overwriting would lose the delivery timestamp we actually care
    // about. The id filter also means a malformed id is simply a no-op.
    if (/^[a-f0-9]{24}$/i.test(id)) {
      await connectDB();
      await EmailLog.updateOne(
        { _id: id, openedAt: null },
        { $set: { openedAt: new Date() } }
      );
    }
  } catch {
    // Swallowed deliberately — see above.
  }

  return new Response(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      // Mail clients and their proxies cache aggressively; without this an
      // open could be served from cache and never reach us.
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
    },
  });
}
