import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useGroups } from '../../hooks/useGroups';
import { validateName, validateAll, errorContainerStyle, getErrorMessageStyle } from '../../utils/validation';

export default function CreateGroupModal({ isOpen, onClose }) {
    const { createGroup } = useGroups();
    const [loading, setLoading] = useState(false);
    const [newGroupData, setNewGroupData] = useState({ name: '', description: '', icon: '✈️' });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    if (!isOpen) return null;

    const handleCreate = async (e) => {
        e.preventDefault();

        // Validação
        const validation = validateAll({
            name: validateName(newGroupData.name, { maxLength: 50, fieldName: 'Nome do grupo' })
        });

        if (!validation.valid) {
            setErrors(validation.errors);
            setTouched({ name: true });
            return;
        }

        try {
            setLoading(true);
            await createGroup({
                ...newGroupData,
                name: newGroupData.name.trim(),
                description: newGroupData.description.trim()
            });
            setNewGroupData({ name: '', description: '', icon: '✈️' });
            setErrors({});
            setTouched({});
            onClose();
        } catch (error) {
            alert(`Erro ao criar grupo: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setNewGroupData({ ...newGroupData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: null });
        }
    };

    const handleBlur = (field) => {
        setTouched({ ...touched, [field]: true });
    };

    const icons = ['🏠', '✈️', '🎉', '🍕', '🍻', '🛍️', '🎁', '💼', '💡', '🚗'];

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div
                className="card animate-scale-in"
                style={{ width: '90%', maxWidth: '400px', background: 'var(--bg-card)', padding: '24px' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Novo Grupo</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <X size={20} color="var(--text-secondary)" />
                    </button>
                </div>

                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Ícone</label>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                            {icons.map(icon => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => handleChange('icon', icon)}
                                    style={{
                                        fontSize: '1.5rem',
                                        minWidth: '48px', height: '48px',
                                        borderRadius: '12px', border: 'none',
                                        background: newGroupData.icon === icon ? 'var(--primary)' : 'var(--bg-secondary)',
                                        color: newGroupData.icon === icon ? 'white' : 'inherit',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{
                            fontSize: '0.8rem',
                            color: errors.name && touched.name ? '#FF3B30' : 'var(--text-secondary)',
                            fontWeight: '600',
                            marginBottom: '8px',
                            display: 'block'
                        }}>
                            Nome do Grupo *
                        </label>
                        <input
                            className="input"
                            placeholder="Ex: Viagem de Ano Novo"
                            value={newGroupData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            maxLength={50}
                            autoFocus
                            required
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--bg-secondary)',
                                border: 'none', outline: 'none', boxShadow: 'none',
                                ...(errors.name && touched.name ? errorContainerStyle : {})
                            }}
                        />
                        {errors.name && touched.name && (
                            <span style={getErrorMessageStyle()}>{errors.name}</span>
                        )}
                    </div>

                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Descrição (Opcional)</label>
                        <textarea
                            className="input"
                            placeholder="Para que serve este grupo?"
                            rows={2}
                            maxLength={200}
                            value={newGroupData.description}
                            onChange={e => handleChange('description', e.target.value)}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--bg-secondary)', resize: 'none',
                                border: 'none', outline: 'none', boxShadow: 'none'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: '8px', padding: '14px', borderRadius: '12px', fontWeight: '600' }}
                    >
                        {loading ? 'Criando...' : 'Criar Grupo'}
                    </button>
                </form>
            </div>
        </div>
    );
}
