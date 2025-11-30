import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user is accessing admin or funcionario routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/funcionario')) {
    // Allow access to login pages
    if (pathname === '/admin/login' || pathname === '/funcionario/login') {
      return NextResponse.next();
    }

    // In development, skip server-side token check
    // The ProtectedRoute/FuncionarioProtectedRoute components handle authentication on the client
    // This is necessary because we use localStorage (not cookies) in development
    // 
    // Note: Client-side route protection validates:
    // 1. User is authenticated (has valid token)
    // 2. User has correct role (admin for /admin/*, funcionario for /funcionario/*)
    // 3. User has permission to access the specific route
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      // Let client-side components handle auth and authorization
      return NextResponse.next();
    }

    // In production, check for authentication token in cookies
    const token = request.cookies.get('token');

    // If no token, redirect to appropriate login page
    if (!token) {
      const loginUrl = pathname.startsWith('/funcionario')
        ? new URL('/funcionario/login', request.url)
        : new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token exists, allow access
    // Note: Role-based authorization is handled by ProtectedRoute/FuncionarioProtectedRoute
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
