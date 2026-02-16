import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const [state, setState] = useState({ loading: true, allowed: false, redirectTo: '/login' });

  const user = useMemo(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!user) {
        if (!cancelled) setState({ loading: false, allowed: false, redirectTo: '/login' });
        return;
      }

      if (user.role !== 'admin') {
        if (!cancelled) setState({ loading: false, allowed: false, redirectTo: '/home' });
        return;
      }

      if (!cancelled) setState({ loading: false, allowed: true, redirectTo: '/' });
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (state.loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: 'var(--gray-600)' }}>
        Checking access…
      </div>
    );
  }

  if (!state.allowed) return <Navigate to={state.redirectTo} replace />;
  return <Outlet />;
};

export default ProtectedRoute;
