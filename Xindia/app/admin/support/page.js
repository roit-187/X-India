'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

const QUEUE_TABS = [
  { key: 'open', label: 'Open (Incoming)', color: '#DC2626', bg: '#FEE2E2' },
  { key: 'in_progress', label: 'In Progress', color: '#D97706', bg: '#FFFBEB' },
  { key: 'resolved', label: 'Resolved Archive', color: '#059669', bg: '#DCFCE7' },
];

const CANNED_RESPONSES = [
  { label: 'Visit Scheduling', text: 'Thank you for your inquiry. We are happy to schedule a factory visit for you. Please confirm your preferred date and time.' },
  { label: 'Document Re-upload', text: 'We have reviewed your profile and need you to re-upload your business document in a clearer format. Please upload a fresh copy via the app.' },
  { label: 'Policy Guidance', text: 'Thank you for reaching out. Based on our platform policy, the action you described requires verification. Our team will guide you through the next steps.' },
  { label: 'Query Acknowledged', text: 'We have received your query and our team is actively reviewing it. We will respond within 24 hours.' },
  { label: 'Resolution Confirmation', text: 'Your query has been fully resolved by our team. If you have any further questions, please do not hesitate to contact us again.' },
];

function TicketCard({ ticket, isActive, onClick }) {
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  };

  const urgencyColor = ticket.severity === 'CRITICAL' ? '#DC2626'
    : ticket.severity === 'HIGH' ? '#EA580C'
    : ticket.severity === 'MEDIUM' ? '#D97706' : '#64748B';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px',
        borderRadius: 8,
        border: isActive ? '2px solid #E8581C' : '1px solid #E2E8F0',
        background: isActive ? '#FFF7ED' : '#fff',
        cursor: 'pointer',
        marginBottom: 8,
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', flex: 1, marginRight: 8 }}>
          {ticket.title || ticket.type}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: urgencyColor, whiteSpace: 'nowrap' }}>
          {ticket.severity}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {ticket.body}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>{ticket.relatedUserEmail || 'Unknown User'}</span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(ticket.createdAt)}</span>
      </div>
    </div>
  );
}

export default function AdminSupportDeskPage() {
  const { isSuperAdmin, loaded } = useAdminPermissions();
  const [queueTab, setQueueTab] = useState('open');
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isNote, setIsNote] = useState(false);
  const [allowReplies, setAllowReplies] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolutionPanel, setShowResolutionPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const chatBottomRef = useRef(null);

  const [adminProfile] = useState(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('admin_profile') || '{}'); } catch { return {}; }
  });

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const statusMap = { open: 'OPEN', in_progress: 'IN_REVIEW', resolved: 'RESOLVED' };
      const params = new URLSearchParams({ status: statusMap[queueTab] || 'OPEN', limit: 50 });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const res = await fetch(`/api/admin/alerts?${params}`);
      const data = await res.json();
      if (data.success) setTickets(data.alerts || []);
    } catch (e) {
      console.error('Failed to load support tickets', e);
    } finally {
      setLoadingTickets(false);
    }
  }, [queueTab, searchQuery]);

  useEffect(() => { if (loaded && isSuperAdmin) loadTickets(); }, [loaded, isSuperAdmin, loadTickets]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadMessages = useCallback(async (ticket) => {
    if (!ticket) return;
    // In a full implementation, this would load from a SupportConversation collection
    // For now, use the alert body + metadata as the initial context message
    setMessages([{
      _id: 'initial',
      type: 'user',
      text: ticket.body,
      senderName: ticket.relatedUserEmail || 'User',
      timestamp: ticket.createdAt,
    }]);
    setAllowReplies(ticket.allowReplies !== false);
  }, []);

  const handleSelectTicket = (ticket) => {
    setActiveTicket(ticket);
    loadMessages(ticket);
    setShowResolutionPanel(false);
    setResolutionNote('');
    setMsgInput('');
    setIsNote(false);
  };

  const handleSend = async () => {
    if (!msgInput.trim() || !activeTicket || sending) return;
    setSending(true);
    const newMsg = {
      _id: Date.now().toString(),
      type: isNote ? 'note' : 'admin',
      text: msgInput.trim(),
      senderName: adminProfile.fullName || adminProfile.username || 'Admin',
      employeeId: adminProfile.employeeId || '',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setMsgInput('');

    // In a full implementation, POST to support chat API
    // For now just update the UI optimistically
    setSending(false);
  };

  const handleToggleReplies = async () => {
    if (!activeTicket) return;
    const newVal = !allowReplies;
    setAllowReplies(newVal);
    // Would send PATCH /api/admin/support-conversations/:id/allow-replies
    setMessages((prev) => [...prev, {
      _id: Date.now().toString(),
      type: 'system',
      text: newVal
        ? 'Admin enabled replies. User can now respond.'
        : 'Admin disabled replies. User input is locked with an administrative notice.',
      timestamp: new Date().toISOString(),
    }]);
  };

  const handleResolve = async () => {
    if (!activeTicket || resolving) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/admin/alerts/${activeTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED', resolutionNote }),
      });
      const data = await res.json();
      if (data.success) {
        // Dispatch resolution push notification
        await fetch(`/api/admin/alerts/${activeTicket._id}/resolve-notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolutionNote }),
        });
        setActiveTicket(null);
        setShowResolutionPanel(false);
        loadTickets();
      }
    } finally {
      setResolving(false);
    }
  };

  if (!loaded) return null;
  if (!isSuperAdmin) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2>Access Restricted</h2>
        <p style={{ color: '#64748B' }}>Customer Support Desk is only accessible to Super Admin.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', height: 'calc(100vh - 80px)', gap: 0, overflow: 'hidden' }}>

      {/* ─── Left Panel: Ticket Queue ───────────────────────────── */}
      <div style={{ borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A' }}>Support Desk</h2>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              className="admin-input"
              style={{ width: '100%', paddingLeft: 30, height: 34, fontSize: 13 }}
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>🔍</span>
          </div>
        </div>

        {/* Queue Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          {QUEUE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setQueueTab(tab.key); setActiveTicket(null); }}
              style={{
                flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 700,
                border: 'none', borderBottom: queueTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
                background: 'none', color: queueTab === tab.key ? tab.color : '#64748B',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {tab.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          {loadingTickets ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', padding: 32, fontSize: 13 }}>Loading...</div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', padding: 32, fontSize: 13 }}>No tickets in this queue.</div>
          ) : (
            tickets.map((t) => (
              <TicketCard
                key={t._id}
                ticket={t}
                isActive={activeTicket?._id === t._id}
                onClick={() => handleSelectTicket(t)}
              />
            ))
          )}
        </div>
      </div>

      {/* ─── Right Panel: Chat Window ────────────────────────────── */}
      {!activeTicket ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94A3B8' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#475569' }}>Select a ticket to begin</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Choose from the queue on the left to start a support session</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Chat Header */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#FAFAFA' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{activeTicket.title}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                {activeTicket.relatedUserEmail || 'Unknown User'} · Ref: #{activeTicket._id.toString().slice(-8).toUpperCase()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Allow Replies Toggle */}
              <button
                onClick={handleToggleReplies}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                  border: '1px solid', cursor: 'pointer',
                  borderColor: allowReplies ? '#16A34A' : '#DC2626',
                  background: allowReplies ? '#F0FDF4' : '#FEF2F2',
                  color: allowReplies ? '#16A34A' : '#DC2626',
                }}
              >
                {allowReplies ? '✅ Replies: On' : '🔒 Replies: Off'}
              </button>
              {/* Mark Resolved */}
              <button
                onClick={() => setShowResolutionPanel(true)}
                className="admin-btn"
                style={{ fontSize: 12, background: '#16A34A', color: '#fff' }}
              >
                ✅ Mark Resolved
              </button>
            </div>
          </div>

          {/* Resolution Panel */}
          {showResolutionPanel && (
            <div style={{ padding: '12px 20px', background: '#F0FDF4', borderBottom: '1px solid #BBF7D0', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 8 }}>📋 Resolve &amp; Close Ticket</div>
              <textarea
                className="admin-input"
                rows={2}
                style={{ width: '100%', marginBottom: 8, fontSize: 13 }}
                placeholder="Resolution summary (sent to user in push notification)..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn" style={{ background: '#16A34A', color: '#fff', fontSize: 12 }} disabled={resolving} onClick={handleResolve}>
                  {resolving ? 'Resolving...' : '✅ Confirm Resolution & Notify User'}
                </button>
                <button className="admin-btn admin-btn-secondary" style={{ fontSize: 12 }} onClick={() => setShowResolutionPanel(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#F8FAFC' }}>
            {/* Branded identity banner */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: '#fff', border: '1px solid #E2E8F0', fontSize: 12, color: '#16A34A', fontWeight: 700 }}>
                🛡️ XIndia Customer Support — Official Channel
              </div>
            </div>

            {messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg._id} style={{ textAlign: 'center', margin: '10px 0' }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', background: '#F1F5F9', padding: '3px 12px', borderRadius: 20 }}>
                      {msg.text}
                    </span>
                  </div>
                );
              }
              if (msg.type === 'note') {
                return (
                  <div key={msg._id} style={{ margin: '8px 0', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ maxWidth: '70%', background: '#FFFBEB', border: '1px dashed #F59E0B', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                        📝 Internal Note — {msg.senderName} {msg.employeeId && `(ID: ${msg.employeeId})`}
                      </div>
                      <div style={{ fontSize: 13, color: '#0F172A' }}>{msg.text}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, textAlign: 'right' }}>
                        {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              }
              const isAdmin = msg.type === 'admin';
              return (
                <div key={msg._id} style={{ margin: '8px 0', display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                  {!isAdmin && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, marginRight: 8, flexShrink: 0 }}>
                      👤
                    </div>
                  )}
                  <div style={{
                    maxWidth: '70%', borderRadius: 12, padding: '10px 14px',
                    background: isAdmin ? '#E8581C' : '#fff',
                    color: isAdmin ? '#fff' : '#0F172A',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    borderBottomRightRadius: isAdmin ? 0 : 12,
                    borderBottomLeftRadius: isAdmin ? 12 : 0,
                  }}>
                    {isAdmin && (
                      <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>
                        XIndia Support · {msg.senderName} {msg.employeeId && `(${msg.employeeId})`}
                      </div>
                    )}
                    <div style={{ fontSize: 13 }}>{msg.text}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: isAdmin ? 'right' : 'left' }}>
                      {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8581C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, marginLeft: 8, flexShrink: 0 }}>
                      🛡️
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Canned Responses */}
          <div style={{ padding: '6px 16px', borderTop: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: '#94A3B8', alignSelf: 'center', whiteSpace: 'nowrap', marginRight: 4 }}>Quick:</span>
            {CANNED_RESPONSES.map((cr, i) => (
              <button
                key={i}
                onClick={() => setMsgInput(cr.text)}
                style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: '1px solid #E2E8F0', background: '#fff', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {cr.label}
              </button>
            ))}
          </div>

          {/* Compose Bar */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #E2E8F0', background: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <button
                    onClick={() => setIsNote(false)}
                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 700, border: '1px solid', borderColor: !isNote ? '#E8581C' : '#E2E8F0', background: !isNote ? '#FFF7ED' : '#fff', color: !isNote ? '#C2410C' : '#64748B', cursor: 'pointer' }}
                  >
                    📤 Send to User
                  </button>
                  <button
                    onClick={() => setIsNote(true)}
                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 700, border: '1px solid', borderColor: isNote ? '#F59E0B' : '#E2E8F0', background: isNote ? '#FFFBEB' : '#fff', color: isNote ? '#92400E' : '#64748B', cursor: 'pointer' }}
                  >
                    📝 Internal Note
                  </button>
                </div>
                <textarea
                  className="admin-input"
                  rows={2}
                  style={{ width: '100%', resize: 'none', fontSize: 13 }}
                  placeholder={isNote ? 'Write an internal team note (not visible to user)...' : 'Type your reply to the user...'}
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleSend(); }}
                />
              </div>
              <button
                className="admin-btn"
                style={{ background: isNote ? '#F59E0B' : '#E8581C', color: '#fff', padding: '10px 16px', fontSize: 13 }}
                disabled={!msgInput.trim() || sending}
                onClick={handleSend}
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
