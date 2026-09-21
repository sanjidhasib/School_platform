import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge middleware: only enforces the *unauthenticated* case.
 * - If the user has no accessToken cookie and is trying to reach a protected page,
 *   send them to /login.
 * - We deliberately do NOT bounce authenticated users away from /login here.
 *   The login page itself reads the user via /api/auth/me and pushes to the
 *   role-specific dashboard. Bouncing to "/" was a dead end (public marketing
 *   page with no nav back to admin).
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith('/login') || path.startsWith('/register');
  const isApi = path.startsWith('/api');
  const isHome = path === '/';

  if (!token && !isAuthPage && !isApi && !isHome) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/guardian/:path*',
    '/profile/:path*',
    '/login',
    '/register'
  ]
};
