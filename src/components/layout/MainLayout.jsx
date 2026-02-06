import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import NewTransactionModal from '../../features/transactions/NewTransactionModal';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDashboard } from '../../contexts/DashboardContext';
import { Menu, Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

export default function MainLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { isTransactionModalOpen, closeTransactionModal, openTransactionModal, modalType } = useDashboard();
    const { notifications } = useNotifications();

    // Count unread notifications
    const unreadCount = notifications?.filter(n => !n.read)?.length || 0;

    // Sidebar State
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check screen size
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Don't show sidebar on login/signup pages
    const isAuthPage = ['/login', '/signup', '/register'].includes(location.pathname);

    if (isAuthPage) {
        return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>{children}</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
            <Sidebar
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
                mobileOpen={mobileMenuOpen}
                setMobileOpen={setMobileMenuOpen}
            />

            <main style={{
                flex: 1,
                marginLeft: isMobile ? 0 : (sidebarCollapsed ? '80px' : '260px'),
                padding: isMobile ? '16px' : '32px 40px',
                maxWidth: isMobile ? '100%' : `calc(100vw - ${sidebarCollapsed ? '80px' : '260px'})`,
                minWidth: 0,
                transition: 'margin-left 0.3s ease, max-width 0.3s ease, padding 0.3s ease'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Mobile Header with Menu Button */}
                    {isMobile && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '16px',
                            paddingBottom: '16px',
                            borderBottom: '1px solid var(--border)',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button
                                    onClick={() => setMobileMenuOpen(true)}
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <Menu size={22} />
                                </button>
                                <span style={{
                                    fontSize: '1.2rem',
                                    fontWeight: '700',
                                    color: 'var(--text-primary)'
                                }}>
                                    Dindin
                                </span>
                            </div>
                            <button
                                onClick={() => navigate('/account')}
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)',
                                    position: 'relative'
                                }}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '6px',
                                        width: '16px',
                                        height: '16px',
                                        background: 'var(--danger)',
                                        borderRadius: '50%',
                                        color: '#fff',
                                        fontSize: '0.65rem',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}

                    {location.pathname !== '/account' && !isMobile && (
                        <TopHeader onOpenNewTransaction={() => openTransactionModal('expense')} />
                    )}

                    {/* Mobile Quick Add Button */}
                    {isMobile && location.pathname !== '/account' && (
                        <button
                            onClick={() => openTransactionModal('expense')}
                            style={{
                                position: 'fixed',
                                bottom: '24px',
                                right: '24px',
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                color: '#fff',
                                border: 'none',
                                boxShadow: '0 4px 20px rgba(81, 0, 255, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '1.5rem',
                                fontWeight: '300',
                                zIndex: 30
                            }}
                        >
                            +
                        </button>
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
