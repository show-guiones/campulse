import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const response = NextResponse.next();

  // Si NO es el dominio de producción, agregar noindex
  if (!host.includes('campulsehub.com')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: '/:path*',
};
