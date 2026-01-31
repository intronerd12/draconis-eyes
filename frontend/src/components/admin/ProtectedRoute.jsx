import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    // Not logged in
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'admin') {
    // Logged in but not admin
    // We can show a toast here, but side-effects in render are tricky. 
    // Usually better to let the effect run or just redirect.
    // For simplicity and safety, we'll just redirect to home.
    return <Navigate to="/home" replace />;
  }

  // Authorized
  return <Outlet />;
};

export default ProtectedRoute;
