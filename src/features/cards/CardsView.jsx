import React, { useState } from 'react';
import { useCards } from '../../hooks/useCards';
import { useNavigate } from 'react-router-dom';
import { Plus, X, CreditCard, Calendar, Trash2, Edit2, Wifi, Check, ChevronDown } from 'lucide-react';
import { validateName, validateDayOfMonth, validateAll, errorContainerStyle, getErrorMessageStyle } from '../../utils/validation';
import NewCardModal from './NewCardModal';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function CardsView() {
    const navigate = useNavigate();
    const { cards, addCard, removeCard, updateCard } = useCards();
    const isMobile = useIsMobile();

    // Expanded Colors Palette
    const colors = [
        { name: 'Black', value: '#1C1C1E' },
        { name: 'Purple', value: '#5856D6' },
        { name: 'Blue', value: '#007AFF' },
        { name: 'Pink', value: '#FF2D55' },
        { name: 'Gold', value: '#FFD60A' },
        { name: 'Teal', value: '#30B0C7' },
        { name: 'Green', value: '#34C759' },
        // Expanded options
        { name: 'Red', value: '#FF3B30' },
        { name: 'Orange', value: '#ff8c00ff' },
        { name: 'Indigo', value: '#6d18ffff' },
        { name: 'Mint', value: '#00C7BE' },
        { name: 'Brown', value: '#A2845E' },
        { name: 'Gray', value: '#8E8E93' },
        { name: 'Navy', value: '#1F2937' },
        { name: 'Wine', value: '#991B1B' },
        { name: 'Forest', value: '#166534' },
        { name: 'Emerald', value: '#10B981' },
        { name: 'Sky', value: '#0EA5E9' },
        { name: 'Violet', value: '#8B5CF6' },
        { name: 'Rose', value: '#F43F5E' },
        { name: 'Amber', value: '#f5a70bff' },
        { name: 'Neon', value: '#def50bff' }
    ];

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);

    // Open Modal
    const openModal = (card = null) => {
        setEditingCard(card);
        setIsModalOpen(true);
    };

    // Close Modal
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCard(null);
    };

    const getBrandDisplay = (brand) => {
        const b = (brand || '').toLowerCase();
        if (b === 'visa') return <span style={{ fontWeight: '800', fontStyle: 'italic', fontSize: '1.2rem' }}>VISA</span>;
        if (b === 'mastercard') return <div style={{ display: 'flex' }}><div style={{ width: 20, height: 20, background: '#EB001B', borderRadius: '50%', opacity: 0.9 }}></div><div style={{ width: 20, height: 20, background: '#F79E1B', borderRadius: '50%', marginLeft: '-8px', opacity: 0.9 }}></div></div>;
        return <span style={{ fontWeight: '700', fontSize: '1rem', textTransform: 'uppercase' }}>{b}</span>;
    };



    return (
        <div className="animate-fade-in" style={{ marginTop: '24px', paddingBottom: '40px' }}>

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isMobile ? '24px' : '32px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: '800', letterSpacing: '-1px', color: 'var(--text-primary)' }}>
                        Meus Cartões
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
                        Gerencie seus limites e datas de fatura
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    style={{
                        background: 'var(--text-primary)', color: '#fff',
                        border: 'none',
                        padding: isMobile ? '10px 16px' : '12px 24px',
                        borderRadius: '30px',
                        fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        fontSize: isMobile ? '0.85rem' : '1rem'
                    }}
                >
                    <Plus size={isMobile ? 18 : 20} /> {isMobile ? 'Novo' : 'Novo Cartão'}
                </button>
            </div>

            {/* Empty State */}
            {cards.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '1px dashed var(--border)' }}>
                    <div style={{ width: 64, height: 64, background: 'var(--bg-secondary)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <CreditCard size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>Nenhum cartão cadastrado</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Adicione seus cartões para controlar faturas.</p>
                </div>
            ) : (
                /* Cards Grid */
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: isMobile ? '20px' : '24px' }}>
                    {cards.map((card) => (
                        <div key={card.id} className="card-hover" style={{ position: 'relative', perspective: '1000px' }}>
                            {/* Visual Card */}
                            <div
                                onClick={() => navigate(`/card-invoice/${card.id}`)}
                                style={{
                                    background: card.color || colors[0].value,
                                    borderRadius: '24px',
                                    padding: '28px',
                                    color: '#fff',
                                    height: '220px',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'transform 0.3s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {/* Top Row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ width: 40, height: 28, background: 'rgba(255,255,255,0.2)', borderRadius: '6px', backdropFilter: 'blur(4px)' }} /> {/* Chip */}
                                        <Wifi size={24} style={{ transform: 'rotate(90deg)', opacity: 0.6 }} />
                                    </div>
                                    <div style={{ opacity: 0.9 }}>
                                        {getBrandDisplay(card.brand)}
                                    </div>
                                </div>

                                {/* Middle: Number (Fake Mask) */}
                                <div style={{ fontSize: '1.4rem', letterSpacing: '2px', opacity: 0.8, fontFamily: 'monospace' }}>
                                    •••• •••• •••• {card.last_4_digits || '••••'}
                                </div>

                                {/* Bottom Row: Name & Dates */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>Titular</div>
                                        <div style={{ fontWeight: '600', letterSpacing: '0.5px' }}>{card.name.toUpperCase()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>Vence dia {card.due_day}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Fecha dia {card.closing_day}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons (Below Card) */}
                            <div style={{
                                display: 'flex',
                                justifyContent: isMobile ? 'center' : 'flex-end',
                                gap: isMobile ? '12px' : '8px',
                                marginTop: '12px',
                                paddingRight: isMobile ? '0' : '8px'
                            }}>
                                <button
                                    onClick={() => openModal(card)}
                                    style={{
                                        padding: isMobile ? '12px 20px' : '8px 16px',
                                        borderRadius: '20px',
                                        border: '1px solid var(--border)',
                                        background: '#fff',
                                        fontSize: isMobile ? '0.9rem' : '0.8rem',
                                        fontWeight: '600',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        minHeight: isMobile ? '44px' : 'auto',
                                        flex: isMobile ? 1 : 'none'
                                    }}
                                >
                                    <Edit2 size={isMobile ? 16 : 14} /> Editar
                                </button>
                                <button
                                    onClick={() => { if (window.confirm('Excluir cartão?')) removeCard(card.id) }}
                                    style={{
                                        padding: isMobile ? '12px 20px' : '8px 16px',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255,59,48,0.2)',
                                        background: 'rgba(255,59,48,0.05)',
                                        fontSize: isMobile ? '0.9rem' : '0.8rem',
                                        fontWeight: '600',
                                        color: 'var(--danger)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        minHeight: isMobile ? '44px' : 'auto',
                                        flex: isMobile ? 1 : 'none'
                                    }}
                                >
                                    <Trash2 size={isMobile ? 16 : 14} /> {isMobile ? 'Excluir' : ''}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}


            {/* ADD/EDIT MODAL PRO */}
            {isModalOpen && (
                <NewCardModal
                    onClose={closeModal}
                    onSuccess={() => {
                        // Card view automatically updates via useCards context but we can trigger specific actions if needed
                        closeModal();
                    }}
                    initialData={editingCard}
                />
            )}

        </div>
    );
}
