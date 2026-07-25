import { NextResponse } from 'next/server';
import { verifyToken, TOKEN_NAME } from '@/lib/auth';

export function middleware(request) {
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

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'admin') {
    // Invalid or expired token → redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set(TOKEN_NAME, '', { maxAge: 0, path: '/' });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
