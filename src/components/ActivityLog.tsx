'use client';
import { useState } from 'react';
import { Activity, ActivityType, ACTIVITY_ICONS } from '@/lib/types';

interface Props {
  leadId: number;
  activities: Activity[];
  onAdd: (activity: Activity) => void;
}

const TYPES: ActivityType[] = ['note', 'call', 'email', 'meeting'];

export default function ActivityLog({ leadId, activities, onAdd }: Props) {
  const [type, setType] = useState<ActivityType>('note');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content }),
      });
      if (res.ok) {
        const activity = await res.json();
        onAdd(activity);
        setContent('');
      }
    } finally {
      setSaving(false);
    }
  }

  function fmt(dateStr: string) {
    return new Date(dateStr + 'Z').toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {ACTIVITY_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={`Log a ${type}...`}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !content.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="space-y-3">
        {activities.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
        )}
        {activities.map(a => (
          <div key={a.id} className="flex gap-3 text-sm">
            <span className="text-lg leading-tight mt-0.5">{ACTIVITY_ICONS[a.type as ActivityType]}</span>
            <div className="flex-1">
              <p className="text-gray-800">{a.content}</p>
              <p className="text-xs text-gray-400 mt-0.5">{fmt(a.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
