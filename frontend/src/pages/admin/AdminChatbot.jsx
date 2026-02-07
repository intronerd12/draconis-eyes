import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Bot, ClipboardCopy, Loader2, Search, Send, Shield, Trash2, User } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const makeId = () => {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatTime = (d) =>
  d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

const normalize = (s) => (s || '').trim().toLowerCase();

const withTimeout = async (promise, ms) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Request timed out')), ms);
  });
  const result = await Promise.race([promise, timeout]);
  clearTimeout(timeoutId);
  return result;
};

const fetchJson = async (url, init) => {
  const res = await withTimeout(fetch(url, init), 12000);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
};

const buildAnswer = async (message) => {
  const raw = message.trim();
  const text = normalize(raw);

  const deleteMatch = text.match(/^(delete|remove)\s+user\s+([a-f0-9]{24})$/i);
  if (deleteMatch) {
    const userId = deleteMatch[2];
    await fetchJson(`${API_BASE_URL}/api/users/${userId}`, { method: 'DELETE' });
    return {
      title: 'User Removed',
      lines: [`Deleted user ${userId}.`],
    };
  }

  const roleMatch = text.match(/^set\s+role\s+([a-f0-9]{24})\s+(admin|user|moderator|viewer)$/i);
  if (roleMatch) {
    const userId = roleMatch[1];
    const role = roleMatch[2].toLowerCase();
    await fetchJson(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    return {
      title: 'Role Updated',
      lines: [`Set role for ${userId} to ${role}.`],
    };
  }

  const statusMatch = text.match(/^set\s+status\s+([a-f0-9]{24})\s+(active|inactive|banned)$/i);
  if (statusMatch) {
    const userId = statusMatch[1];
    const status = statusMatch[2].toLowerCase();
    await fetchJson(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return {
      title: 'Status Updated',
      lines: [`Set status for ${userId} to ${status}.`],
    };
  }

  const findMatch = text.match(/^(find|search)\s+user\s+(.+)$/i);
  if (findMatch) {
    const q = findMatch[2].trim();
    const params = new URLSearchParams({ page: '1', limit: '5', search: q });
    const data = await fetchJson(`${API_BASE_URL}/api/users?${params.toString()}`);
    const users = Array.isArray(data.users) ? data.users : [];
    if (!users.length) {
      return { title: 'User Search', lines: ['No users found.', `Query: ${q}`] };
    }

    return {
      title: 'User Search',
      lines: [
        `Results: ${users.length} (showing up to 5)`,
        ...users.map((u) => `- ${u.name || '—'} • ${u.email || '—'} • ${u.role || 'user'} • ${u._id}`),
      ],
    };
  }

  const wantsHealth = ['health', 'status', 'uptime', 'api'].some((k) => text.includes(k));
  const wantsUsers = text.includes('user');
  const wantsScans = text.includes('scan');
  const wantsErrors = text.includes('error') || text.includes('fail');

  if (!(wantsHealth || wantsUsers || wantsScans || wantsErrors)) {
    return {
      title: 'Try These',
      lines: [
        'System status',
        'User count',
        'Weekly scan stats',
        'Search user admin@dragon.com',
        'Set role <userId> admin',
        'Delete user <userId>',
      ],
    };
  }

  const sections = [];

  if (wantsHealth) {
    const start = performance.now();
    try {
      const status = await fetchJson(`${API_BASE_URL}/status`);
      const latencyMs = Math.round(performance.now() - start);
      const serviceLines = Object.entries(status).map(([k, v]) => `- ${k}: ${v}`);
      sections.push({
        title: 'System Health',
        lines: [`Latency: ${latencyMs}ms`, ...serviceLines],
      });
    } catch (e) {
      sections.push({
        title: 'System Health',
        lines: ['Unable to fetch /status.', e.message],
      });
    }
  }

  if (wantsUsers) {
    try {
      const data = await fetchJson(`${API_BASE_URL}/api/users?limit=1`);
      sections.push({
        title: 'Users',
        lines: [`Total users: ${data.totalUsers ?? 0}`],
      });
    } catch (e) {
      sections.push({
        title: 'Users',
        lines: ['Unable to fetch users.', e.message],
      });
    }
  }

  if (wantsScans || wantsErrors) {
    try {
      const data = await fetchJson(`${API_BASE_URL}/api/scan/stats`);
      if (wantsScans) {
        const last7 = Array.isArray(data.last7Days) ? data.last7Days.reduce((acc, curr) => acc + (curr.count || 0), 0) : 0;
        sections.push({
          title: 'Scans',
          lines: [`Total scans: ${data.total ?? 0}`, `Best grade: ${data.best ?? '-'}`, `Last 7 days: ${last7}`],
        });
      }
      if (wantsErrors) {
        sections.push({
          title: 'Errors',
          lines: ['No dedicated error log endpoint is configured yet.'],
        });
      }
    } catch (e) {
      sections.push({
        title: 'Scans',
        lines: ['Unable to fetch scan stats.', e.message],
      });
    }
  }

  if (sections.length === 1) return sections[0];

  return {
    title: 'Admin Summary',
    lines: sections.flatMap((s) => [s.title, ...s.lines, '']).slice(0, -1),
  };
};

const bubbleBase = {
  borderRadius: 16,
  padding: '12px 14px',
  lineHeight: 1.5,
  fontSize: '0.95rem',
  border: '1px solid var(--gray-200)',
  boxShadow: 'var(--shadow-sm)',
  whiteSpace: 'pre-wrap',
};

const AdminChatbot = () => {
  const [messages, setMessages] = useState(() => [
    {
      id: 'm0',
      role: 'assistant',
      at: new Date(),
      title: 'AI Assistant',
      lines: [
        'Ready. Ask for system health, scans, or users.',
        'Commands: search user <query>, set role <id> <role>, set status <id> <status>, delete user <id>.',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  const quickPrompts = useMemo(
    () => [
      { label: 'System Status', text: 'system status' },
      { label: 'User Count', text: 'user count' },
      { label: 'Weekly Scan Stats', text: 'weekly scan stats' },
      { label: 'Search User', text: 'search user admin@dragon.com' },
    ],
    [],
  );

  const canSend = input.trim().length > 0 && !sending;

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    setMessages((prev) => [...prev, { id: makeId(), role: 'user', at: new Date(), title: 'You', lines: [trimmed] }]);

    try {
      const answer = await buildAnswer(trimmed);
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: 'assistant', at: new Date(), title: answer.title, lines: answer.lines },
      ]);
    } catch (e) {
      toast.error(e?.message || 'Failed to answer');
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: 'assistant', at: new Date(), title: 'Error', lines: [e?.message || 'Request failed'] },
      ]);
    } finally {
      setSending(false);
    }
  };

  const shellStyle = {
    backgroundColor: 'white',
    borderRadius: 16,
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--gray-200)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '70vh',
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, rgba(230,0,92,0.10), rgba(0,179,77,0.10))',
    borderBottom: '1px solid var(--gray-200)',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  };

  const iconStyle = {
    width: 40,
    height: 40,
    borderRadius: 14,
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, var(--dragon-primary), #ff4d9d)',
    color: 'white',
    boxShadow: '0 10px 18px rgba(230,0,92,0.22)',
  };

  const pillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid rgba(17,24,39,0.10)',
    backgroundColor: 'rgba(255,255,255,0.85)',
    color: 'var(--gray-700)',
    fontSize: '0.8rem',
    fontWeight: 800,
  };

  const quickButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 12,
    border: '1px solid var(--gray-200)',
    backgroundColor: 'white',
    color: 'var(--gray-700)',
    fontWeight: 800,
    fontSize: '0.85rem',
  };

  const toolbarBtnStyle = {
    padding: '8px 10px',
    borderRadius: 12,
    border: '1px solid var(--gray-200)',
    backgroundColor: 'white',
    color: 'var(--gray-700)',
    fontWeight: 800,
    fontSize: '0.85rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  };

  const inputWrapStyle = {
    borderTop: '1px solid var(--gray-200)',
    padding: 14,
    backgroundColor: 'white',
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  };

  const inputStyle = {
    flex: 1,
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid var(--gray-300)',
    outline: 'none',
    fontSize: '0.95rem',
    backgroundColor: 'var(--gray-50)',
  };

  const sendBtnStyle = {
    padding: '12px 14px',
    borderRadius: 12,
    border: 'none',
    backgroundColor: canSend ? 'var(--dragon-primary)' : 'var(--gray-200)',
    color: canSend ? 'white' : 'var(--gray-500)',
    fontWeight: 900,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gray-800)' }}>AI Assistant</div>
          <div style={{ color: 'var(--gray-500)', marginTop: 4 }}>Admin-grade chat for analytics and user management.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {quickPrompts.map((p) => (
            <button key={p.label} type="button" onClick={() => send(p.text)} disabled={sending} style={{ ...quickButtonStyle, opacity: sending ? 0.7 : 1 }}>
              <Shield size={16} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={shellStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={iconStyle}>
              <Bot size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 900, color: 'var(--gray-900)' }}>Dragon Vision Assistant</div>
              <div style={{ marginTop: 4 }}>
                <span style={pillStyle}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: '#10b981' }} />
                  Online
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const last = [...messages].reverse().find((m) => m.role === 'assistant');
                if (!last) return;
                const text = last.lines.join('\n');
                navigator.clipboard?.writeText?.(text);
                toast.success('Copied latest answer');
              }}
              style={toolbarBtnStyle}
            >
              <ClipboardCopy size={16} />
              Copy last
            </button>
            <button
              type="button"
              onClick={() => setMessages((prev) => (prev.length ? [prev[0]] : prev))}
              style={toolbarBtnStyle}
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        </div>

        <div
          ref={listRef}
          style={{
            padding: 18,
            flex: 1,
            overflowY: 'auto',
            background: 'linear-gradient(180deg, rgba(249,250,251,0.9), rgba(249,250,251,1))',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: 820, width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'space-between', alignItems: 'center', gap: 10 }}>
                  {!isUser ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-800)', fontWeight: 900 }}>
                      <Bot size={16} />
                      {m.title}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-800)', fontWeight: 900 }}>
                      <User size={16} />
                      You
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 700 }}>{formatTime(m.at)}</div>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    ...bubbleBase,
                    backgroundColor: isUser ? 'var(--gray-900)' : 'white',
                    color: isUser ? 'white' : 'var(--gray-800)',
                    border: isUser ? '1px solid rgba(255,255,255,0.10)' : bubbleBase.border,
                    borderTopRightRadius: isUser ? 8 : bubbleBase.borderRadius,
                    borderTopLeftRadius: isUser ? bubbleBase.borderRadius : 8,
                  }}
                >
                  {m.lines.join('\n')}
                </div>
              </div>
            );
          })}

          {sending ? (
            <div style={{ alignSelf: 'flex-start', maxWidth: 820, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-800)', fontWeight: 900 }}>
                <Loader2 size={16} />
                Thinking…
              </div>
              <div style={{ marginTop: 8, ...bubbleBase, backgroundColor: 'white', color: 'var(--gray-600)' }}>
                Processing request…
              </div>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSend) return;
            const toSend = input;
            setInput('');
            send(toSend);
          }}
          style={inputWrapStyle}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'var(--gray-100)', display: 'grid', placeItems: 'center' }}>
              <Search size={16} color="var(--gray-600)" />
            </div>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask: users, scans, health… or type a command"
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={!canSend} style={sendBtnStyle}>
            {sending ? <Loader2 size={18} /> : <Send size={18} />}
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminChatbot;
