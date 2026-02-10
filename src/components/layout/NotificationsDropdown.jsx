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
        <div style={{
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '4px',
            zIndex: 100,
            maxHeight: '400px',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{
                padding: '4px 8px 12px',
                borderBottom: '1px solid var(--border)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)'
                }}>
                    Notificações
                </h3>
            </div>

            {/* Empty State */}
            {notifications.length === 0 && (
                <div style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        opacity: 0.5
                    }}>
                        <Bell size={28} />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>
                        Nenhuma notificação por aqui
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                        Avisaremos quando algo novo acontecer
                    </p>
                </div>
            )}

            {/* Notification Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map(notification => (
                    <div
                        key={notification.id}
                        style={{
                            padding: '12px',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {/* Icon */}
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'rgba(81, 0, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                            flexShrink: 0
                        }}>
                            {notification.icon || <Bell size={18} />}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontWeight: '700',
                                fontSize: '0.85rem',
                                color: 'var(--text-primary)',
                                marginBottom: '2px'
                            }}>
                                {notification.title}
                            </div>
                            <div style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.4'
                            }}>
                                {notification.message}
                            </div>

                            {/* Action Button */}
                            {notification.type === 'group_invite' && (
                                <button
                                    onClick={() => handleAccept(notification)}
                                    className="btn btn-primary"
                                    style={{
                                        marginTop: '12px',
                                        padding: '8px 16px',
                                        fontSize: '0.8rem',
                                        height: 'auto',
                                        borderRadius: '10px',
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        fontWeight: '700'
                                    }}
                                >
                                    <Check size={16} />
                                    Aceitar Convite
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
