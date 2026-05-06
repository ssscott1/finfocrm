import { NextRequest, NextResponse } from 'next/server';
import { getActivities, addActivity } from '@/lib/store';
import { Activity } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activities = await getActivities(id);
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { type, content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const activity: Activity = {
    id:         randomUUID(),
    lead_id:    id,
    type:       type || 'note',
    content:    content.trim(),
    created_at: new Date().toISOString(),
  };

  await addActivity(id, activity);
  return NextResponse.json(activity, { status: 201 });
}
