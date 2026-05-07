import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createHmac } from 'crypto';

function sign(data: string): string {
  const secret = process.env.SESSION_SECRET || 'finfo-crm-secret-2024';
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { username?: string; password?: string };

  const validUser = process.env.CRM_USERNAME || 'admin';
  const validPass = process.env.CRM_PASSWORD || 'finfo2024';

  if (body.username !== validUser || body.password !== validPass) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  const expiry = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
  const payload = `${randomUUID()}:${expiry}`;
  const token = `${payload}.${sign(payload)}`;

  const res = NextResponse.json({ ok: true });
  res.cookies.set('finfo_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
