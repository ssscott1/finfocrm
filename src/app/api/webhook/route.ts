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

// Maps referral-type field values from finfo.com.au to CRM product types.
const REFERRAL_TYPE_TO_PRODUCT: Record<string, string> = {
  'car loan':                      'Car Loan',
  'car, boat & personal loans':    'Car Loan',
  'boat loan':                     'Boat Loan',
  'personal loan':                 'Personal Loan',
  'home loan':                     'Mortgage',
  'home loan referral':            'Mortgage',
  'mortgage':                      'Mortgage',
  'accountant':                    'Accountant',
  'financial adviser':             'Financial Adviser',
  'financial advisor':             'Financial Adviser',
  'smsf setup':                    'SMSF Setup',
  'smsf':                          'SMSF Setup',
  'insurance':                     'Insurance',
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
  const formName = (body.form_name as string || '').toLowerCase();

  // finfo.com.au referral form uses hyphenated field names: first-name, last-name, referral-type
  const firstname = (data['first-name'] || data.firstname || data.first_name || '').trim();
  const lastname  = (data['last-name']  || data.lastname  || data.last_name  || '').trim();

  // finfo-subscribers is a newsletter-only form — skip lead creation
  if (formName === 'finfo-subscribers') {
    console.log(`[webhook] Newsletter subscription: ${data.email}`);
    return NextResponse.json({ success: true, skipped: 'newsletter' });
  }

  if (!firstname && !lastname) {
    return NextResponse.json({ error: 'Missing name fields' }, { status: 400 });
  }

  // Resolve product from referral-type field, then form name mapping
  const referralType = (data['referral-type'] || data.referral_type || '').toLowerCase();
  const product =
    data.product ||
    REFERRAL_TYPE_TO_PRODUCT[referralType] ||
    REFERRAL_TYPE_TO_PRODUCT[Object.keys(REFERRAL_TYPE_TO_PRODUCT).find(k => referralType.includes(k)) || ''] ||
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
