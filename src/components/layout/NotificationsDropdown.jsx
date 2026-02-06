import React from 'react';
import { Bell, Check, X } from 'lucide-react';

export default function NotificationsDropdown({ notifications, onAcceptInvite, onClose }) {
    const handleAccept = async (notification) => {
        try {
            await onAcceptInvite(notification.id);
        } catch (error) {
            alert(`Erro ao aceitar: ${error.message}`);
        }
    };

    return (
        <>
            {/* Header */}
            <div style={{
                padding: '12px 12px 8px',
                borderBottom: '1px solid var(--border)',
                marginBottom: '8px'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)'
                }}>
                    Notificações
                </h3>
            </div>

            {/* Empty State */}
            {notifications.length === 0 && (
                <div style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                }}>
                    <Bell size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                        Nenhuma notificação
                    </p>
                </div>
            )}

            {/* Notification Items */}
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    style={{
                        padding: '12px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'linear-gradient(to right, rgba(81, 0, 255, 0.05), transparent)',
                        marginBottom: '4px'
                    }}
                >
                    {/* Icon */}
                    <div style={{
                        fontSize: '1.5rem',
                        background: 'var(--bg-card)',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {notification.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            color: 'var(--primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {notification.title}
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)'
                        }}>
                            {notification.message}
                        </div>
                    </div>

                    {/* Action Button */}
                    {notification.type === 'group_invite' && (
                        <button
                            onClick={() => handleAccept(notification)}
                            className="btn btn-primary"
                            style={{
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                height: 'auto',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <Check size={14} />
                            Aceitar
                        </button>
                    )}
                </div>
            ))}
        </>
    );
}
