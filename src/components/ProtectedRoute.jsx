
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfiles } from '../hooks/useProfiles';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const { myProfile, loading: profileLoading } = useProfiles();
    const location = useLocation();
    const isOnboardingRoute = location.pathname === '/onboarding';

    // Auth loading — always wait
    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)'
            }}>
                Carregando...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If profiles are still loading, allow onboarding to render
    // (it doesn't need profile data to show its first step)
    if (profileLoading) {
        if (isOnboardingRoute) {
            return children;
        }
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)'
            }}>
                Carregando...
            </div>
        );
    }

    // Onboarding check: redirect if profile incomplete
    const hasCompletedOnboarding = myProfile?.salary_type;

    if (!hasCompletedOnboarding && !isOnboardingRoute) {
        return <Navigate to="/onboarding" replace />;
    }

    return children;
}
