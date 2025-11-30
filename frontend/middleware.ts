import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user is accessing admin or funcionario routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/funcionario')) {
    // Allow access to login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // In development, skip server-side token check
    // The ProtectedRoute component will handle authentication AND authorization on the client
    // This is necessary because we use localStorage (not cookies) in development
    // 
    // Note: ProtectedRoute now validates:
    // 1. User is authenticated
    // 2. User has admin or funcionario role
    // 3. User has permission to access the specific route
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      // Let client-side ProtectedRoute handle auth and authorization
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
    // Note: Role-based authorization is handled by ProtectedRoute component
    // For stronger production security, we could decode the JWT here and validate
    // route permissions, but that would require access to JWT secret in middleware
    return NextResponse.next();
  }

  // For non-admin/funcionario routes, allow access
  return NextResponse.next();
}

// Configure which routes should be checked by middleware
export const config = {
  matcher: [
    /*
     * Match all admin and funcionario routes except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/admin/:path*',
    '/funcionario/:path*',
  ],
};
