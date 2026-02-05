import React, { useState } from 'react';
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
    LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar({ collapsed, setCollapsed }) {
    const [localCollapsed, setLocalCollapsed] = useState(false);
    const isCollapsed = collapsed !== undefined ? collapsed : localCollapsed;
    const toggleCollapse = setCollapsed ? () => setCollapsed(!collapsed) : () => setLocalCollapsed(!localCollapsed);

    const location = useLocation();
    const { signOut } = useAuth();

    const navItems = [
        { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Visão Geral' },
        { path: '/transactions', icon: <PieChart size={20} />, label: 'Transações' },
        { path: '/cards', icon: <CreditCard size={20} />, label: 'Cartões' },
        { path: '/bills', icon: <FileText size={20} />, label: 'Contas' },
        { path: '/investments', icon: <TrendingUp size={20} />, label: 'Investimentos' },
        { path: '/groups', icon: <Users size={20} />, label: 'Grupos' },
    ];

    return (
        <aside style={{
            width: isCollapsed ? '80px' : '260px',
            height: '100vh',
            position: 'fixed',
            left: 0, top: 0,
            background: 'var(--bg-card)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s cubic-bezier(0.2, 0, 0, 1)',
            zIndex: 50
        }}>
            {/* Floating Toggle Button (Absolute on the right border) */}
            <button
                onClick={toggleCollapse}
                style={{
                    position: 'absolute',
                    right: '-12px', // Half outside
                    top: '32px', // Aligned with logo area approximately
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
                    zIndex: 60, // Above sidebar border
                    color: 'var(--text-secondary)'
                }}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>


            {/* Header / Logo Area */}
            <div style={{
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '0' : '0 24px',
                marginBottom: '8px'
            }}>
                {/* Logo */}
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
                    {!isCollapsed && (
                        <span style={{
                            fontSize: '1.4rem',
                            fontWeight: '800',
                            letterSpacing: '-0.5px',
                            whiteSpace: 'nowrap',
                            opacity: isCollapsed ? 0 : 1,
                            transition: 'opacity 0.2s'
                        }}>
                            Dindin
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={{ textDecoration: 'none' }}
                            title={isCollapsed ? item.label : ''}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: isCollapsed ? '12px 0' : '12px 16px',
                                borderRadius: '14px',
                                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                                background: isActive ? 'var(--primary)' : 'transparent', // Solid active state based on new ref? Or keep light? Ref shows Yellow active. I'll stick to Primary (Purple) for now as requested.
                                boxShadow: isActive ? '0 4px 12px rgba(81, 0, 255, 0.25)' : 'none',
                                transition: 'all 0.2s ease',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                height: '48px',
                                position: 'relative'
                            }}>
                                {item.icon}
                                {!isCollapsed && (
                                    <span style={{ fontWeight: isActive ? '600' : '500', fontSize: '0.95rem' }}>
                                        {item.label}
                                    </span>
                                )}
                            </div>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Simples Footer to Logout if needed, or just gap */}
            <div style={{ padding: '24px' }}>
                {/* Optional footer content */}
            </div>
        </aside>
    );
}
