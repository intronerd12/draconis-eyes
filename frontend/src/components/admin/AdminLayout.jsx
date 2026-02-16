import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart3, ScanLine, Activity, LogOut, AlertTriangle, CloudSun } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isActive = (path) => {
    // Exact match for dashboard, startswith for others if needed, but exact is safer for now
    return location.pathname === path;
  };

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/users', icon: <Users size={20} />, label: 'Users' },
    { path: '/admin/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { path: '/admin/scans', icon: <ScanLine size={20} />, label: 'Scanned Items' },
    { path: '/admin/environment', icon: <CloudSun size={20} />, label: 'Environment' },
    { path: '/admin/api-health', icon: <Activity size={20} />, label: 'API Health' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--gray-50)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: '#99003d', // Darker shade of dragon-primary (approx) for better contrast or just use primary
        backgroundImage: 'linear-gradient(to bottom, var(--dragon-primary), #99003d)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        position: 'fixed',
        height: '100vh',
        zIndex: 10
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Dragon Vision</h1>
          <span style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Portal</span>
        </div>

        <nav style={{ flex: 1, padding: '20px 10px' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    color: isActive(item.path) ? 'var(--dragon-primary)' : 'rgba(255,255,255,0.85)',
                    backgroundColor: isActive(item.path) ? 'white' : 'transparent',
                    textDecoration: 'none',
                    fontWeight: isActive(item.path) ? '600' : '500',
                    transition: 'all 0.2s',
                    gap: '12px',
                    borderRadius: '8px',
                  }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
             <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} />
             </div>
             <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Admin User</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>admin@dragon.vision</div>
             </div>
          </div>
          <button 
            onClick={() => setShowLogoutModal(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: 'white', 
              border: 'none',
              width: '100%',
              cursor: 'pointer',
              gap: '10px',
              opacity: 0.8,
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.1)',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
          >
            <LogOut size={16} />
            <span style={{ fontSize: '0.9rem' }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        padding: '30px', 
        marginLeft: '260px', // Match sidebar width
        backgroundColor: 'var(--gray-50)'
      }}>
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
            border: '1px solid var(--gray-200)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              color: '#ef4444'
            }}>
              <AlertTriangle size={32} />
            </div>
            
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: 'var(--gray-900)',
              marginBottom: '12px'
            }}>
              Confirm Logout
            </h3>
            
            <p style={{ 
              color: 'var(--gray-500)', 
              marginBottom: '32px',
              lineHeight: '1.5'
            }}>
              Are you sure you want to log out of the admin portal? You will need to sign in again to access the dashboard.
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'white',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '10px',
                  color: 'var(--gray-700)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
