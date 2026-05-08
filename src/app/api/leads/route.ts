import { NextRequest, NextResponse } from 'next/server';
import { getAllLeads, saveLead } from '@/lib/store';
import { Lead } from '@/lib/types';
import { randomUUID } from 'crypto';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

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
    (l.phone  || '').toLowerCase().includes(search) ||
    (l.business_name || '').toLowerCase().includes(search) ||
    (l.accountant_name || '').toLowerCase().includes(search)
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

  return NextResponse.json(leads, { headers: CORS });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<Lead>;
  if (!body.firstname?.trim()) {
    return NextResponse.json({ error: 'Contact name is required' }, { status: 400, headers: CORS });
  }
  if (!body.product) {
    return NextResponse.json({ error: 'Product is required' }, { status: 400, headers: CORS });
  }

  const now = new Date().toISOString();
  const lead: Lead = {
    id:         randomUUID(),
    firstname:  body.firstname.trim(),
    lastname:   body.lastname?.trim() || '',
    email:      body.email?.trim() || '',
    phone:      body.phone?.trim() || '',
    state:      body.state || '',
    timeframe:  body.timeframe || '',
    product:    body.product,
    status:     body.status || 'New',
    source:     body.source || 'Finfo Website',
    notes:      body.notes?.trim() || '',
    business_name:    body.business_name?.trim() || '',
    abn:              body.abn?.replace(/\s/g, '') || '',
    years_trading:    body.years_trading || '',
    accountancy:      body.accountancy?.trim() || '',
    accountant_name:  body.accountant_name?.trim() || '',
    accountant_email: body.accountant_email?.trim() || '',
    finance_amount:   body.finance_amount || '',
    created_at: now,
    updated_at: now,
  };

  await saveLead(lead);
  return NextResponse.json(lead, { status: 201, headers: CORS });
}
