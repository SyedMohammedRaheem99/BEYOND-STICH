import { NextResponse } from 'next/server';

/**
 * GET /api/auth/providers-status
 *
 * Which sign-in methods are actually usable right now.
 *
 * The Google provider is only registered when both GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET are set (see lib/auth.js). Without them the login
 * page still rendered a "Continue with Google" button that called
 * signIn('google') against a provider that did not exist — the click did
 * nothing at all, with no error, which reads as a broken site.
 *
 * Driving the button off this means it disappears when unconfigured and
 * comes back the moment the credentials are added, with no code change.
 *
 * Returns booleans only — never the credential values themselves.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    credentials: true,
  });
}
