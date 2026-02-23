import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Calendar, Bell, MoreVertical, LogOut, Settings, User } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProfiles } from '../../hooks/useProfiles';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationsDropdown from './NotificationsDropdown';

export default function TopHeader({ onOpenNewTransaction }) {
    const { selectedDate, handlePrevMonth, handleNextMonth, handleSetToday } = useDashboard();
    const { user, signOut } = useAuth();
    const { myProfile } = useProfiles();
    const { notifications, unreadCount, acceptGroupInvite } = useNotifications();
    const navigate = useNavigate();

    const displayAvatarUrl = myProfile?.avatar_url || user?.user_metadata?.avatar_url;

    const _monthName = selectedDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const monthLabel = _monthName.charAt(0).toUpperCase() + _monthName.slice(1);

    // User Dropdown State
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const menuRef = useRef(null);
    const notificationsRef = useRef(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        if (showUserMenu || showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu, showNotifications]);

    return (
        <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
            gap: '24px',
            position: 'sticky',
            top: 0, // Stick to very top
            zIndex: 40,
            background: 'var(--bg-primary)', // Adapted to theme
            // backdropFilter: 'blur(10px)', // Disabled for now as we don't have alpha var yet
            paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
            paddingBottom: '24px',
            margin: '0 -40px', // Negative margin to stretch full width of container padding
            paddingLeft: '40px', // compensate
            paddingRight: '40px', // compensate
            borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
            {/* Search Bar (Left) */}
            <div style={{
                flex: 1,
                maxWidth: '360px',
                position: 'relative'
            }}>
                <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                    type="text"
                    placeholder="Buscar..."
                    style={{
                        width: '100%',
                        padding: '12px 12px 12px 48px',
                        borderRadius: '24px',
                        border: '1px solid transparent',
                        background: 'var(--bg-card)',
                        boxShadow: 'var(--shadow-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                    }}
                />
            </div>

            {/* Middle: Month Navigation */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                background: 'var(--bg-card)', padding: '6px 8px', borderRadius: '24px',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <button
                    onClick={handlePrevMonth}
                    style={{
                        width: 32, height: 32, borderRadius: '50%',
                        border: 'none', background: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-primary)'
                    }}
                    className="hover-bg"
                >
                    <ChevronLeft size={20} />
                </button>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    minWidth: '140px', justifyContent: 'center'
                }}>
                    <span style={{ fontWeight: '600', textTransform: 'capitalize', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {monthLabel}
                    </span>
                </div>

                <button
                    onClick={handleNextMonth}
                    style={{
                        width: 32, height: 32, borderRadius: '50%',
                        border: 'none', background: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-primary)'
                    }}
                    className="hover-bg"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                    onClick={onOpenNewTransaction}
                    className="btn btn-primary"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: '20px', fontSize: '0.9rem'
                    }}
                >
                    <Plus size={18} strokeWidth={3} />
                    <span style={{ fontWeight: '600' }}>Nova Transação</span>
                </button>

                {/* Notifications Bell */}
                <div style={{ position: 'relative' }} ref={notificationsRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            border: 'none',
                            background: showNotifications ? 'var(--bg-secondary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            position: 'relative'
                        }}
                        className="hover-bg"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '18px',
                                height: '18px',
                                background: 'var(--primary)',
                                borderRadius: '50%',
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(81, 0, 255, 0.3)'
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div style={{
                            position: 'absolute',
                            top: '120%',
                            right: 0,
                            width: '320px',
                            boxShadow: 'var(--shadow-lg)',
                            borderRadius: '16px',
                            border: '1px solid rgba(0,0,0,0.05)',
                            zIndex: 100
                        }}>
                            <NotificationsDropdown
                                notifications={notifications}
                                onAcceptInvite={acceptGroupInvite}
                                onClose={() => setShowNotifications(false)}
                            />
                        </div>
                    )}
                </div>

                <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>

                {/* User Section */}
                <div style={{ position: 'relative' }} ref={menuRef}>
                    <div
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    >
                        {displayAvatarUrl ? (
                            <img
                                src={displayAvatarUrl}
                                alt="Profile"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid #fff',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: 40,
                                height: 40,
                                background: 'var(--bg-secondary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #fff',
                                boxShadow: 'var(--shadow-sm)',
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: 'var(--text-primary)'
                            }}>
                                {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || <User size={20} color="var(--text-secondary)" />}
                            </div>
                        )}
                        <MoreVertical size={16} color="var(--text-tertiary)" />
                    </div>

                    {/* Dropdown */}
                    {showUserMenu && (
                        <div style={{
                            position: 'absolute', top: '120%', right: 0,
                            width: '200px', background: '#FFFFFF',
                            borderRadius: '16px', boxShadow: 'var(--shadow-lg)',
                            padding: '8px', zIndex: 100, border: '1px solid rgba(0,0,0,0.05)'
                        }}>
                            <button onClick={() => navigate('/account')} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }} className="hover-bg">
                                <Settings size={16} /> Minha Conta
                            </button>
                            <button onClick={signOut} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', fontSize: '0.9rem', color: 'var(--danger)', cursor: 'pointer' }} className="hover-bg">
                                <LogOut size={16} /> Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .hover-bg:hover { background-color: var(--bg-primary) !important; }
            `}</style>
        </header>
    );
}

