import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Filter } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const statusOptions = [
  { value: 'active', label: 'active' },
  { value: 'inactive', label: 'deactivated' },
  { value: 'banned', label: 'banned' },
];

const statusReasonOptions = {
  inactive: [
    'Requested by user',
    'No recent activity',
    'Pending identity verification',
    'Payment or subscription issue',
    'Temporary security hold',
  ],
  banned: [
    'Spam or scam activity',
    'Harassment or abuse',
    'Multiple policy violations',
    'Fraudulent account behavior',
    'Use of prohibited content',
  ],
};

const UserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState([]);
  const [savingUserId, setSavingUserId] = useState(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const getReasonOptionsForStatus = (status) => statusReasonOptions[(status || '').toLowerCase()] || [];
  const getDefaultReasonForStatus = (status) => getReasonOptionsForStatus(status)[0] || '';

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: query.trim(),
      });

      const res = await fetch(`${API_BASE_URL}/api/users?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to fetch users');

      setUsers(data.users || []);
      setTotal(data.totalUsers || 0);
    } catch (e) {
      setError(e?.message || 'Failed to load users');
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (page !== 1) setPage(1);
      else loadUsers();
    }, 300);
    return () => clearTimeout(handle);
  }, [query, page, loadUsers]);

  const updateUser = async (userId, patch) => {
    setSavingUserId(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user');

      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, ...data } : u)));
      toast.success('User updated');
    } catch (e) {
      toast.error(e?.message || 'Failed to update user');
    } finally {
      setSavingUserId(null);
    }
  };

  const formatLastLogin = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const roles = ['admin', 'user', 'moderator', 'viewer'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--gray-800)' }}>User Management</h1>
      </div>

      {error ? (
        <div style={{ marginBottom: '20px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', padding: '14px 16px', borderRadius: '12px' }}>
          {error}
        </div>
      ) : null}

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: '15px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: '1px solid var(--gray-300)',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 15px',
              border: '1px solid var(--gray-300)',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: 'var(--gray-700)',
              fontWeight: '500',
            }}
          >
            <Filter size={16} /> Filter
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Name</th>
              <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Role</th>
              <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Status</th>
              <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Reason</th>
              <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const currentStatus = (user.status || 'active').toLowerCase();
              const reasonOptions = getReasonOptionsForStatus(currentStatus);
              const currentReason = (user.status_reason || '').toString().trim();
              const selectedReason = reasonOptions.includes(currentReason)
                ? currentReason
                : getDefaultReasonForStatus(currentStatus);

              return (
                <tr key={user._id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '15px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--dragon-flesh)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dragon-primary)', fontWeight: 'bold' }}>
                        {(user.name || user.email || 'U').toString().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>{user.name || '-'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{user.email || '-'}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '15px 20px' }}>
                    <select
                      value={(user.role || 'user').toLowerCase()}
                      onChange={(e) => updateUser(user._id, { role: e.target.value })}
                      disabled={savingUserId === user._id}
                      style={{
                        width: '100%',
                        maxWidth: '160px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--gray-300)',
                        backgroundColor: 'white',
                        color: 'var(--gray-700)',
                        fontWeight: 600,
                        textTransform: 'lowercase',
                      }}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td style={{ padding: '15px 20px' }}>
                    <select
                      value={currentStatus}
                      onChange={(e) => {
                        const nextStatus = e.target.value.toLowerCase();
                        if (nextStatus === currentStatus) return;

                        if (nextStatus === 'active') {
                          updateUser(user._id, { status: 'active', status_reason: '' });
                          return;
                        }

                        const allowedReasons = getReasonOptionsForStatus(nextStatus);
                        const existingReason = (user.status_reason || '').toString().trim();
                        const nextReason = allowedReasons.includes(existingReason)
                          ? existingReason
                          : getDefaultReasonForStatus(nextStatus);

                        if (!nextReason) {
                          toast.error(`No reasons configured for ${nextStatus}`);
                          return;
                        }

                        updateUser(user._id, { status: nextStatus, status_reason: nextReason });
                      }}
                      disabled={savingUserId === user._id}
                      style={{
                        width: '100%',
                        maxWidth: '160px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--gray-300)',
                        backgroundColor: 'white',
                        color: 'var(--gray-700)',
                        fontWeight: 600,
                        textTransform: 'lowercase',
                      }}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td style={{ padding: '15px 20px' }}>
                    {currentStatus === 'active' ? (
                      <span style={{ color: 'var(--gray-500)', fontWeight: 600 }}>-</span>
                    ) : (
                      <select
                        value={selectedReason}
                        disabled={savingUserId === user._id}
                        onChange={(e) => {
                          const nextReason = e.target.value;
                          if (!nextReason || nextReason === currentReason) return;
                          updateUser(user._id, { status_reason: nextReason });
                        }}
                        style={{
                          width: '100%',
                          maxWidth: '320px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--gray-300)',
                          backgroundColor: 'white',
                          color: 'var(--gray-700)',
                          fontWeight: 600,
                        }}
                      >
                        {reasonOptions.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  <td style={{ padding: '15px 20px', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                    {formatLastLogin(user.last_login_at)}
                  </td>
                </tr>
              );
            })}

            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '22px 20px', color: 'var(--gray-500)' }}>
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div style={{ padding: '15px 20px', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
          <div>
            {loading
              ? 'Loading...'
              : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, total)} of ${total} entries`}
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ padding: '5px 10px', border: '1px solid var(--gray-300)', borderRadius: '4px', backgroundColor: 'white', opacity: page <= 1 || loading ? 0.6 : 1 }}
            >
              Prev
            </button>
            <button style={{ padding: '5px 10px', border: '1px solid var(--dragon-primary)', borderRadius: '4px', backgroundColor: 'var(--dragon-primary)', color: 'white' }}>
              {page}
            </button>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ padding: '5px 10px', border: '1px solid var(--gray-300)', borderRadius: '4px', backgroundColor: 'white', opacity: page >= totalPages || loading ? 0.6 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
