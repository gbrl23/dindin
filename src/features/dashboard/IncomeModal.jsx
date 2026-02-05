import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { validateNonNegativeAmount, getErrorMessageStyle } from '../../utils/validation';

export default function IncomeModal({ isOpen, onClose, onSave, currentIncome }) {
    const [displayAmount, setDisplayAmount] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Initial format
            const val = currentIncome || 0;
            setDisplayAmount(formatCurrency(val));
            setError('');
        }
    }, [isOpen, currentIncome]);

    if (!isOpen) return null;

    const formatCurrency = (value) => {
        if (!value) return '0,00';
        // Convert to cents then to string with comma
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    };

    const handleInputChange = (e) => {
        let value = e.target.value;
        // Remove everything that isn't a digit
        value = value.replace(/\D/g, '');

        // Convert to float (divide by 100 for cents)
        const numericValue = parseFloat(value) / 100;

        setDisplayAmount(formatCurrency(numericValue));
        if (error) setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Convert displayed "5.000,00" back to float 5000.00
        const rawValue = displayAmount.replace(/\./g, '').replace(',', '.');
        const numericValue = parseFloat(rawValue);

        // Validação
        const validation = validateNonNegativeAmount(numericValue);
        if (!validation.valid) {
            setError(validation.message);
            return;
        }

        onSave(numericValue);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card animate-scale-in" style={{ width: '90%', maxWidth: '360px', padding: '24px', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Definir Renda Mensal</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <X size={20} color="var(--text-secondary)" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                            Qual seu salário / receita base?
                        </label>
                        <div style={{
                            background: '#F2F2F7',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: error ? '1px solid #FF3B30' : '1px solid transparent',
                            transition: 'all 0.2s'
                        }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-secondary)' }}>R$</span>
                            <input
                                style={{
                                    width: '100%', background: 'transparent', border: 'none',
                                    fontSize: '1.2rem', fontWeight: '700', outline: 'none',
                                    color: 'var(--text-primary)', fontFamily: 'inherit'
                                }}
                                type="text"
                                inputMode="numeric"
                                placeholder="0,00"
                                value={displayAmount}
                                onChange={handleInputChange}
                                autoFocus
                            />
                        </div>
                        {error && (
                            <span style={getErrorMessageStyle()}>{error}</span>
                        )}
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                            Este valor será usado como base para calcular seu saldo mensal inicial.
                        </p>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '14px', borderRadius: '14px' }}>
                        Salvar Renda
                    </button>
                </form>
            </div>
        </div>
    );
}
