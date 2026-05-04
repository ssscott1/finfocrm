import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { Lead } from '@/lib/types';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const dir = searchParams.get('dir') === 'asc' ? 'ASC' : 'DESC';

  const allowed = ['created_at', 'updated_at', 'name', 'value', 'status'];
  const sortCol = allowed.includes(sort) ? sort : 'created_at';

  let query = `SELECT * FROM leads WHERE 1=1`;
  const params: (string | number)[] = [];

  if (search) {
    query += ` AND (name LIKE ? OR email LIKE ? OR company LIKE ? OR phone LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  query += ` ORDER BY ${sortCol} ${dir}`;

  const leads = db.prepare(query).all(...params) as Lead[];
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { name, email, phone, company, source, status, value, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO leads (name, email, phone, company, source, status, value, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    email || null,
    phone || null,
    company || null,
    source || 'website',
    status || 'new',
    Number(value) || 0,
    notes || ''
  );

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid) as Lead;
  return NextResponse.json(lead, { status: 201 });
}
