import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { validateName, validateAll, errorContainerStyle, getErrorMessageStyle } from '../../utils/validation';

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
    '#f43f5e', '#64748b'
];

const EMOJIS = [
    '🏠', '🍔', '🚗', '💊', '🎉', '📚', '🛍️', '💰', '📈', '📦',
    '✈️', '🎮', '💡', '🔧', '🐾', '🏋️', '🎬', '🎤', '🎨', '💼',
    '🛒', '🧺', '🔁', '📺', '🎵', '📅'
];

export default function NewCategoryModal({ onClose, onSuccess, type = 'expense' }) {
    const { user } = useAuth();

    const [name, setName] = useState('');
    const [icon, setIcon] = useState('🏠');
    const [color, setColor] = useState('#ef4444');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validação
        const validation = validateAll({
            name: validateName(name, { maxLength: 50 })
        });

        if (!validation.valid) {
            setErrors(validation.errors);
            setTouched({ name: true });
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from('categories').insert({
                user_id: user.id,
                name: name.trim(),
                icon,
                color,
                type
            });

            if (error) throw error;

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao criar categoria');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNameChange = (e) => {
        setName(e.target.value);
        if (errors.name) {
            setErrors({ ...errors, name: null });
        }
    };

    const handleBlur = (field) => {
        setTouched({ ...touched, [field]: true });
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1100, // Higher than transaction modal
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #E5E5EA; borderRadius: 10px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #D1D1D6; }
            `}</style>

            <div style={{ position: 'relative', width: '90%', maxWidth: '380px' }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        right: '0',
                        top: '-44px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#FFF',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px',
                        zIndex: 20
                    }}
                >
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Fechar</span>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px', borderRadius: '50%', display: 'flex' }}>
                        <X size={20} />
                    </div>
                </button>

                <div className="card animate-fade-in custom-scroll" style={{
                    width: '100%',
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '24px',
                    position: 'relative',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>Nova Categoria</h2>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Preview */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '24px',
                                background: color, color: '#FFF',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2.5rem',
                                boxShadow: `0 10px 20px ${color}40`
                            }}>
                                {icon}
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label style={{
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                color: errors.name && touched.name ? '#FF3B30' : 'var(--text-secondary)',
                                marginBottom: '8px',
                                display: 'block'
                            }}>
                                Nome *
                            </label>
                            <input
                                value={name}
                                onChange={handleNameChange}
                                onBlur={() => handleBlur('name')}
                                placeholder="Ex: Assinaturas"
                                autoFocus
                                maxLength={50}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '12px',
                                    background: '#F2F2F7', border: 'none',
                                    fontSize: '1rem', fontWeight: '500', outline: 'none',
                                    ...(errors.name && touched.name ? errorContainerStyle : {})
                                }}
                            />
                            {errors.name && touched.name && (
                                <span style={getErrorMessageStyle()}>{errors.name}</span>
                            )}
                        </div>

                        {/* Colors */}
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Cor</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: c, border: '2px solid #fff',
                                            boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                                            cursor: 'pointer', transform: color === c ? 'scale(1.1)' : 'scale(1)',
                                            transition: 'all 0.2s'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Emojis */}
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Ícone</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                {EMOJIS.map(e => (
                                    <button
                                        key={e}
                                        type="button"
                                        onClick={() => setIcon(e)}
                                        style={{
                                            aspectRatio: '1', borderRadius: '12px',
                                            background: icon === e ? 'var(--bg-secondary)' : 'transparent',
                                            border: 'none', fontSize: '1.5rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: '16px', borderRadius: '16px',
                                background: 'var(--primary)', color: '#fff',
                                border: 'none', fontSize: '1rem', fontWeight: '600',
                                marginTop: '8px', cursor: 'pointer',
                                opacity: submitting ? 0.7 : 1
                            }}
                        >
                            Criar Categoria
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
