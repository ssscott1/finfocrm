import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();

  const total = (db.prepare('SELECT COUNT(*) as n FROM leads').get() as { n: number }).n;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status').all() as { status: string; count: number }[];
  const totalValue = (db.prepare('SELECT COALESCE(SUM(value),0) as v FROM leads WHERE status NOT IN (\'lost\')').get() as { v: number }).v;
  const wonValue = (db.prepare("SELECT COALESCE(SUM(value),0) as v FROM leads WHERE status='won'").get() as { v: number }).v;
  const recent = db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5').all();

  return NextResponse.json({ total, byStatus, totalValue, wonValue, recent });
}
