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

    // Skip server-side token check in all environments
    // The ProtectedRoute/FuncionarioProtectedRoute components handle authentication on the client
    // This is necessary because we use localStorage (not cookies) for token storage
    //
    // Note: Client-side route protection validates:
    // 1. User is authenticated (has valid token)
    // 2. User has correct role (admin for /admin/*, funcionario for /funcionario/*)
    // 3. User has permission to access the specific route
    //
    // Why we use localStorage instead of cookies:
    // - Simpler cross-domain handling (Seenode assigns different URLs for frontend/backend)
    // - Avoids sameSite/CORS cookie issues in production
    // - Client-side components provide sufficient security with token validation
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
