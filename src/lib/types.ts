export type LeadStatus = 'New' | 'Contacted' | 'In Progress' | 'Referred' | 'Completed' | 'Lost';
export type ActivityType = 'note' | 'call' | 'email' | 'meeting';

export interface Lead {
  id: string;
  firstname:  string;
  lastname:   string;
  email:      string;
  phone:      string;
  state:      string;
  timeframe:  string;
  product:    string;
  status:     LeadStatus;
  source:     string;
  notes:      string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id:         string;
  lead_id:    string;
  type:       ActivityType;
  content:    string;
  created_at: string;
}

export const PRODUCTS = [
  { id: 'Car Loan',          group: 'Loans',      color: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
  { id: 'Boat Loan',         group: 'Loans',      color: '#0ea5e9', bg: '#f0f9ff', text: '#0369a1' },
  { id: 'Personal Loan',     group: 'Loans',      color: '#6366f1', bg: '#eef2ff', text: '#4338ca' },
  { id: 'Mortgage',          group: 'Property',   color: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9' },
  { id: 'Accountant',        group: 'Advisory',   color: '#f59e0b', bg: '#fffbeb', text: '#b45309' },
  { id: 'Financial Adviser', group: 'Advisory',   color: '#f97316', bg: '#fff7ed', text: '#c2410c' },
  { id: 'SMSF Setup',        group: 'Advisory',   color: '#10b981', bg: '#ecfdf5', text: '#047857' },
  { id: 'Insurance',         group: 'Protection', color: '#ef4444', bg: '#fef2f2', text: '#b91c1c' },
] as const;

export const STATUSES: { id: LeadStatus; color: string }[] = [
  { id: 'New',         color: 'bg-blue-100 text-blue-700'   },
  { id: 'Contacted',   color: 'bg-yellow-100 text-yellow-700' },
  { id: 'In Progress', color: 'bg-purple-100 text-purple-700' },
  { id: 'Referred',    color: 'bg-orange-100 text-orange-700' },
  { id: 'Completed',   color: 'bg-green-100 text-green-700'  },
  { id: 'Lost',        color: 'bg-red-100 text-red-700'      },
];

export const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

export const TIMEFRAMES = ['ASAP', '1–3 months', '3–6 months', '6–12 months', 'Just researching'];
