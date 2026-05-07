'use client';
import { useState, useRef } from 'react';

// ─── Finance configuration ────────────────────────────────────────────────────

type Tab = 'car' | 'truck' | 'machinery' | 'cashflow';

const FINANCE = {
  car: {
    label: 'Car Finance', product: 'Car Finance',
    tagline: 'Business vehicles, SUVs & utes — new or used',
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af',
    min: 10000, max: 200000, step: 5000, defaultAmount: 50000,
    minTerm: 12, maxTerm: 84, defaultTerm: 60, rate: 7.49,
    features: ['24–48 hour approval', 'Up to 100% finance', 'Fixed repayments', 'New & used vehicles'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14l4 4v4a2 2 0 0 1-2 2h-2"/>
        <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
        <path d="M5 9h9l2 4H5V9z"/>
      </svg>
    ),
  },
  truck: {
    label: 'Truck Finance', product: 'Truck Finance',
    tagline: 'Light, medium & heavy commercial trucks',
    color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', text: '#c2410c',
    min: 20000, max: 500000, step: 10000, defaultAmount: 150000,
    minTerm: 12, maxTerm: 84, defaultTerm: 60, rate: 8.49,
    features: ['All truck categories', 'Chattel mortgage available', 'Up to 7-year terms', 'GST benefits'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="1" y="3" width="15" height="13" rx="1"/>
        <path d="M16 8h4l3 3v5h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  machinery: {
    label: 'Machinery Finance', product: 'Machinery Finance',
    tagline: 'Earthmoving, farming & industrial equipment',
    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', text: '#047857',
    min: 20000, max: 1000000, step: 10000, defaultAmount: 250000,
    minTerm: 12, maxTerm: 84, defaultTerm: 60, rate: 7.99,
    features: ['New & used equipment', 'Operating lease options', 'Tax-effective structures', 'Balloon payment options'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
  },
  cashflow: {
    label: 'Cashflow Finance', product: 'Cashflow Finance',
    tagline: 'Invoice finance & working capital solutions',
    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9',
    min: 20000, max: 500000, step: 10000, defaultAmount: 100000,
    minTerm: 3, maxTerm: 24, defaultTerm: 12, rate: 9.99,
    features: ['Unlock debtor book value', 'Flexible drawdown', 'No property security', 'Approval in days'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
} as const;

// ─── Calculator ───────────────────────────────────────────────────────────────

function pmt(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}

function aud(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n);
}

function audFull(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 2 }).format(n);
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  business_name: string;
  abn: string;
  years_trading: string;
  contact: string;
  phone: string;
  accountancy: string;
  accountant_name: string;
  accountant_email: string;
  product: string;
  finance_amount: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  business_name: '', abn: '', years_trading: '', contact: '', phone: '',
  accountancy: '', accountant_name: '', accountant_email: '',
  product: '', finance_amount: '', notes: '',
};

// ─── Page component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('car');
  const [amounts, setAmounts] = useState<Record<Tab, number>>({
    car: 50000, truck: 150000, machinery: 250000, cashflow: 100000,
  });
  const [terms, setTerms] = useState<Record<Tab, number>>({
    car: 60, truck: 60, machinery: 60, cashflow: 12,
  });

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const applyRef = useRef<HTMLDivElement>(null);

  const cfg = FINANCE[tab];
  const amount = amounts[tab];
  const term = terms[tab];
  const monthly = pmt(amount, cfg.rate, term);
  const totalRepaid = monthly * term;
  const totalInterest = totalRepaid - amount;

  function setAmount(t: Tab, v: number) {
    setAmounts(a => ({ ...a, [t]: v }));
  }
  function setTerm(t: Tab, v: number) {
    setTerms(s => ({ ...s, [t]: v }));
  }

  function applyWithCalc() {
    setForm(f => ({ ...f, product: cfg.product, finance_amount: aud(amount) }));
    applyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleField(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const abn = form.abn.replace(/\s/g, '');
    if (!/^\d{11}$/.test(abn)) {
      setFormError('ABN must be 11 digits. Please check and try again.');
      return;
    }
    if (!form.contact.trim()) {
      setFormError('Contact name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const parts = form.contact.trim().split(/\s+/);
      const firstname = parts[0];
      const lastname = parts.slice(1).join(' ') || '-';

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname,
          lastname,
          email:            form.accountant_email,
          phone:            form.phone,
          product:          form.product || cfg.product,
          source:           'Accountant Referral',
          status:           'New',
          state:            '',
          timeframe:        '',
          notes:            form.notes,
          business_name:    form.business_name,
          abn,
          years_trading:    form.years_trading,
          accountancy:      form.accountancy,
          accountant_name:  form.accountant_name,
          accountant_email: form.accountant_email,
          finance_amount:   form.finance_amount,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Submission failed. Please try again.');
      }
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: '#f8fafc' }}>

      {/* ── Navigation ── */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#1e40af,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: -0.5 }}>Fi</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', letterSpacing: -0.5 }}>Finfo Finance</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: -1 }}>Fast Business Finance</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="#apply"
              style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#1e40af,#3b82f6)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
              Apply Now
            </a>
            <a href="https://equipmentfinance.netlify.app/dashboard.html"
              style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 13, textDecoration: 'none', display: 'inline-block', background: '#fff' }}>
              CRM Login
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#1e40af 100%)', padding: '80px 24px 72px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 20% 50%, #60a5fa 0%, transparent 50%), radial-gradient(circle at 80% 50%, #818cf8 0%, transparent 50%)' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '6px 16px', marginBottom: 24 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
            <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>Referred by your accountant? Apply in minutes.</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px', letterSpacing: -1 }}>
            Fast Finance for<br />
            <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Australian Businesses
            </span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 'clamp(16px, 2vw, 20px)', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.65 }}>
            Specialist finance for cars, trucks, machinery and cashflow — structured by finance experts who understand your industry.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#calculator"
              style={{ padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none', display: 'inline-block' }}>
              Calculate Repayments
            </a>
            <a href="#apply"
              style={{ padding: '14px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none', display: 'inline-block', background: 'rgba(255,255,255,0.08)' }}>
              Submit a Referral
            </a>
          </div>
          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 44, flexWrap: 'wrap' }}>
            {[
              { icon: '🔒', label: 'Licensed & Regulated' },
              { icon: '⚡', label: '24–48hr Approvals' },
              { icon: '🇦🇺', label: 'Australian Owned' },
              { icon: '💼', label: '500+ Businesses Financed' },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{b.icon}</span>
                <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ background: '#fff', padding: '56px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: -0.5 }}>How It Works</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 44, fontSize: 16 }}>Accountants refer their clients in 3 simple steps</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 28 }}>
            {[
              { n: '1', title: 'Use the Calculator', desc: 'Get an indicative repayment estimate for your client using our live calculators below.' },
              { n: '2', title: 'Submit the Referral', desc: 'Complete the short referral form with business and contact details — takes under 2 minutes.' },
              { n: '3', title: 'We Call Your Client', desc: 'Our finance consultants contact the business directly and manage the full approval process.' },
            ].map(s => (
              <div key={s.n} style={{ textAlign: 'center', padding: '32px 24px', borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#1e40af,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff', fontWeight: 800, fontSize: 20 }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Finance Calculator ── */}
      <section id="calculator" style={{ background: '#f1f5f9', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: -0.5 }}>Finance Calculator</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 40, fontSize: 16 }}>Indicative repayments — select a finance type to get started</p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
            {(Object.keys(FINANCE) as Tab[]).map(t => {
              const c = FINANCE[t];
              const active = t === tab;
              return (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    padding: '10px 22px', borderRadius: 40, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    border: active ? `2px solid ${c.color}` : '2px solid #e2e8f0',
                    background: active ? c.bg : '#fff',
                    color: active ? c.text : '#64748b',
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
                  }}>
                  <span style={{ color: active ? c.color : '#94a3b8' }}>{c.icon}</span>
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Calculator card */}
          <div style={{ background: '#fff', borderRadius: 20, border: `2px solid ${cfg.border}`, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ background: cfg.bg, padding: '20px 32px', borderBottom: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: cfg.color }}>{cfg.icon}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: cfg.text }}>{cfg.label}</h3>
                <p style={{ margin: 0, fontSize: 13, color: cfg.color, opacity: 0.75 }}>{cfg.tagline}</p>
              </div>
            </div>

            <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {/* Left: sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {/* Amount */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Finance Amount</label>
                    <span style={{ fontSize: 18, fontWeight: 800, color: cfg.color }}>{aud(amount)}</span>
                  </div>
                  <input type="range"
                    min={cfg.min} max={cfg.max} step={cfg.step} value={amount}
                    onChange={e => setAmount(tab, +e.target.value)}
                    style={{ width: '100%', accentColor: cfg.color, height: 6 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{aud(cfg.min)}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{aud(cfg.max)}</span>
                  </div>
                </div>

                {/* Term */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Loan Term</label>
                    <span style={{ fontSize: 18, fontWeight: 800, color: cfg.color }}>{term} months</span>
                  </div>
                  <input type="range"
                    min={cfg.minTerm} max={cfg.maxTerm} step={tab === 'cashflow' ? 1 : 12} value={term}
                    onChange={e => setTerm(tab, +e.target.value)}
                    style={{ width: '100%', accentColor: cfg.color, height: 6 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{cfg.minTerm} mo</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{cfg.maxTerm} mo</span>
                  </div>
                </div>

                {/* Rate display */}
                <div style={{ padding: '12px 16px', borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <p style={{ margin: 0, fontSize: 12, color: cfg.text, fontWeight: 600 }}>
                    Indicative Rate: {cfg.rate}% p.a. &nbsp;·&nbsp; Comparison rate may vary
                  </p>
                </div>

                {/* Features */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {cfg.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: result */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <div style={{ width: '100%', background: cfg.bg, borderRadius: 16, border: `2px solid ${cfg.border}`, padding: '32px 24px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: cfg.text, textTransform: 'uppercase', letterSpacing: 1 }}>Est. Monthly Repayment</p>
                  <p style={{ margin: '0 0 4px', fontSize: 44, fontWeight: 900, color: cfg.color, letterSpacing: -1, lineHeight: 1 }}>
                    {audFull(monthly)}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>per month (indicative only)</p>
                </div>

                <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Repaid</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{aud(totalRepaid)}</p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Interest</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{aud(totalInterest)}</p>
                  </div>
                </div>

                <button onClick={applyWithCalc}
                  style={{ width: '100%', padding: '15px', borderRadius: 12, background: `linear-gradient(135deg,${cfg.color},${cfg.color}dd)`, color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Apply with These Details
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                  Estimates are indicative only. Final rates subject to assessment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Application Form ── */}
      <div ref={applyRef} />
      <section id="apply" style={{ background: '#fff', padding: '64px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 100, padding: '6px 16px', marginBottom: 16 }}>
              <span style={{ color: '#2563eb', fontSize: 13, fontWeight: 700 }}>⚡ Fast Approval Referral</span>
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5, marginBottom: 8 }}>Submit a Client Referral</h2>
            <p style={{ color: '#64748b', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
              Complete the details below and a finance consultant will contact your client within one business day.
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '56px 32px', borderRadius: 20, border: '2px solid #a7f3d0', background: '#ecfdf5' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#064e3b', marginBottom: 10 }}>Referral Submitted!</h3>
              <p style={{ color: '#065f46', fontSize: 16, marginBottom: 24 }}>
                Thank you. A finance consultant will contact your client within one business day.
              </p>
              <button onClick={() => { setSubmitted(false); setForm(EMPTY_FORM); }}
                style={{ padding: '12px 28px', borderRadius: 10, background: '#059669', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
                Submit Another Referral
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: '#f8fafc', borderRadius: 20, border: '1px solid #e2e8f0', padding: '36px 32px' }}>

              {/* Business Details */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1e40af,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Client Business Details</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Business Name" required>
                      <input name="business_name" value={form.business_name} onChange={handleField} required
                        placeholder="Acme Pty Ltd" style={inputStyle} />
                    </Field>
                  </div>
                  <Field label="ABN" required hint="11-digit Australian Business Number">
                    <input name="abn" value={form.abn} onChange={handleField} required
                      placeholder="12 345 678 901" maxLength={14} style={inputStyle} />
                  </Field>
                  <Field label="Years in Business" required>
                    <select name="years_trading" value={form.years_trading} onChange={handleField} required style={inputStyle}>
                      <option value="">— Select —</option>
                      <option value="Less than 1 year">Less than 1 year</option>
                      <option value="1–2 years">1–2 years</option>
                      <option value="2–5 years">2–5 years</option>
                      <option value="5–10 years">5–10 years</option>
                      <option value="10+ years">10+ years</option>
                    </select>
                  </Field>
                  <Field label="Contact Person" required hint="Client's name for our call">
                    <input name="contact" value={form.contact} onChange={handleField} required
                      placeholder="Jane Smith" style={inputStyle} />
                  </Field>
                  <Field label="Contact Phone" required>
                    <input name="phone" value={form.phone} onChange={handleField} required
                      type="tel" placeholder="04XX XXX XXX" style={inputStyle} />
                  </Field>
                </div>
              </div>

              {/* Finance Details */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1e40af,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
                      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Finance Details</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Finance Type" required>
                    <select name="product" value={form.product} onChange={handleField} required style={inputStyle}>
                      <option value="">— Select type —</option>
                      <option value="Car Finance">Car Finance</option>
                      <option value="Truck Finance">Truck Finance</option>
                      <option value="Machinery Finance">Machinery Finance</option>
                      <option value="Cashflow Finance">Cashflow Finance</option>
                    </select>
                  </Field>
                  <Field label="Approximate Amount" hint="From calculator or estimate">
                    <input name="finance_amount" value={form.finance_amount} onChange={handleField}
                      placeholder="e.g. $150,000" style={inputStyle} />
                  </Field>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Additional Notes" hint="Any relevant details for our team">
                      <textarea name="notes" value={form.notes} onChange={handleField}
                        rows={3} placeholder="e.g. urgency, specific asset, special circumstances…"
                        style={{ ...inputStyle, resize: 'vertical' }} />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Accountant Details */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#f59e0b,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Referring Accountant</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Accountancy Firm" required>
                      <input name="accountancy" value={form.accountancy} onChange={handleField} required
                        placeholder="Smith & Associates Accounting" style={inputStyle} />
                    </Field>
                  </div>
                  <Field label="Accountant Name" required>
                    <input name="accountant_name" value={form.accountant_name} onChange={handleField} required
                      placeholder="John Smith" style={inputStyle} />
                  </Field>
                  <Field label="Accountant Email" required>
                    <input name="accountant_email" value={form.accountant_email} onChange={handleField} required
                      type="email" placeholder="john@smithaccounting.com.au" style={inputStyle} />
                  </Field>
                </div>
              </div>

              {formError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14, fontWeight: 500 }}>
                  {formError}
                </div>
              )}

              <button type="submit" disabled={submitting}
                style={{ width: '100%', padding: '16px', borderRadius: 12, background: 'linear-gradient(135deg,#1e40af,#3b82f6)', color: '#fff', fontWeight: 800, fontSize: 17, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.75 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {submitting ? (
                  <>
                    <svg style={{ animation: 'spin 0.8s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Submitting Referral…
                  </>
                ) : (
                  <>
                    Submit Fast Approval Referral
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
              <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
                By submitting you confirm the client has consented to being contacted by Finfo Finance.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Why Finfo ── */}
      <section style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: -0.5 }}>Why Accountants Choose Finfo</h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 44, fontSize: 16 }}>We make you look good in front of your clients</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 24 }}>
            {[
              { icon: '⚡', title: 'Fast Approvals', desc: 'Most applications approved within 24–48 hours so your clients can move quickly.' },
              { icon: '🎯', title: 'Specialist Lenders', desc: 'Access to over 40 lenders including banks, non-banks and specialty funders.' },
              { icon: '🤝', title: 'Referral Partnership', desc: 'Every referral is tracked and you receive updates on your client\'s progress.' },
              { icon: '🛡️', title: 'Compliance First', desc: 'Fully licensed and compliant. We protect you and your clients throughout.' },
            ].map(w => (
              <div key={w.title} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '28px 24px' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{w.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{w.title}</h3>
                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0f172a', padding: '32px 24px', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1e40af,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>Fi</span>
              </div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Finfo Finance</span>
            </div>
            <p style={{ color: '#475569', fontSize: 12, margin: 0, maxWidth: 400, lineHeight: 1.6 }}>
              Indicative repayments are estimates only and do not constitute a credit offer. Final rates and approvals subject to full credit assessment. Australian Credit Licence holder.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="https://equipmentfinance.netlify.app/dashboard.html" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>CRM Login</a>
            <span style={{ color: '#1e293b' }}>|</span>
            <span style={{ color: '#475569', fontSize: 13 }}>© {new Date().getFullYear()} Finfo Finance Pty Ltd</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=range] { cursor: pointer; }
        * { box-sizing: border-box; }
        @media (max-width: 640px) {
          .calc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#fff',
  fontSize: 14,
  color: '#0f172a',
  outline: 'none',
};

function Field({ label, required, hint, children }: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        {hint && <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
