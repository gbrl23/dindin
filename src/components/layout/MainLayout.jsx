import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import NotificationsDropdown from './NotificationsDropdown';
import NewTransactionModal from '../../features/transactions/NewTransactionModal';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDashboard } from '../../contexts/DashboardContext';
import { Menu, Bell, X, Coins, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useGroups } from '../../hooks/useGroups';

export default function MainLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        isTransactionModalOpen, closeTransactionModal, openTransactionModal, modalType,
        selectedDate, handlePrevMonth, handleNextMonth
    } = useDashboard();
    const { notifications } = useNotifications();
    const { acceptInvite } = useGroups();

    // Count unread notifications
    const unreadCount = notifications?.filter(n => !n.read)?.length || 0;

    // Sidebar State
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Check screen size
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Scroll Lock when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [mobileMenuOpen]);

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

                                {/* App Logo & Name - Now Visible on Mobile Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                                        <Coins size={28} strokeWidth={2.5} />
                                    </div>
                                    <span style={{
                                        fontSize: '1.2rem',
                                        fontWeight: '800',
                                        color: 'var(--text-primary)',
                                        letterSpacing: '-0.5px'
                                    }}>
                                        Dindin
                                    </span>
                                </div>
                            </div>

                            {/* Mobile Month Navigation */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'var(--bg-secondary)',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)'
                            }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePrevMonth(); }}
                                    style={{ background: 'transparent', border: 'none', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'capitalize', minWidth: '80px', textAlign: 'center' }}>
                                    {selectedDate.toLocaleString('pt-BR', { month: 'short' })}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleNextMonth(); }}
                                    style={{ background: 'transparent', border: 'none', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        background: showNotifications ? 'var(--primary)' : 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: showNotifications ? '#fff' : 'var(--text-primary)',
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
                                {showNotifications && (
                                    <div style={{
                                        position: 'fixed',
                                        top: '70px',
                                        left: '16px',
                                        right: '16px',
                                        maxHeight: 'calc(100vh - 100px)',
                                        overflowY: 'auto',
                                        background: '#FFFFFF',
                                        borderRadius: '16px',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                        padding: '8px',
                                        zIndex: 100,
                                        border: '1px solid rgba(0,0,0,0.05)'
                                    }}>
                                        <NotificationsDropdown
                                            notifications={notifications}
                                            onAcceptInvite={acceptInvite}
                                            onClose={() => setShowNotifications(false)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {location.pathname !== '/account' && !isMobile && (
                        <TopHeader onOpenNewTransaction={() => openTransactionModal('expense')} />
                    )}

                    {/* Mobile Quick Add Button */}
                    {isMobile && location.pathname !== '/account' && (
                        <button
                            onClick={() => navigate('/add-transaction?type=expense')}
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
