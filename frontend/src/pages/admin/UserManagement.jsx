import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';

const UserManagement = () => {
  // eslint-disable-next-line no-unused-vars
  const [users, setUsers] = useState([
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active', lastLogin: '2 mins ago' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User', status: 'Active', lastLogin: '2 hours ago' },
    { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'User', status: 'Inactive', lastLogin: '3 days ago' },
    { id: 4, name: 'Diana Ross', email: 'diana@example.com', role: 'Editor', status: 'Active', lastLogin: '1 day ago' },
    { id: 5, name: 'Evan Wright', email: 'evan@example.com', role: 'User', status: 'Banned', lastLogin: '1 week ago' },
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--gray-800)' }}>User Management</h1>
        <button style={{ 
          backgroundColor: 'var(--dragon-primary)', 
          color: 'white', 
          border: 'none', 
          padding: '10px 20px', 
          borderRadius: '8px', 
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          + Add User
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: '15px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input 
              type="text" 
              placeholder="Search users..." 
              style={{ 
                width: '100%', 
                padding: '10px 10px 10px 40px', 
                border: '1px solid var(--gray-300)', 
                borderRadius: '8px',
                outline: 'none',
                fontSize: '0.9rem'
              }} 
            />
          </div>
          <button style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 15px', 
            border: '1px solid var(--gray-300)', 
            borderRadius: '8px', 
            backgroundColor: 'white',
            color: 'var(--gray-700)',
            fontWeight: '500'
          }}>
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Name</th>
              <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Role</th>
              <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Status</th>
              <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--gray-600)', fontSize: '0.85rem' }}>Last Login</th>
              <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--gray-600)', fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--dragon-flesh)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dragon-primary)', fontWeight: 'bold' }}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '15px 20px', color: 'var(--gray-700)' }}>{user.role}</td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    backgroundColor: user.status === 'Active' ? '#dcfce7' : user.status === 'Inactive' ? '#f3f4f6' : '#fee2e2',
                    color: user.status === 'Active' ? '#166534' : user.status === 'Inactive' ? '#374151' : '#991b1b'
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '15px 20px', color: 'var(--gray-500)', fontSize: '0.9rem' }}>{user.lastLogin}</td>
                <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', padding: '5px', color: 'var(--gray-400)', cursor: 'pointer' }}>
                    <Edit size={18} />
                  </button>
                  <button style={{ background: 'none', border: 'none', padding: '5px', color: '#ef4444', cursor: 'pointer', marginLeft: '10px' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div style={{ padding: '15px 20px', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
          <div>Showing 1 to 5 of 50 entries</div>
          <div style={{ display: 'flex', gap: '5px' }}>
             <button style={{ padding: '5px 10px', border: '1px solid var(--gray-300)', borderRadius: '4px', backgroundColor: 'white' }}>Prev</button>
             <button style={{ padding: '5px 10px', border: '1px solid var(--dragon-primary)', borderRadius: '4px', backgroundColor: 'var(--dragon-primary)', color: 'white' }}>1</button>
             <button style={{ padding: '5px 10px', border: '1px solid var(--gray-300)', borderRadius: '4px', backgroundColor: 'white' }}>2</button>
             <button style={{ padding: '5px 10px', border: '1px solid var(--gray-300)', borderRadius: '4px', backgroundColor: 'white' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
