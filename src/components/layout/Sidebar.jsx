import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    CreditCard,
    FileText,
    TrendingUp,
    Users,
    PieChart,
    Coins,
    ChevronLeft,
    ChevronRight,
    X,
    User,
    Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
    const [localCollapsed, setLocalCollapsed] = useState(false);
    const isCollapsed = collapsed !== undefined ? collapsed : localCollapsed;
    const toggleCollapse = setCollapsed ? () => setCollapsed(!collapsed) : () => setLocalCollapsed(!localCollapsed);

    const location = useLocation();
    const { signOut } = useAuth();

    // Close mobile menu on route change
    useEffect(() => {
        if (setMobileOpen) setMobileOpen(false);
    }, [location.pathname]);

    const navItems = [
        { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Visão Geral' },
        { path: '/transactions', icon: <PieChart size={20} />, label: 'Transações' },
        { path: '/calendar', icon: <Calendar size={20} />, label: 'Calendário' },
        { path: '/cards', icon: <CreditCard size={20} />, label: 'Cartões' },
        { path: '/bills', icon: <FileText size={20} />, label: 'Contas' },
        { path: '/investments', icon: <TrendingUp size={20} />, label: 'Investimentos' },
        { path: '/groups', icon: <Users size={20} />, label: 'Grupos' },
        { path: '/profiles', icon: <User size={20} />, label: 'Perfis' },
    ];

    const bottomNavItems = [
        { path: '/account', icon: <User size={20} />, label: 'Minha Conta' },
    ];

    // Check if we're on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    const renderIndices = (items) => items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
            <NavLink
                key={item.path}
                to={item.path}
                style={{ textDecoration: 'none' }}
                title={isCollapsed && !isMobile ? item.label : ''}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: (isCollapsed && !isMobile) ? '12px 0' : '12px 16px',
                    borderRadius: '14px',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    background: isActive ? 'var(--primary)' : 'transparent',
                    boxShadow: isActive ? '0 4px 12px rgba(81, 0, 255, 0.25)' : 'none',
                    transition: 'all 0.2s ease',
                    justifyContent: (isCollapsed && !isMobile) ? 'center' : 'flex-start',
                    height: '48px',
                    position: 'relative'
                }}>
                    {item.icon}
                    {(!isCollapsed || isMobile) && (
                        <span style={{ fontWeight: isActive ? '600' : '500', fontSize: '0.95rem' }}>
                            {item.label}
                        </span>
                    )}
                </div>
            </NavLink>
        );
    });

    return (
        <>
            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    className="mobile-backdrop active"
                    onClick={() => setMobileOpen && setMobileOpen(false)}
                />
            )}

            <aside
                className={isMobile ? '' : 'hide-mobile'}
                style={{
                    width: isMobile ? '280px' : (isCollapsed ? '80px' : '260px'),
                    height: '100vh',
                    position: 'fixed',
                    left: isMobile ? (mobileOpen ? '0' : '-300px') : 0,
                    top: 0,
                    background: 'var(--bg-card)',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width 0.3s cubic-bezier(0.2, 0, 0, 1), left 0.3s cubic-bezier(0.2, 0, 0, 1)',
                    zIndex: 50,
                    boxShadow: mobileOpen ? '4px 0 20px rgba(0,0,0,0.15)' : 'none'
                }}
            >
                {/* Desktop Toggle Button */}
                {!isMobile && (
                    <button
                        onClick={toggleCollapse}
                        className="hide-mobile"
                        style={{
                            position: 'absolute',
                            right: '-12px',
                            top: '32px',
                            width: '24px',
                            height: '24px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            zIndex: 60,
                            color: 'var(--text-secondary)'
                        }}
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                )}

                {/* Mobile Close Button */}
                {isMobile && mobileOpen && (
                    <button
                        onClick={() => setMobileOpen && setMobileOpen(false)}
                        style={{
                            position: 'absolute',
                            right: '16px',
                            top: '24px',
                            width: '32px',
                            height: '32px',
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            zIndex: 60
                        }}
                    >
                        <X size={18} />
                    </button>
                )}

                {/* Header / Logo Area */}
                <div style={{
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: (isCollapsed && !isMobile) ? 'center' : 'flex-start',
                    padding: (isCollapsed && !isMobile) ? '0' : '0 24px',
                    marginBottom: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: 40, height: 40,
                            background: 'linear-gradient(135deg, var(--primary), #7000FF)',
                            borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(81, 0, 255, 0.2)',
                            flexShrink: 0
                        }}>
                            <Coins size={22} />
                        </div>
                        {(!isCollapsed || isMobile) && (
                            <span style={{
                                fontSize: '1.4rem',
                                fontWeight: '800',
                                letterSpacing: '-0.5px',
                                whiteSpace: 'nowrap',
                                opacity: 1,
                                transition: 'opacity 0.2s'
                            }}>
                                Dindin
                            </span>
                        )}
                    </div>
                </div>

                {/* Main Navigation */}
                <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                    {renderIndices(navItems)}

                    {/* Spacer to push bottom items down */}
                    <div style={{ flex: 1 }}></div>

                    {/* Divider */}
                    <div style={{
                        height: '1px',
                        background: 'var(--border)',
                        margin: '8px 4px'
                    }}></div>

                    {/* Bottom Navigation */}
                    {renderIndices(bottomNavItems)}
                </nav>
            </aside>
        </>
    );
}
