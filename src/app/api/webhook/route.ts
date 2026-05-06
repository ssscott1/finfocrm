/**
 * Receives form submissions from finfo.com.au via Netlify Forms webhook.
 *
 * Configure in Netlify dashboard:
 *   finfo.com.au site → Forms → [form name] → Notifications → Outgoing webhook
 *   URL: https://[crm-site].netlify.app/api/webhook?secret=YOUR_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveLead } from '@/lib/store';
import { Lead } from '@/lib/types';
import { randomUUID } from 'crypto';

// Maps Netlify form names to CRM product types.
// Add/update these to match the actual form names on finfo.com.au.
const FORM_NAME_TO_PRODUCT: Record<string, string> = {
  'car-loan':          'Car Loan',
  'boat-loan':         'Boat Loan',
  'personal-loan':     'Personal Loan',
  'mortgage':          'Mortgage',
  'accountant':        'Accountant',
  'financial-adviser': 'Financial Adviser',
  'adviser':           'Financial Adviser',
  'smsf-setup':        'SMSF Setup',
  'smsf':              'SMSF Setup',
  'insurance':         'Insurance',
};

export async function POST(req: NextRequest) {
  // Validate webhook secret
  const secret = req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Netlify Forms webhook payload shape:
  // { form_name, data: { firstname, lastname, email, phone, state, timeframe, product, notes }, referrer, created_at }
  const data = (body.data as Record<string, string>) || {};

  const firstname = (data.firstname || data.first_name || (body.first_name as string) || '').trim();
  const lastname  = (data.lastname  || data.last_name  || (body.last_name  as string) || '').trim();

  if (!firstname && !lastname) {
    return NextResponse.json({ error: 'Missing name fields' }, { status: 400 });
  }

  // Resolve product: prefer explicit field, fall back to form name mapping
  const formName = (body.form_name as string || '').toLowerCase();
  const product =
    data.product ||
    FORM_NAME_TO_PRODUCT[formName] ||
    FORM_NAME_TO_PRODUCT[Object.keys(FORM_NAME_TO_PRODUCT).find(k => formName.includes(k)) || ''] ||
    'Unknown';

  const now = new Date().toISOString();
  const lead: Lead = {
    id:         randomUUID(),
    firstname,
    lastname,
    email:      (data.email     || '').trim(),
    phone:      (data.phone     || '').trim(),
    state:      (data.state     || '').trim(),
    timeframe:  (data.timeframe || '').trim(),
    product,
    status:     'New',
    source:     'Finfo Website',
    notes:      (data.notes || data.message || '').trim(),
    created_at: (body.created_at as string) || now,
    updated_at: now,
  };

  await saveLead(lead);

  console.log(`[webhook] New lead received: ${lead.firstname} ${lead.lastname} — ${lead.product}`);
  return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
}
