import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

function verifyToken(token: string): boolean {
  try {
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return false;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const secret = process.env.SESSION_SECRET || 'finfo-crm-secret-2024';
    const expected = createHmac('sha256', secret).update(payload).digest('base64url');
    if (sig !== expected) return false;
    const parts = payload.split(':');
    const expiry = parseInt(parts[1]);
    return Date.now() < expiry;
  } catch {
    return false;
  }
}

export function proxy(req: NextRequest) {
  const token = req.cookies.get('finfo_session')?.value;
  if (token && verifyToken(token)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('returnTo', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/dashboard.html'],
};
