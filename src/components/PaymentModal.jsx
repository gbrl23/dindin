import React, { useState } from 'react';
import { X, DollarSign, Calendar, FileText } from 'lucide-react';
import { validateAmount, validateDate, validateDescription, validateAll, errorContainerStyle, getErrorMessageStyle } from '../utils/validation';

export default function PaymentModal({ share, onClose, onSubmit }) {
    const [amount, setAmount] = useState(share.remainingBalance?.toFixed(2) || share.share_amount.toFixed(2));
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const remainingBalance = share.remainingBalance !== undefined
        ? share.remainingBalance
        : share.share_amount;

    const handleChange = (field, value) => {
        if (field === 'amount') setAmount(value);
        if (field === 'paymentDate') setPaymentDate(value);
        if (field === 'notes') setNotes(value);
        if (errors[field]) {
            setErrors({ ...errors, [field]: null });
        }
    };

    const handleBlur = (field) => {
        setTouched({ ...touched, [field]: true });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const numericAmount = parseFloat(amount);

        // Validação
        const validation = validateAll({
            amount: validateAmount(amount),
            paymentDate: validateDate(paymentDate)
        });

        // Validação adicional para limite máximo
        if (validation.valid && numericAmount > remainingBalance) {
            validation.valid = false;
            validation.errors.amount = `Valor não pode ser maior que R$ ${remainingBalance.toFixed(2)}`;
        }

        if (!validation.valid) {
            setErrors(validation.errors);
            setTouched({ amount: true, paymentDate: true });
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit({
                transactionId: share.transaction_id,
                profileId: share.profile_id,
                amount: numericAmount,
                paymentDate,
                notes: notes.trim() || null
            });
            onClose();
        } catch (err) {
            setErrors({ submit: 'Erro ao registrar pagamento. Tente novamente.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{
                    maxWidth: '400px',
                    width: '100%',
                    padding: '24px',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: 0 }}>Registrar Pagamento</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '4px' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Transaction Info */}
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '0.9rem'
                }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{share.transaction?.description || 'Gasto'}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Valor total: R$ {share.share_amount.toFixed(2)}
                    </div>
                    <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: '600' }}>
                        Saldo devedor: R$ {remainingBalance.toFixed(2)}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Amount */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            color: errors.amount && touched.amount ? '#FF3B30' : 'var(--text-secondary)',
                            marginBottom: '6px'
                        }}>
                            <DollarSign size={16} />
                            Valor Pago *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            className="input"
                            value={amount}
                            onChange={(e) => handleChange('amount', e.target.value)}
                            onBlur={() => handleBlur('amount')}
                            placeholder="0.00"
                            required
                            autoFocus
                            style={errors.amount && touched.amount ? errorContainerStyle : {}}
                        />
                        {errors.amount && touched.amount && (
                            <span style={getErrorMessageStyle()}>{errors.amount}</span>
                        )}
                    </div>

                    {/* Date */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            color: errors.paymentDate && touched.paymentDate ? '#FF3B30' : 'var(--text-secondary)',
                            marginBottom: '6px'
                        }}>
                            <Calendar size={16} />
                            Data do Pagamento *
                        </label>
                        <input
                            type="date"
                            min="2000-01-01"
                            max="2099-12-31"
                            className="input"
                            value={paymentDate}
                            onChange={(e) => handleChange('paymentDate', e.target.value)}
                            onBlur={() => handleBlur('paymentDate')}
                            required
                            style={errors.paymentDate && touched.paymentDate ? errorContainerStyle : {}}
                        />
                        {errors.paymentDate && touched.paymentDate && (
                            <span style={getErrorMessageStyle()}>{errors.paymentDate}</span>
                        )}
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            <FileText size={16} />
                            Observações (opcional)
                        </label>
                        <textarea
                            className="input"
                            value={notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Ex: Transferência via Pix"
                            rows={2}
                            maxLength={200}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* Error */}
                    {errors.submit && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: 'var(--danger)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            marginBottom: '16px'
                        }}>
                            {errors.submit}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '12px', opacity: submitting ? 0.7 : 1 }}
                            disabled={submitting}
                        >
                            {submitting ? 'Salvando...' : 'Confirmar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
