
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import { subscribeToNotificationChanges } from '../../hooks/useNotifications';
import { Plus, Loader } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';

export default function GroupsView() {
    const navigate = useNavigate();
    const { groups, invites, loading, acceptInvite, refreshInvites, refreshGroups } = useGroups();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Subscribe para atualizações do sino de notificações
    useEffect(() => {
        const unsubscribe = subscribeToNotificationChanges(() => {
            refreshInvites();
            refreshGroups();
        });
        return unsubscribe;
    }, [refreshInvites, refreshGroups]);

    const handleAcceptInvite = async (inviteId) => {
        try {
            await acceptInvite(inviteId);
        } catch (error) {
            alert(`Erro ao aceitar: ${error.message}`);
        }
    };


    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
            <Loader className="animate-spin" color="var(--primary)" />
        </div>
    );

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px', paddingTop: '16px' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 4px 0' }}>Grupos</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>Gerencie seus grupos de despesas</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-primary"
                    style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(81, 0, 255, 0.3)' }}
                >
                    <Plus size={24} />
                </button>
            </header>


            {/* PENDING INVITES BANNER */}
            {invites.length > 0 && (
                <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {invites.map(invite => (
                        <div key={invite.id} className="card" style={{
                            padding: '16px 20px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'linear-gradient(to right, rgba(81, 0, 255, 0.05), transparent)',
                            border: '1px solid rgba(81, 0, 255, 0.2)',
                            borderRadius: '16px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ fontSize: '1.5rem', background: 'var(--bg-card)', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    {invite.group?.icon || '📬'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', color: 'var(--primary)' }}>Convite: {invite.group?.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Você foi convidado para participar</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleAcceptInvite(invite.id)}
                                className="btn btn-primary"
                                style={{ padding: '8px 20px', fontSize: '0.85rem', height: 'auto', borderRadius: '10px' }}
                            >
                                Aceitar
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* GROUPS GRID */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '20px'
            }}>
                {groups.length === 0 ? (
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-card)',
                        borderRadius: '24px',
                        border: '2px dashed var(--border)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>👥</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Nenhum grupo ainda</h3>
                        <p style={{ fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto 24px auto' }}>Crie um grupo para dividir despesas com amigos, família ou parceiros.</p>
                        <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
                            Criar meu primeiro grupo
                        </button>
                    </div>
                ) : (
                    groups.map(group => (
                        <div
                            key={group.id}
                            className="card hover-scale"
                            onClick={() => navigate(`/groups/${group.id}`)}
                            style={{
                                padding: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                gap: '16px',
                                background: 'var(--bg-card)',
                                height: '100%',
                                minHeight: '180px'
                            }}
                        >
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '20px',
                                background: 'var(--bg-secondary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2rem',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                {group.icon || '👥'}
                            </div>

                            <div style={{ width: '100%' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {group.name}
                                </h3>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <span className={`badge ${group.my_role === 'owner' ? 'badge-primary' : 'badge-secondary'}`} style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                                        {group.my_role === 'owner' ? 'Admin' : 'Membro'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <CreateGroupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
