import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { Activity } from '@/lib/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const activities = db.prepare(
    'SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC'
  ).all(Number(id)) as Activity[];
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const { type, content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const result = db.prepare(
    'INSERT INTO activities (lead_id, type, content) VALUES (?, ?, ?)'
  ).run(Number(id), type || 'note', content.trim());

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid) as Activity;
  return NextResponse.json(activity, { status: 201 });
}
