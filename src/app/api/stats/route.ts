import { NextResponse } from 'next/server';
import { getAllLeads } from '@/lib/store';

export async function GET() {
  const leads = await getAllLeads();

  const total     = leads.length;
  const newCount  = leads.filter(l => l.status === 'New').length;
  const completed = leads.filter(l => l.status === 'Completed').length;

  const today = new Date().toDateString();
  const todayCount = leads.filter(l => new Date(l.created_at).toDateString() === today).length;

  const byProduct: Record<string, number> = {};
  const byStatus:  Record<string, number> = {};
  const byState:   Record<string, number> = {};

  for (const l of leads) {
    byProduct[l.product] = (byProduct[l.product] || 0) + 1;
    byStatus[l.status]   = (byStatus[l.status]   || 0) + 1;
    if (l.state) byState[l.state] = (byState[l.state] || 0) + 1;
  }

  const recent = leads.slice(0, 5);

  return NextResponse.json({ total, newCount, completed, todayCount, byProduct, byStatus, byState, recent });
}
