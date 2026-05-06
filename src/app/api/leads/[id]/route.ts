import { NextRequest, NextResponse } from 'next/server';
import { getLead, saveLead, deleteLead } from '@/lib/store';
import { Lead } from '@/lib/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await getLead(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as Partial<Lead>;
  if (!body.firstname?.trim() || !body.lastname?.trim()) {
    return NextResponse.json({ error: 'First and last name are required' }, { status: 400 });
  }

  const updated: Lead = {
    ...existing,
    firstname:  body.firstname.trim(),
    lastname:   body.lastname.trim(),
    email:      body.email?.trim() ?? existing.email,
    phone:      body.phone?.trim() ?? existing.phone,
    state:      body.state ?? existing.state,
    timeframe:  body.timeframe ?? existing.timeframe,
    product:    body.product ?? existing.product,
    status:     body.status ?? existing.status,
    source:     body.source ?? existing.source,
    notes:      body.notes?.trim() ?? existing.notes,
    updated_at: new Date().toISOString(),
  };

  await saveLead(updated);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await getLead(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await deleteLead(id);
  return NextResponse.json({ success: true });
}
