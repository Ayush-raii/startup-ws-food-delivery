import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const path = request.nextUrl.pathname;

  // Let API and internal assets pass
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  let userPayload: any = null;
  if (token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      userPayload = JSON.parse(jsonPayload);
    } catch (e) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // Paths classification
  const isCustomerPath = path.startsWith('/customer') || path.startsWith('/checkout') || path.startsWith('/order');
  const isOwnerPath = path.startsWith('/restaurant');
  const isStaffPath = path.startsWith('/staff');
  const isAdminPath = path.startsWith('/admin');

  // If NOT logged in
  if (!userPayload) {
    if (isCustomerPath || isOwnerPath || isStaffPath || isAdminPath) {
      if (isAdminPath) {
        return NextResponse.redirect(new URL('/login/admin', request.url));
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Let guests hit login, register, or home
    if (path === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // If ALREADY logged in, redirect away from public auth pages
  if (path === '/login' || path === '/register' || path === '/login/admin' || path === '/') {
    if (userPayload.role === 'customer') {
      return NextResponse.redirect(new URL('/customer/dashboard', request.url));
    } else if (userPayload.role === 'owner') {
      return NextResponse.redirect(new URL('/restaurant/dashboard', request.url));
    } else if (userPayload.role === 'staff') {
      return NextResponse.redirect(new URL('/staff/dashboard', request.url));
    } else if (userPayload.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // Enforce proper dashboard matching
  if (isCustomerPath && userPayload.role !== 'customer') {
    if (userPayload.role === 'owner') {
      return NextResponse.redirect(new URL('/restaurant/dashboard', request.url));
    } else if (userPayload.role === 'staff') {
      return NextResponse.redirect(new URL('/staff/dashboard', request.url));
    } else if (userPayload.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  if (isOwnerPath && userPayload.role !== 'owner') {
    if (userPayload.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isStaffPath && userPayload.role !== 'staff') {
    if (userPayload.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAdminPath && userPayload.role !== 'admin') {
    return NextResponse.redirect(new URL('/login/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
