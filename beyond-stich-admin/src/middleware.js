import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { TOKEN_NAME } from '@/lib/auth';

// Edge-compatible secret. Must match the secret used to SIGN in src/lib/auth.js.
const JWT_SECRET = process.env.JWT_SECRET || 'beyond-stich-admin-secret-key-change-me';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API routes through
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check for admin token
  const token = request.cookies.get(TOKEN_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify with jose (works on the Edge runtime, unlike jsonwebtoken).
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (payload.role !== 'admin') {
      throw new Error('Not an admin');
    }
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set(TOKEN_NAME, '', { maxAge: 0, path: '/' });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
