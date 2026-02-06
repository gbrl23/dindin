import React, { useState, useEffect } from 'react';
import { useCards } from '../../hooks/useCards';
import { X, Plus, ChevronDown, ArrowLeft } from 'lucide-react';
import { validateName, validateDayOfMonth, validateAll, errorContainerStyle, getErrorMessageStyle } from '../../utils/validation';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function NewCardModal({ onClose, onSuccess, initialData = null }) {
    const { addCard, updateCard } = useCards();
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

    const [showAllColors, setShowAllColors] = useState(false);
    const [formData, setFormData] = useState({
        name: '', closingDay: '', dueDay: '', brand: 'mastercard', last4: '',
        color: colors[0].value
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Initialize logic
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                closingDay: initialData.closing_day,
                dueDay: initialData.due_day,
                brand: initialData.brand || 'mastercard',
                last4: initialData.last_4_digits || '',
                color: initialData.color || colors[0].value
            });
        }
    }, [initialData]);

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: null });
        }
    };

    const handleBlur = (field) => {
        setTouched({ ...touched, [field]: true });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const validation = validateAll({
            name: validateName(formData.name, { maxLength: 50, fieldName: 'Nome do cartão' }),
            closingDay: validateDayOfMonth(formData.closingDay),
            dueDay: validateDayOfMonth(formData.dueDay)
        });

        if (!validation.valid) {
            setErrors(validation.errors);
            setTouched({ name: true, closingDay: true, dueDay: true });
            return;
        }

        try {
            let result;
            if (initialData && initialData.id) {
                result = await updateCard(initialData.id, formData);
            } else {
                result = await addCard(formData);
            }

            if (onSuccess) {
                // If it's a new card (array returned usually from Supabase insert select), extract it
                // Logic depends on what `addCard` returns. 
                // Assuming `addCard` refreshes context but might return the data.
                // If not, we just call onSuccess() and let parent handle refresh.
                onSuccess(result);
            }
            onClose();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    };

    // Styling helpers
    const inputContainerStyle = {
        background: '#F2F2F7',
        borderRadius: '12px',
        padding: '12px 16px',
        border: '1px solid transparent',
        transition: 'all 0.2s'
    };

    const labelStyle = {
        display: 'block', fontSize: '0.75rem', fontWeight: '600',
        color: 'var(--text-secondary)', marginBottom: '6px', marginLeft: '4px'
    };

    const inputStyle = {
        width: '100%', background: 'transparent', border: 'none',
        fontSize: '1rem', fontWeight: '500', outline: 'none',
        color: 'var(--text-primary)', fontFamily: 'inherit'
    };

    const visibleColors = showAllColors ? colors : colors.slice(0, 7);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: isMobile ? 'var(--bg-primary)' : 'rgba(0,0,0,0.4)',
            backdropFilter: isMobile ? 'none' : 'blur(8px)',
            display: 'flex',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: isMobile ? 'stretch' : 'center',
            overflowY: 'auto'
        }}>
            <div className={isMobile ? '' : 'card animate-scale-in'} style={{
                width: isMobile ? '100%' : '440px',
                padding: isMobile ? '16px' : '32px',
                paddingTop: isMobile ? '0' : '32px',
                position: 'relative',
                minHeight: isMobile ? '100vh' : 'auto',
                maxHeight: isMobile ? 'none' : '90vh',
                overflowY: 'auto',
                background: isMobile ? 'var(--bg-primary)' : '#FFF',
                borderRadius: isMobile ? '0' : '24px',
                boxShadow: isMobile ? 'none' : '0 24px 48px rgba(0,0,0,0.2)'
            }}>
                {/* Header Mobile */}
                {isMobile ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px 0',
                        marginBottom: '16px',
                        borderBottom: '1px solid var(--border)',
                        position: 'sticky',
                        top: 0,
                        background: 'var(--bg-primary)',
                        zIndex: 10
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-primary)',
                                padding: '8px',
                                marginLeft: '-8px'
                            }}
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
                            {initialData ? 'Editar Cartão' : 'Novo Cartão'}
                        </h2>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={onClose}
                            style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>
                            {initialData ? 'Editar Cartão' : 'Novo Cartão'}
                        </h2>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>
                            Preencha os dados do seu cartão.
                        </p>
                    </>
                )}

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Color Picker */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <label style={labelStyle}>Personalizar Cor</label>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            justifyContent: 'center',
                            padding: '12px',
                            background: '#F8F8FA',
                            borderRadius: showAllColors ? '24px' : '50px',
                            transition: 'all 0.3s ease'
                        }}>
                            {visibleColors.map((c, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setFormData({ ...formData, color: c.value })}
                                    style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        backgroundColor: c.value,
                                        cursor: 'pointer',
                                        border: formData.color === c.value ? '2px solid #fff' : '2px solid transparent',
                                        boxShadow: formData.color === c.value ? '0 0 0 2px var(--primary), 0 2px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 3px rgba(0,0,0,0.1)',
                                        transform: formData.color === c.value ? 'scale(1.2)' : 'scale(1)',
                                        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
                                    }}
                                    title={c.name}
                                />
                            ))}

                            {!showAllColors && (
                                <div
                                    onClick={() => setShowAllColors(true)}
                                    style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        background: '#E5E5EA',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'background 0.2s'
                                    }}
                                    title="Mais cores"
                                >
                                    <Plus size={16} />
                                </div>
                            )}
                        </div>
                        {showAllColors && (
                            <button
                                type="button"
                                onClick={() => setShowAllColors(false)}
                                style={{
                                    fontSize: '0.8rem', color: 'var(--text-secondary)',
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Mostrar menos
                            </button>
                        )}
                    </div>

                    {/* Name Input */}
                    <div>
                        <label style={{
                            ...labelStyle,
                            color: errors.name && touched.name ? '#FF3B30' : 'var(--text-secondary)'
                        }}>Nome / Apelido *</label>
                        <div style={{
                            ...inputContainerStyle,
                            ...(errors.name && touched.name ? errorContainerStyle : {})
                        }}>
                            <input
                                value={formData.name}
                                onChange={e => handleChange('name', e.target.value)}
                                onBlur={() => handleBlur('name')}
                                placeholder="Ex: Nubank, Cartão Black..."
                                maxLength={50}
                                style={inputStyle}
                                autoFocus
                            />
                        </div>
                        {errors.name && touched.name && (
                            <span style={getErrorMessageStyle()}>{errors.name}</span>
                        )}
                    </div>

                    {/* Brand Selection */}
                    <div>
                        <label style={labelStyle}>Bandeira</label>
                        <div style={{ ...inputContainerStyle, position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <select
                                value={formData.brand}
                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                            >
                                <option value="mastercard">Mastercard</option>
                                <option value="visa">Visa</option>
                                <option value="elo">Elo</option>
                                <option value="amex">Amex</option>
                                <option value="hipercard">Hipercard</option>
                                <option value="other">Outra</option>
                            </select>
                            <ChevronDown size={16} color="var(--text-secondary)" style={{ position: 'absolute', right: '16px', pointerEvents: 'none' }} />
                        </div>
                    </div>

                    {/* Dates Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{
                                ...labelStyle,
                                color: errors.closingDay && touched.closingDay ? '#FF3B30' : 'var(--text-secondary)'
                            }}>Dia Fechamento *</label>
                            <div style={{
                                ...inputContainerStyle,
                                ...(errors.closingDay && touched.closingDay ? errorContainerStyle : {})
                            }}>
                                <input
                                    type="number" min="1" max="31"
                                    value={formData.closingDay}
                                    onChange={e => handleChange('closingDay', e.target.value)}
                                    onBlur={() => handleBlur('closingDay')}
                                    placeholder="Ex: 05"
                                    style={{ ...inputStyle, textAlign: 'center' }}
                                />
                            </div>
                            {errors.closingDay && touched.closingDay && (
                                <span style={getErrorMessageStyle()}>{errors.closingDay}</span>
                            )}
                        </div>
                        <div>
                            <label style={{
                                ...labelStyle,
                                color: errors.dueDay && touched.dueDay ? '#FF3B30' : 'var(--text-secondary)'
                            }}>Dia Vencimento *</label>
                            <div style={{
                                ...inputContainerStyle,
                                ...(errors.dueDay && touched.dueDay ? errorContainerStyle : {})
                            }}>
                                <input
                                    type="number" min="1" max="31"
                                    value={formData.dueDay}
                                    onChange={e => handleChange('dueDay', e.target.value)}
                                    onBlur={() => handleBlur('dueDay')}
                                    placeholder="Ex: 12"
                                    style={{ ...inputStyle, textAlign: 'center' }}
                                />
                            </div>
                            {errors.dueDay && touched.dueDay && (
                                <span style={getErrorMessageStyle()}>{errors.dueDay}</span>
                            )}
                        </div>
                    </div>

                    {/* Last 4 Digits */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={labelStyle}>Últimos 4 dígitos</label>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginRight: '4px' }}>Opcional</span>
                        </div>
                        <div style={inputContainerStyle}>
                            <input
                                type="text" maxLength="4"
                                value={formData.last4} onChange={e => setFormData({ ...formData, last4: e.target.value.replace(/[^0-9]/g, '') })}
                                placeholder="••••"
                                style={{ ...inputStyle, letterSpacing: '4px', textAlign: 'center', fontWeight: '700' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            padding: '16px', borderRadius: '16px', border: 'none',
                            background: 'var(--primary)', // Using Primary variable
                            color: '#fff',
                            fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '12px',
                            boxShadow: '0 8px 20px rgba(81, 0, 255, 0.25)', // Matching purple shadow
                            transition: 'transform 0.1s'
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {initialData ? 'Salvar Alterações' : 'Adicionar Cartão'}
                    </button>
                </form>
            </div>
        </div>
    );
}
