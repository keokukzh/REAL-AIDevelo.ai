import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

