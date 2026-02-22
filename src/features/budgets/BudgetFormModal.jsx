import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function BudgetFormModal({ isOpen, onClose, onSave, categories, existingBudgetIds, editingBudget }) {
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');

    const isEditing = !!editingBudget;

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
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
            />

            {/* Modal */}
            <div style={{
                position: 'relative',
                background: '#fff',
                borderRadius: '20px 20px 0 0',
                padding: '24px 20px',
                width: '100%',
                maxWidth: 480,
                maxHeight: '80vh',
                overflow: 'auto',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                        {isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
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
                            padding: '14px',
                            borderRadius: 12,
                            border: 'none',
                            background: '#5100FF',
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: 8,
                        }}
                    >
                        {isEditing ? 'Salvar' : 'Criar Orçamento'}
                    </button>
                </form>
            </div>
        </div>
    );
}
