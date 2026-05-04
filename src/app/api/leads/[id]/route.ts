import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { Lead } from '@/lib/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(Number(id)) as Lead | undefined;
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  const { name, email, phone, company, source, status, value, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const result = db.prepare(`
    UPDATE leads SET name=?, email=?, phone=?, company=?, source=?, status=?, value=?, notes=?
    WHERE id=?
  `).run(
    name.trim(),
    email || null,
    phone || null,
    company || null,
    source || 'website',
    status || 'new',
    Number(value) || 0,
    notes || '',
    Number(id)
  );

  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(Number(id)) as Lead;
  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const result = db.prepare('DELETE FROM leads WHERE id = ?').run(Number(id));
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
