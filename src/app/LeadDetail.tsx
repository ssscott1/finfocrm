'use client';
import { useEffect, useState } from 'react';
import { Lead, Activity, LeadStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
import ActivityLog from '@/components/ActivityLog';
import { Pencil } from 'lucide-react';

interface Props {
  lead: Lead;
  onEdit: () => void;
  onLeadUpdate: (lead: Lead) => void;
}

function fmt(v: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
}

const STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export default function LeadDetail({ lead, onEdit, onLeadUpdate }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetch(`/api/leads/${lead.id}/activities`)
      .then(r => r.json())
      .then(setActivities);
  }, [lead.id]);

  async function changeStatus(status: LeadStatus) {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, status }),
    });
    if (res.ok) onLeadUpdate(await res.json());
  }

  return (
    <div className="space-y-6">
      {/* Top info */}
      <div className="flex items-start justify-between">
        <div>
          {lead.company && <p className="text-sm text-gray-500">{lead.company}</p>}
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
            {lead.email && <span>✉️ {lead.email}</span>}
            {lead.phone && <span>📞 {lead.phone}</span>}
            {lead.source && <span>🌐 {lead.source}</span>}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
        >
          <Pencil size={14} /> Edit
        </button>
      </div>

      {/* Value */}
      {lead.value > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          <p className="text-xs text-green-600 font-medium">Deal Value</p>
          <p className="text-2xl font-bold text-green-700">{fmt(lead.value)}</p>
        </div>
      )}

      {/* Status pipeline */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Pipeline Stage</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                lead.status === s
                  ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-current'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      {lead.notes && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Notes</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{lead.notes}</p>
        </div>
      )}

      {/* Activity */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Activity</p>
        <ActivityLog
          leadId={lead.id}
          activities={activities}
          onAdd={a => setActivities(prev => [a, ...prev])}
        />
      </div>
    </div>
  );
}
