import { NextResponse, type NextRequest } from 'next/server';
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/n/')) {
    return NextResponse.rewrite(new URL(request.nextUrl.pathname.replace('/n/', '/notes/'), request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/n/:path*'] };
