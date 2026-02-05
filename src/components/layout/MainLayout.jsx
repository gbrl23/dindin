import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import NewTransactionModal from '../../features/transactions/NewTransactionModal';
import { useLocation } from 'react-router-dom';
import { useDashboard } from '../../contexts/DashboardContext';

export default function MainLayout({ children }) {
    const location = useLocation();
    const { isTransactionModalOpen, closeTransactionModal, openTransactionModal, modalType } = useDashboard();

    // Sidebar State (Managed here for layout adjustment)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Don't show sidebar on login/signup pages
    const isAuthPage = ['/login', '/signup', '/register'].includes(location.pathname);

    if (isAuthPage) {
        return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>{children}</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

            <main style={{
                flex: 1,
                marginLeft: sidebarCollapsed ? '80px' : '260px', // Dynamic margin
                padding: '32px 40px', // More breathing room
                maxWidth: `calc(100vw - ${sidebarCollapsed ? '80px' : '260px'})`,
                minWidth: 0,
                transition: 'margin-left 0.3s ease, max-width 0.3s ease'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}> { /* Wider Container */}
                    {location.pathname !== '/account' && (
                        <TopHeader onOpenNewTransaction={() => openTransactionModal('expense')} />
                    )}

                    {children}
                </div>
            </main>

            {/* Global Modals */}
            {isTransactionModalOpen && (
                <NewTransactionModal
                    initialType={modalType}
                    onClose={closeTransactionModal}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
