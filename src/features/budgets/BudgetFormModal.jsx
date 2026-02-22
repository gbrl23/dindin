import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function BudgetFormModal({ isOpen, onClose, onSave, categories, existingBudgetIds, editingBudget }) {
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');

    const isEditing = !!editingBudget;
    const isMobileModal = typeof window !== 'undefined' && window.innerWidth <= 480;

    useEffect(() => {
        if (editingBudget) {
            setCategoryId(editingBudget.category_id);
            setAmount(String(editingBudget.amount));
        } else {
            setCategoryId('');
            setAmount('');
        }
    }, [editingBudget, isOpen]);

    if (!isOpen) return null;

    // Filter out categories that already have a budget (except the one being edited)
    const availableCategories = categories.filter(cat => {
        if (isEditing && cat.id === editingBudget.category_id) return true;
        return !existingBudgetIds.includes(cat.id);
    }).filter(cat => cat.type === 'expense');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!categoryId || !amount || Number(amount) <= 0) return;

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);

        onSave({ categoryId, amount: Number(amount), isEditing, budgetId: editingBudget?.id });
        onClose();
    };
    return (
        <div
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 3000,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: isMobileModal ? 'flex-end' : 'center', justifyContent: 'center',
                cursor: 'pointer'
            }}
        >
            {/* Safety Margin Wrapper */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    padding: isMobileModal ? '0' : '40px',
                    display: 'flex',
                    alignItems: isMobileModal ? 'flex-end' : 'center',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: isMobileModal ? '100%' : '560px',
                    cursor: 'default'
                }}
            >
                <div style={{ position: 'relative', width: '100%', maxWidth: isMobileModal ? '100%' : '480px' }}>
                    <div className="card animate-fade-in custom-scroll" style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        borderRadius: isMobileModal ? '28px 28px 0 0' : '28px',
                        padding: isMobileModal ? '24px 20px 40px' : '32px',
                        position: 'relative',
                        maxHeight: isMobileModal ? '92vh' : '85vh',
                        overflowY: 'auto',
                        scrollbarGutter: 'stable',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', textAlign: 'center', letterSpacing: '-0.5px', color: 'var(--text-primary)', flex: 1 }}>
                                {isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}
                            </h3>
                            <button
                                onClick={onClose}
                                style={{
                                    position: 'absolute', right: '16px', top: '16px', background: 'var(--bg-secondary)', border: 'none',
                                    cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', zIndex: 20
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Category Select */}
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: '#666', marginBottom: 6, display: 'block' }}>
                                    Categoria
                                </label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    disabled={isEditing}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: 12,
                                        border: '1px solid #e0e0e0',
                                        fontSize: 15,
                                        backgroundColor: isEditing ? '#f5f5f5' : '#fff',
                                        appearance: 'auto',
                                    }}
                                >
                                    <option value="">Selecione...</option>
                                    {availableCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: '#666', marginBottom: 6, display: 'block' }}>
                                    Limite mensal (R$)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0,00"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: 12,
                                        border: '1px solid #e0e0e0',
                                        fontSize: 15,
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    background: 'var(--primary)',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    marginTop: '16px',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(81,0,255,0.2)'
                                }}
                            >
                                {isEditing ? 'Salvar' : 'Criar Orçamento'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
