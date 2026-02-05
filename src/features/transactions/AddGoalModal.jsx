import React, { useState } from 'react';
import { X } from 'lucide-react';
import { validateName, validateAmount, validateAll, errorContainerStyle, getErrorMessageStyle } from '../../utils/validation';

export default function AddGoalModal({ isOpen, onClose, onSave }) {
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [color, setColor] = useState('#3b82f6');
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validação
        const validation = validateAll({
            name: validateName(name, { maxLength: 50, fieldName: 'Nome da meta' }),
            target: validateAmount(target)
        });

        if (!validation.valid) {
            setErrors(validation.errors);
            setTouched({ name: true, target: true });
            return;
        }

        onSave({
            name: name.trim(),
            target_amount: parseFloat(target.replace(',', '.')),
            color
        });
        setName('');
        setTarget('');
        setErrors({});
        setTouched({});
        onClose();
    };

    const handleChange = (field, value) => {
        if (field === 'name') setName(value);
        if (field === 'target') setTarget(value);
        if (errors[field]) {
            setErrors({ ...errors, [field]: null });
        }
    };

    const handleBlur = (field) => {
        setTouched({ ...touched, [field]: true });
    };

    // Helper Styles (Shared)
    const inputContainerStyle = {
        background: '#F2F2F7',
        borderRadius: '12px',
        padding: '12px 16px',
        border: '1px solid transparent',
        transition: 'all 0.2s'
    };

    const inputStyle = {
        width: '100%', background: 'transparent', border: 'none',
        fontSize: '1rem', fontWeight: '500', outline: 'none',
        color: 'var(--text-primary)', fontFamily: 'inherit'
    };

    const labelStyle = (field) => ({
        fontSize: '0.8rem',
        color: errors[field] && touched[field] ? '#FF3B30' : 'var(--text-secondary)',
        fontWeight: '600',
        marginBottom: '4px',
        display: 'block',
        marginLeft: '4px'
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card animate-scale-in" style={{ width: '90%', maxWidth: '400px', padding: '24px', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Nova Meta</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <X size={20} color="var(--text-secondary)" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={labelStyle('name')}>Nome da Meta *</label>
                        <div style={{
                            ...inputContainerStyle,
                            ...(errors.name && touched.name ? errorContainerStyle : {})
                        }}>
                            <input
                                style={inputStyle}
                                placeholder="Ex: Viagem, Carro..."
                                value={name}
                                onChange={e => handleChange('name', e.target.value)}
                                onBlur={() => handleBlur('name')}
                                maxLength={50}
                                autoFocus
                            />
                        </div>
                        {errors.name && touched.name && (
                            <span style={getErrorMessageStyle()}>{errors.name}</span>
                        )}
                    </div>

                    <div>
                        <label style={labelStyle('target')}>Valor Alvo (R$) *</label>
                        <div style={{
                            ...inputContainerStyle,
                            ...(errors.target && touched.target ? errorContainerStyle : {})
                        }}>
                            <input
                                style={inputStyle}
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                placeholder="0,00"
                                value={target}
                                onChange={e => handleChange('target', e.target.value)}
                                onBlur={() => handleBlur('target')}
                            />
                        </div>
                        {errors.target && touched.target && (
                            <span style={getErrorMessageStyle()}>{errors.target}</span>
                        )}
                    </div>

                    <div>
                        <label style={labelStyle()}>Cor</label>
                        <div style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
                            {colors.map(c => (
                                <div
                                    key={c}
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: c,
                                        border: color === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', padding: '14px', borderRadius: '14px' }}>
                        Criar Meta
                    </button>
                </form>
            </div>
        </div>
    );
}
