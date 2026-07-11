import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const jwt = request.cookies.get('jwt')?.value;
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

  // If the user is trying to access an admin page without a token, redirect to login
  if (isAdminPage && !jwt) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user has a token and tries to access the login page, redirect to admin
  if (isAuthPage && jwt) {
    return NextResponse.redirect(new URL('/admin/analytics', request.url)); // Default admin route
  }

  return NextResponse.next();
}

// Only run the middleware on the admin and login routes
export const config = {
  matcher: ['/admin/:path*', '/login'],
};
