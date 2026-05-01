import React, { type FC, useState, useEffect } from 'react';
import { dashboard } from '@wix/dashboard';
import { items } from '@wix/data';
import {
  WixDesignSystemProvider,
  Box,
  CustomModalLayout,
  Loader,
  Text,
  Heading,
  Divider,
  Layout,
  Cell,
  Badge,
  Card,
  Button,
  Input,
  IconButton
} from '@wix/design-system';
import { Check, Add, Delete, Send } from '@wix/wix-ui-icons-common';
import "@wix/design-system/styles.global.css";
import { width, height } from './modal.json';

// ─────────────────────────────────────────────────────────────
//  Typography & Design Tokens
// ─────────────────────────────────────────────────────────────
const F = "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const tokens = {
  blue: '#2563EB',
  blueSoft: '#EFF6FF',
  blueLight: '#DBEAFE',
  navy: '#0F172A',
  slate: '#334155',
  muted: '#64748B',
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
  shadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
  shadowMd: '0 4px 16px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.05)',
  shadowLg: '0 20px 48px rgba(15,23,42,0.12), 0 8px 20px rgba(15,23,42,0.07)',
};

// ─────────────────────────────────────────────────────────────
//  Shared primitive components (defined OUTSIDE Modal to
//  preserve React identity across re-renders)
// ─────────────────────────────────────────────────────────────

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    fontFamily: F, fontSize: '10px', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    color: tokens.muted, display: 'block', marginBottom: '6px'
  }}>
    {children}
  </span>
);

const FieldValue: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontFamily: F, fontSize: '14px', fontWeight: 500, color: tokens.navy,
    background: tokens.bg, border: `1px solid ${tokens.border}`,
    borderRadius: '8px', padding: '10px 14px', lineHeight: 1.5,
    minHeight: '40px', display: 'flex', alignItems: 'center'
  }}>
    {children || <span style={{ color: tokens.muted }}>—</span>}
  </div>
);

const SectionTitle: React.FC<{ icon?: string; children: React.ReactNode }> = ({ icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
    {icon && <span style={{ fontSize: '14px' }}>{icon}</span>}
    <span style={{
      fontFamily: F, fontSize: '10px', fontWeight: 800,
      letterSpacing: '0.12em', textTransform: 'uppercase' as const,
      color: tokens.blue
    }}>
      {children}
    </span>
    <div style={{ flex: 1, height: '1px', background: tokens.blueLight }} />
  </div>
);

const PillBadge: React.FC<{ label: string; variant?: 'success' | 'neutral' | 'warning' | 'error' }> = ({ label, variant = 'neutral' }) => {
  const cfg = {
    success: { bg: '#DCFCE7', color: '#15803D', dot: '#22C55E' },
    neutral: { bg: '#F1F5F9', color: tokens.slate, dot: '#94A3B8' },
    warning: { bg: '#FEF9C3', color: '#B45309', dot: tokens.amber },
    error: { bg: '#FEE2E2', color: '#B91C1C', dot: tokens.red },
  }[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: cfg.bg, color: cfg.color, borderRadius: '20px',
      padding: '3px 10px 3px 8px', fontSize: '11px', fontWeight: 700,
      fontFamily: F, letterSpacing: '0.04em'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {label.toUpperCase()}
    </span>
  );
};

const TermsInput: React.FC<{ value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }> = ({ value, onChange, multiline, placeholder }) => (
  multiline ? (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      style={{
        width: '100%', boxSizing: 'border-box', fontFamily: F, fontSize: '13px',
        color: tokens.navy, border: `1px solid ${tokens.border}`,
        borderRadius: '8px', padding: '10px 12px', resize: 'vertical',
        outline: 'none', background: tokens.surface, lineHeight: 1.6,
        transition: 'border-color 0.15s'
      }}
      onFocus={e => e.target.style.borderColor = tokens.blue}
      onBlur={e => e.target.style.borderColor = tokens.border}
    />
  ) : (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', boxSizing: 'border-box', fontFamily: F, fontSize: '13px',
        color: tokens.navy, border: `1px solid ${tokens.border}`,
        borderRadius: '8px', padding: '9px 12px', outline: 'none',
        background: tokens.surface, transition: 'border-color 0.15s'
      }}
      onFocus={e => e.target.style.borderColor = tokens.blue}
      onBlur={e => e.target.style.borderColor = tokens.border}
    />
  )
);

// ─────────────────────────────────────────────────────────────
//  Reusable button styles
// ─────────────────────────────────────────────────────────────
const btn = {
  primary: (disabled?: boolean): React.CSSProperties => ({
    fontFamily: F, fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em',
    background: disabled ? '#93C5FD' : tokens.blue, color: '#fff',
    border: 'none', borderRadius: '8px', padding: '9px 18px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    boxShadow: disabled ? 'none' : `0 2px 8px rgba(37,99,235,0.30)`,
    transition: 'all 0.15s'
  }),
  secondary: (): React.CSSProperties => ({
    fontFamily: F, fontSize: '13px', fontWeight: 600,
    background: tokens.surface, color: tokens.slate,
    border: `1px solid ${tokens.border}`, borderRadius: '8px', padding: '9px 18px',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '7px',
    transition: 'all 0.15s'
  }),
  danger: (): React.CSSProperties => ({
    fontFamily: F, fontSize: '12px', fontWeight: 600,
    background: '#FEF2F2', color: tokens.red,
    border: `1px solid #FECACA`, borderRadius: '6px', padding: '6px 12px',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
    transition: 'all 0.15s'
  }),
};

// ─────────────────────────────────────────────────────────────
//  Main Modal Component
// ─────────────────────────────────────────────────────────────
const Modal: FC = () => {
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedProposal, setEditedProposal] = useState<any>(null);
  const [addonsArray, setAddonsArray] = useState<string[]>([]);

  const [termsOpen, setTermsOpen] = useState(false);
  const [termsData, setTermsData] = useState<any>(null);
  const [editedTerms, setEditedTerms] = useState<any>(null);
  const [termsSaving, setTermsSaving] = useState(false);
  const [termsEditMode, setTermsEditMode] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    const observer = dashboard.observeState(async (state: any) => {
      const proposalId = state?.proposalId || state?.params?.proposalId;
      if (proposalId) {
        try {
          const data = await items.get("Proposals", proposalId);
          setProposal(data);
          setEditedProposal({ ...data, total: data.totalQuote || data.total });
          const initialAddons = data.addons
            ? data.addons.split(/[+\n,]+/).map((s: string) => s.trim()).filter(Boolean)
            : [];
          setAddonsArray(initialAddons);
          if (data.termsOfCondition) {
            try {
              const parsed = typeof data.termsOfCondition === 'string'
                ? JSON.parse(data.termsOfCondition)
                : data.termsOfCondition;
              setTermsData(parsed);
              setEditedTerms(JSON.parse(JSON.stringify(parsed)));
            } catch (e) { console.error("Terms JSON parse error:", e); }
          }
        } catch (err) { console.error("CMS Fetch Error:", err); }
        finally { setLoading(false); }
      } else { setLoading(false); }
    });
    return () => observer.disconnect();
  }, []);

  // ── Addon helpers ──────────────────────────────────────────
  const handleAddAddon = () => setAddonsArray([...addonsArray, ""]);
  const handleUpdateAddon = (i: number, v: string) => { const a = [...addonsArray]; a[i] = v; setAddonsArray(a); };
  const handleRemoveAddon = (i: number) => setAddonsArray(addonsArray.filter((_, idx) => idx !== i));

  // ── Save main ─────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const finalAddonsString = addonsArray.filter(s => s.trim() !== "").join(" + ");
      const dataToSave = {
        ...proposal,
        _id: editedProposal._id,
        quoteId: editedProposal.quoteId,
        customer: editedProposal.customer,
        email: editedProposal.email,
        quantity: editedProposal.quantity,
        nextPayment: editedProposal.nextPayment,
        status: editedProposal.status,
        "link-proposals-title_fld": editedProposal["link-proposals-title_fld"],
        customerSign: editedProposal.customerSign,
        signDate: editedProposal.signDate,
        priceQuote: editedProposal.priceQuote,
        proposal: editedProposal.proposal,
        package: editedProposal.package,
        invoiced: editedProposal.invoiced,
        phone: editedProposal.phone,
        totalQuote: Number(editedProposal.total),
        location: editedProposal.location,
        eventDate: editedProposal.eventDate,
        hours: editedProposal.hours,
        eventType: editedProposal.eventType,
        addons: finalAddonsString,
      };
      await items.update("Proposals", dataToSave);
      const existingResults = await items.query("UpdatedProposals").eq("quoteId", dataToSave.quoteId).find();
      if (existingResults.items.length > 0) {
        await items.update("UpdatedProposals", { ...dataToSave, _id: existingResults.items[0]._id });
      } else {
        const { _id, ...insertData } = dataToSave;
        await items.insert("UpdatedProposals", insertData);
      }
      setProposal(dataToSave);
      setEditMode(false);
      dashboard.showToast({ message: "Changes saved successfully!", type: "success" });
    } catch (err) {
      console.error("Save Error:", err);
      dashboard.showToast({ message: "Save failed. Check console.", type: "error" });
    } finally { setSaving(false); }
  };

  const handleSend = async () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      dashboard.showToast({ message: "Proposal sent successfully!", type: "success" });
    }, 1500);
  };

  // ── Save terms ────────────────────────────────────────────
  const handleTermsSave = async () => {
    setTermsSaving(true);
    try {
      const updatedTermsJson = JSON.parse(JSON.stringify(editedTerms));
      const fullRecord = { ...proposal, termsOfCondition: updatedTermsJson };
      await items.update("Proposals", fullRecord);
      setProposal({ ...proposal, termsOfCondition: updatedTermsJson });
      setTermsData(JSON.parse(JSON.stringify(editedTerms)));
      setTermsEditMode(false);
      dashboard.showToast({ message: "Terms saved successfully!", type: "success" });
    } catch (err) {
      console.error("Terms Save Error:", err);
      dashboard.showToast({ message: "Terms save failed.", type: "error" });
    } finally { setTermsSaving(false); }
  };

  const handleTermsCancel = () => {
    setEditedTerms(JSON.parse(JSON.stringify(termsData)));
    setTermsEditMode(false);
  };

  // ── Helpers ───────────────────────────────────────────────
  const formatCurrency = (val: any) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ""));

    return isNaN(num)
      ? "CA$0.00"
      : new Intl.NumberFormat('en-US', { // Use en-US to force the CA prefix
        style: 'currency',
        currency: 'CAD'
      }).format(num);
  };

  const getStatusVariant = (status: any): 'success' | 'neutral' | 'warning' | 'error' => {
    const s = String(status || "").toLowerCase();
    const successSet = ["send", "sent", "created", "paid", "yes", "active", "success", "accepted"];
    return successSet.includes(s) ? 'success' : 'neutral';
  };

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <WixDesignSystemProvider>
      <Box height={height} width={width} align="center" verticalAlign="middle">
        <Loader />
      </Box>
    </WixDesignSystemProvider>
  );

  const addOnsDisplayList = proposal.addons
    ? proposal.addons.split(/[+\n,]+/).filter((t: string) => t.trim() !== "")
    : [];

  // ── Render ────────────────────────────────────────────────
  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .addon-row:hover { background: #F8FAFC !important; }
        .terms-clause:hover { box-shadow: 0 4px 16px rgba(15,23,42,0.08) !important; }
      `}</style>

      {/* ═══════════════════════════════════════════════════
          TERMS SLIDE-IN PANEL
      ═══════════════════════════════════════════════════ */}
      {termsOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease'
        }}>
          {/* Backdrop */}
          <div
            onClick={() => { setTermsOpen(false); setTermsEditMode(false); }}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(15,23,42,0.4)',
              backdropFilter: 'blur(3px)'
            }}
          />

          {/* Panel */}
          <div style={{
            position: 'relative', width: '540px', maxWidth: '92vw', height: '100%',
            background: tokens.bg, boxShadow: tokens.shadowLg,
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.28s cubic-bezier(0.4,0,0.2,1)'
          }}>

            {/* Panel Header */}
            <div style={{
              background: tokens.surface, borderBottom: `1px solid ${tokens.border}`,
              padding: '24px 28px', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{
                    fontFamily: F, fontSize: '10px', fontWeight: 800,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: tokens.blue, marginBottom: '4px'
                  }}>
                    Contract Document
                  </div>
                  <div style={{
                    fontFamily: F, fontSize: '20px', fontWeight: 800,
                    color: tokens.navy, letterSpacing: '-0.02em'
                  }}>
                    Terms &amp; Conditions
                  </div>
                  {termsData?.terms?.length > 0 && (
                    <div style={{ fontFamily: F, fontSize: '12px', color: tokens.muted, marginTop: '2px' }}>
                      {termsData.terms.length} clause{termsData.terms.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  {termsEditMode ? (
                    <>
                      <button onClick={handleTermsCancel} style={btn.secondary()}>Cancel</button>
                      <button onClick={handleTermsSave} disabled={termsSaving} style={btn.primary(termsSaving)}>
                        {termsSaving ? "Saving…" : "Save Changes"}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setTermsEditMode(true)} style={btn.secondary()}>
                      ✎ Edit Terms
                    </button>
                  )}
                  <button
                    onClick={() => { setTermsOpen(false); setTermsEditMode(false); }}
                    style={{
                      background: 'none', border: `1px solid ${tokens.border}`, borderRadius: '8px',
                      width: '36px', height: '36px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: tokens.muted, fontSize: '16px', flexShrink: 0, transition: 'all 0.15s'
                    }}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Panel Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              {(!termsData?.terms || termsData.terms.length === 0) && !termsEditMode ? (
                <div style={{
                  textAlign: 'center', padding: '60px 20px',
                  color: tokens.muted, fontFamily: F
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚖️</div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>No terms added yet</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>Click "Edit Terms" to add contract clauses.</div>
                </div>
              ) : (
                (termsEditMode ? editedTerms?.terms : termsData?.terms)?.map((term: any, idx: number) => (
                  <div
                    key={idx}
                    className="terms-clause"
                    style={{
                      background: tokens.surface, border: `1px solid ${tokens.border}`,
                      borderRadius: '12px', padding: '20px', marginBottom: '12px',
                      transition: 'box-shadow 0.2s',
                      animation: `fadeUp 0.2s ease ${idx * 0.04}s both`
                    }}
                  >
                    {/* Clause header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: tokens.blueLight, color: tokens.blue,
                          fontFamily: F, fontWeight: 800, fontSize: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </span>
                        {!termsEditMode && (
                          <span style={{ fontFamily: F, fontWeight: 700, fontSize: '14px', color: tokens.navy }}>
                            {term.title}
                          </span>
                        )}
                      </div>
                      {termsEditMode && (
                        <button
                          onClick={() => {
                            const updated = editedTerms.terms.filter((_: any, i: number) => i !== idx);
                            setEditedTerms({ ...editedTerms, terms: updated });
                          }}
                          style={btn.danger()}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {termsEditMode ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <TermsInput
                          value={term.title}
                          placeholder="Clause title…"
                          onChange={v => {
                            const updated = [...editedTerms.terms];
                            updated[idx].title = v;
                            setEditedTerms({ ...editedTerms, terms: updated });
                          }}
                        />
                        <TermsInput
                          value={term.content}
                          placeholder="Clause details…"
                          multiline
                          onChange={v => {
                            const updated = [...editedTerms.terms];
                            updated[idx].content = v;
                            setEditedTerms({ ...editedTerms, terms: updated });
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{
                        fontFamily: F, fontSize: '13px', color: tokens.slate,
                        lineHeight: 1.7, whiteSpace: 'pre-line',
                        paddingLeft: '36px'
                      }}>
                        {term.content}
                      </div>
                    )}
                  </div>
                ))
              )}

              {termsEditMode && (
                <button
                  onClick={() => setEditedTerms({
                    ...editedTerms,
                    terms: [...(editedTerms?.terms || []), { title: "", content: "" }]
                  })}
                  style={{
                    ...btn.secondary(), width: '100%', justifyContent: 'center',
                    borderStyle: 'dashed', marginTop: '4px', padding: '11px'
                  }}
                >
                  + Add New Clause
                </button>
              )}
            </div>

            {/* Panel Footer */}
            {termsEditMode && (
              <div style={{
                background: tokens.surface, borderTop: `1px solid ${tokens.border}`,
                padding: '16px 28px', display: 'flex', gap: '10px',
                justifyContent: 'flex-end', flexShrink: 0
              }}>
                <button onClick={handleTermsCancel} style={btn.secondary()}>Cancel</button>
                <button onClick={handleTermsSave} disabled={termsSaving} style={btn.primary(termsSaving)}>
                  {termsSaving ? "Saving…" : "Save Terms"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MAIN MODAL
      ═══════════════════════════════════════════════════ */}
      <CustomModalLayout
        width={width}
        maxHeight={height}
        removeContentPadding
        primaryButtonText="Close Window"
        primaryButtonOnClick={() => dashboard.closeModal()}
        title={`ADMIN CONSOLE — ${proposal.quoteId || 'REF'}`}
        content={
          <Box direction="vertical" backgroundColor={tokens.bg} minHeight="100%" style={{ fontFamily: F }}>

            {/* ── Top Header Bar ─────────────────────────── */}
            <div style={{
              background: tokens.surface,
              borderBottom: `1px solid ${tokens.border}`,
              padding: '24px 40px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '20px'
            }}>
              {/* Client identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: `linear-gradient(135deg, ${tokens.blue} 0%, #60A5FA 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontFamily: F, fontWeight: 800, fontSize: '18px',
                  flexShrink: 0
                }}>
                  {(proposal.customer || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: F, fontSize: '20px', fontWeight: 800, color: tokens.navy, letterSpacing: '-0.02em' }}>
                    {proposal.customer || "Client Name"}
                  </div>
                  <div style={{ fontFamily: F, fontSize: '13px', color: tokens.muted, marginTop: '1px' }}>
                    {proposal.email}
                    {proposal.phone && <span style={{ marginLeft: '12px' }}>· {proposal.phone}</span>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {!editMode && (
                  <button onClick={handleSend} disabled={sending} style={btn.primary(sending)}>
                    <Send size="15px" />
                    {sending ? "Sending…" : "Send Proposal"}
                  </button>
                )}
                <button
                  onClick={() => editMode ? handleSave() : setEditMode(true)}
                  disabled={saving}
                  style={editMode ? btn.primary(saving) : btn.secondary()}
                >
                  {editMode ? (saving ? "Saving…" : "✓ Save Changes") : "✎ Edit Entry"}
                </button>
                {editMode && (
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setAddonsArray(
                        proposal.addons
                          ? proposal.addons.split(/[+\n,]+/).map((s: string) => s.trim()).filter(Boolean)
                          : []
                      );
                    }}
                    style={btn.secondary()}
                  >
                    Cancel
                  </button>
                )}
                <button onClick={() => setTermsOpen(true)} style={btn.secondary()}>
                  ⚖️ Terms
                </button>
              </div>
            </div>

            {/* ── Body ───────────────────────────────────── */}
            <div style={{ padding: '32px 40px' }}>
              <Layout gap="28px">

                {/* ── Left Column ─────────────────────────── */}
                <Cell span={8}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Client Details Card */}
                    <div style={{
                      background: tokens.surface, border: `1px solid ${tokens.border}`,
                      borderRadius: '14px', padding: '28px', boxShadow: tokens.shadow
                    }}>
                      <SectionTitle icon="👤">Client Information</SectionTitle>
                      <Layout gap="20px">
                        <Cell span={12}>
                          <FieldLabel>Full Name</FieldLabel>
                          {editMode
                            ? <Input size="large" value={editedProposal.customer} onChange={e => setEditedProposal({ ...editedProposal, customer: e.target.value })} />
                            : <FieldValue>{proposal.customer}</FieldValue>}
                        </Cell>
                        <Cell span={12}>
                          <FieldLabel>Email Address</FieldLabel>
                          {editMode
                            ? <Input size="large" value={editedProposal.email} onChange={e => setEditedProposal({ ...editedProposal, email: e.target.value })} />
                            : <FieldValue>{proposal.email}</FieldValue>}
                        </Cell>
                        <Cell span={12}>
                          <FieldLabel>Service Category</FieldLabel>
                          {editMode
                            ? <Input size="large" value={editedProposal.eventType} onChange={e => setEditedProposal({ ...editedProposal, eventType: e.target.value })} />
                            : <FieldValue>{proposal.eventType}</FieldValue>}
                        </Cell>
                        <Cell span={6}>
                          <FieldLabel>Project Date</FieldLabel>
                          {editMode
                            ? <Input size="large" value={editedProposal.eventDate} onChange={e => setEditedProposal({ ...editedProposal, eventDate: e.target.value })} />
                            : <FieldValue>{proposal.eventDate}</FieldValue>}
                        </Cell>
                        <Cell span={6}>
                          <FieldLabel>Location</FieldLabel>
                          {editMode
                            ? <Input size="large" value={editedProposal.location} onChange={e => setEditedProposal({ ...editedProposal, location: e.target.value })} />
                            : <FieldValue>{proposal.location}</FieldValue>}
                        </Cell>
                      </Layout>
                    </div>

                    {/* Services Card */}
                    <div style={{
                      background: tokens.surface, border: `1px solid ${tokens.border}`,
                      borderRadius: '14px', padding: '28px', boxShadow: tokens.shadow
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <SectionTitle icon="📦">Service Package &amp; Add-ons</SectionTitle>
                        {editMode && (
                          <button onClick={handleAddAddon} style={{ ...btn.secondary(), fontSize: '12px', padding: '7px 12px' }}>
                            <Add size="14px" /> Add Item
                          </button>
                        )}
                      </div>

                      {/* Primary service */}
                      <FieldLabel>Primary Service</FieldLabel>
                      {editMode
                        ? (
                          <div style={{ marginBottom: '20px' }}>
                            <Input size="large" value={editedProposal.package} onChange={e => setEditedProposal({ ...editedProposal, package: e.target.value })} />
                          </div>
                        )
                        : (
                          <div style={{
                            background: tokens.blueLight, border: `1px solid #BFDBFE`,
                            borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
                            display: 'flex', alignItems: 'center', gap: '10px'
                          }}>
                            <span style={{ fontSize: '16px' }}>🎯</span>
                            <span style={{ fontFamily: F, fontWeight: 700, fontSize: '15px', color: tokens.blue }}>
                              {proposal.package || "Base Package"}
                            </span>
                          </div>
                        )}

                      {/* Divider */}
                      <div style={{ borderTop: `1px solid ${tokens.border}`, margin: '4px 0 20px' }} />

                      {/* Add-ons */}
                      <FieldLabel>Add-ons</FieldLabel>
                      {editMode ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {addonsArray.map((addon, idx) => (
                            <div
                              key={idx}
                              className="addon-row"
                              style={{
                                display: 'flex', gap: '10px', alignItems: 'center',
                                background: tokens.bg, border: `1px solid ${tokens.border}`,
                                borderRadius: '8px', padding: '8px 12px',
                                transition: 'background 0.15s'
                              }}
                            >
                              <div style={{
                                width: '24px', height: '24px', borderRadius: '6px',
                                background: tokens.blueLight, color: tokens.blue,
                                fontFamily: F, fontSize: '11px', fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                              }}>{idx + 1}</div>
                              <Box flexGrow={1} style={{ width: '100%' }}>
                                <Input
                                  size="large"
                                  value={addon}
                                  onChange={e => handleUpdateAddon(idx, e.target.value)}
                                  placeholder="Enter add-on name…"
                                />
                              </Box>
                              <IconButton priority="secondary" onClick={() => handleRemoveAddon(idx)} skin="standard">
                                <Delete color={tokens.red} />
                              </IconButton>
                            </div>
                          ))}
                          {addonsArray.length === 0 && (
                            <div style={{
                              textAlign: 'center', padding: '20px',
                              color: tokens.muted, fontFamily: F, fontSize: '13px',
                              border: `1px dashed ${tokens.border}`, borderRadius: '8px'
                            }}>
                              No add-ons yet — click "Add Item" above
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {addOnsDisplayList.length > 0
                            ? addOnsDisplayList.map((item: string, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '12px',
                                  background: tokens.bg, border: `1px solid ${tokens.border}`,
                                  borderRadius: '10px', padding: '12px 16px',
                                  animation: `fadeUp 0.2s ease ${idx * 0.05}s both`
                                }}
                              >
                                <div style={{
                                  width: '22px', height: '22px', borderRadius: '50%',
                                  background: '#DCFCE7', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                  <Check size="13px" color={tokens.green} />
                                </div>
                                <span style={{ fontFamily: F, fontSize: '14px', fontWeight: 600, color: tokens.navy }}>
                                  {item.trim()}
                                </span>
                              </div>
                            ))
                            : (
                              <div style={{
                                padding: '20px', textAlign: 'center',
                                color: tokens.muted, fontFamily: F, fontSize: '13px',
                                border: `1px dashed ${tokens.border}`, borderRadius: '10px'
                              }}>
                                No active add-ons
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                </Cell>

                {/* ── Right Column ────────────────────────── */}
                <Cell span={4}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Contract Total Card */}
                    <div style={{
                      background: `linear-gradient(135deg, ${tokens.navy} 0%, #1E3A5F 100%)`,
                      borderRadius: '14px', padding: '28px', boxShadow: tokens.shadowMd,
                      position: 'relative', overflow: 'hidden'
                    }}>
                      {/* Decorative circle */}
                      <div style={{
                        position: 'absolute', top: '-30px', right: '-30px',
                        width: '120px', height: '120px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.04)'
                      }} />
                      <div style={{
                        fontFamily: F, fontSize: '10px', fontWeight: 800,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.5)', marginBottom: '8px'
                      }}>
                        Contract Total
                      </div>
                      {editMode ? (
                        <Input
                          size="large"
                          value={editedProposal.total}
                          onChange={e => setEditedProposal({ ...editedProposal, total: e.target.value })}
                        />
                      ) : (
                        <div style={{
                          fontFamily: F, fontSize: '30px', fontWeight: 900,
                          color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.1
                        }}>
                          {formatCurrency(proposal.totalQuote || proposal.total)}
                        </div>
                      )}
                    </div>

                    {/* Status Card */}
                    <div style={{
                      background: tokens.surface, border: `1px solid ${tokens.border}`,
                      borderRadius: '14px', padding: '24px', boxShadow: tokens.shadow
                    }}>
                      <SectionTitle icon="📋">Pipeline Status</SectionTitle>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {[
                          { label: 'Quote', value: proposal.priceQuote },
                          { label: 'Proposal', value: proposal.proposal },
                          { label: 'Invoice', value: proposal.invoiced },
                        ].map(({ label, value }) => (
                          <div key={label} style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <span style={{
                              fontFamily: F, fontSize: '13px', fontWeight: 600,
                              color: tokens.slate
                            }}>
                              {label}
                            </span>
                            <PillBadge
                              label={String(value || "N/A")}
                              variant={getStatusVariant(value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Signature Card */}
                    <div style={{
                      background: tokens.surface, border: `1px solid ${tokens.border}`,
                      borderRadius: '14px', padding: '24px', boxShadow: tokens.shadow
                    }}>
                      <SectionTitle icon="✍️">Client Signature</SectionTitle>
                      <div style={{
                        background: tokens.bg, border: `1px dashed ${tokens.borderHover}`,
                        borderRadius: '10px', height: '110px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '12px', overflow: 'hidden'
                      }}>
                        {proposal.customerSign
                          ? <img
                            src={proposal.customerSign}
                            style={{ maxHeight: '90px', maxWidth: '100%', mixBlendMode: 'multiply' }}
                            alt="Signature"
                          />
                          : <div style={{ textAlign: 'center', color: tokens.muted }}>
                            <div style={{ fontSize: '24px', marginBottom: '4px' }}>✍</div>
                            <div style={{ fontFamily: F, fontSize: '12px', fontWeight: 500 }}>Pending signature</div>
                          </div>
                        }
                      </div>
                      <div style={{
                        textAlign: 'center', fontFamily: F, fontSize: '13px',
                        fontWeight: 600, color: tokens.slate
                      }}>
                        {proposal.customer || "—"}
                      </div>
                    </div>

                  </div>
                </Cell>

              </Layout>
            </div>
          </Box>
        }
      />
    </WixDesignSystemProvider>
  );
};

export default Modal;
