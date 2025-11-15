import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user is accessing admin routes
  if (pathname.startsWith('/admin')) {
    // Allow access to login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // In development, skip server-side token check
    // The ProtectedRoute component will handle authentication on the client
    // This is necessary because we use localStorage (not cookies) in development
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      // Let client-side ProtectedRoute handle auth
      return NextResponse.next();
    }

    // In production, check for authentication token in cookies
    const token = request.cookies.get('token');

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token exists, allow access
    return NextResponse.next();
  }

  // For non-admin routes, allow access
  return NextResponse.next();
}

// Configure which routes should be checked by middleware
export const config = {
  matcher: [
    /*
     * Match all admin routes except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/admin/:path*',
  ],
};
