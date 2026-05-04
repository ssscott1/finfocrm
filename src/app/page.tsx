'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Users, TrendingUp, Award, BarChart2, ChevronUp, ChevronDown, Pencil, Trash2, Eye } from 'lucide-react';
import { Lead, LeadStatus, STATUS_LABELS } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import LeadForm from '@/components/LeadForm';
import Modal from '@/components/Modal';
import LeadDetail from './LeadDetail';

interface Stats {
  total: number;
  byStatus: { status: string; count: number }[];
  totalValue: number;
  wonValue: number;
}

type SortKey = 'created_at' | 'name' | 'value' | 'status' | 'updated_at';

function fmt(v: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState<SortKey>('created_at');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [modal, setModal] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams({ search, sort, dir });
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/leads?${params}`);
    if (res.ok) setLeads(await res.json());
  }, [search, sort, dir, statusFilter]);

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats');
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  function toggleSort(key: SortKey) {
    if (sort === key) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(key); setDir('desc'); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sort !== k) return <ChevronUp size={14} className="text-gray-300" />;
    return dir === 'asc' ? <ChevronUp size={14} className="text-blue-500" /> : <ChevronDown size={14} className="text-blue-500" />;
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this lead?')) return;
    setDeleting(id);
    await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    setLeads(l => l.filter(x => x.id !== id));
    fetchStats();
    setDeleting(null);
  }

  function handleSaved(lead: Lead) {
    setLeads(l => {
      const idx = l.findIndex(x => x.id === lead.id);
      if (idx >= 0) { const n = [...l]; n[idx] = lead; return n; }
      return [lead, ...l];
    });
    setModal(null);
    fetchStats();
  }

  const statusCounts = Object.fromEntries(
    (stats?.byStatus || []).map(s => [s.status, s.count])
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Finfo CRM</h1>
          </div>
          <button
            onClick={() => { setSelected(null); setModal('add'); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<Users size={20} className="text-blue-500" />} label="Total Leads" value={stats.total.toString()} bg="bg-blue-50" />
            <StatCard icon={<BarChart2 size={20} className="text-purple-500" />} label="Pipeline Value" value={fmt(stats.totalValue)} bg="bg-purple-50" />
            <StatCard icon={<Award size={20} className="text-green-500" />} label="Won Value" value={fmt(stats.wonValue)} bg="bg-green-50" />
            <StatCard icon={<TrendingUp size={20} className="text-orange-500" />} label="Won Deals" value={(statusCounts['won'] || 0).toString()} bg="bg-orange-50" />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {(['', 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === '' ? 'All' : STATUS_LABELS[s as LeadStatus]}
              {s !== '' && statusCounts[s] !== undefined && (
                <span className="ml-1 opacity-70">({statusCounts[s]})</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads by name, email, company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    { key: 'name' as SortKey, label: 'Name' },
                    { key: 'status' as SortKey, label: 'Status' },
                    { key: 'value' as SortKey, label: 'Value' },
                    { key: 'created_at' as SortKey, label: 'Created' },
                    { key: 'updated_at' as SortKey, label: 'Updated' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-900"
                    >
                      <span className="flex items-center gap-1">{col.label} <SortIcon k={col.key} /></span>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No leads found. Add your first lead!
                    </td>
                  </tr>
                )}
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{lead.name}</p>
                        {lead.company && <p className="text-xs text-gray-400">{lead.company}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3 font-medium text-gray-700">{lead.value > 0 ? fmt(lead.value) : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(lead.created_at + 'Z').toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(lead.updated_at + 'Z').toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500">
                        {lead.email && <p>{lead.email}</p>}
                        {lead.phone && <p>{lead.phone}</p>}
                        {!lead.email && !lead.phone && <span className="text-gray-300">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setSelected(lead); setModal('view'); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                          title="View"
                        ><Eye size={15} /></button>
                        <button
                          onClick={() => { setSelected(lead); setModal('edit'); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                          title="Edit"
                        ><Pencil size={15} /></button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          disabled={deleting === lead.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                          title="Delete"
                        ><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modal === 'add' && (
        <Modal title="Add New Lead" onClose={() => setModal(null)}>
          <LeadForm onSave={handleSaved} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'edit' && selected && (
        <Modal title="Edit Lead" onClose={() => setModal(null)}>
          <LeadForm lead={selected} onSave={handleSaved} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'view' && selected && (
        <Modal title={selected.name} onClose={() => setModal(null)} wide>
          <LeadDetail
            lead={selected}
            onEdit={() => setModal('edit')}
            onLeadUpdate={(updated) => {
              setSelected(updated);
              setLeads(l => l.map(x => x.id === updated.id ? updated : x));
              fetchStats();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
