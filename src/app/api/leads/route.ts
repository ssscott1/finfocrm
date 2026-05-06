import { NextRequest, NextResponse } from 'next/server';
import { getAllLeads, saveLead } from '@/lib/store';
import { Lead } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search  = (searchParams.get('search') || '').toLowerCase();
  const status  = searchParams.get('status') || '';
  const product = searchParams.get('product') || '';
  const state   = searchParams.get('state') || '';
  const sort    = searchParams.get('sort') || 'created_at';
  const dir     = searchParams.get('dir') || 'desc';

  let leads = await getAllLeads();

  if (search)  leads = leads.filter(l =>
    `${l.firstname} ${l.lastname}`.toLowerCase().includes(search) ||
    (l.email  || '').toLowerCase().includes(search) ||
    (l.phone  || '').toLowerCase().includes(search)
  );
  if (status)  leads = leads.filter(l => l.status  === status);
  if (product) leads = leads.filter(l => l.product === product);
  if (state)   leads = leads.filter(l => l.state   === state);

  const allowed = ['created_at', 'updated_at', 'firstname', 'product', 'status'];
  const col = allowed.includes(sort) ? sort : 'created_at';
  leads.sort((a, b) => {
    const av = (a as unknown as Record<string, string>)[col] ?? '';
    const bv = (b as unknown as Record<string, string>)[col] ?? '';
    return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<Lead>;
  if (!body.firstname?.trim() || !body.lastname?.trim()) {
    return NextResponse.json({ error: 'First and last name are required' }, { status: 400 });
  }
  if (!body.product) {
    return NextResponse.json({ error: 'Product is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const lead: Lead = {
    id:         randomUUID(),
    firstname:  body.firstname.trim(),
    lastname:   body.lastname.trim(),
    email:      body.email?.trim() || '',
    phone:      body.phone?.trim() || '',
    state:      body.state || '',
    timeframe:  body.timeframe || '',
    product:    body.product,
    status:     body.status || 'New',
    source:     body.source || 'Finfo Website',
    notes:      body.notes?.trim() || '',
    created_at: now,
    updated_at: now,
  };

  await saveLead(lead);
  return NextResponse.json(lead, { status: 201 });
}
