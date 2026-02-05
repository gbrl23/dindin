import React from 'react';
import { Layers, Calendar, FileText, CheckCircle } from 'lucide-react';

export default function SeriesActionModal({ isOpen, onClose, onConfirm, action = 'edit', isBulk = false }) {
    if (!isOpen) return null;

    const isDelete = action === 'delete';
    const title = isBulk
        ? (isDelete ? 'Excluir Itens Selecionados' : 'Editar Itens')
        : (isDelete ? 'Excluir Recorrência' : 'Editar Recorrência');

    const description = isBulk
        ? 'Alguns itens selecionados fazem parte de recorrências. Como deseja prosseguir?'
        : 'Este lançamento faz parte de uma série. Como você deseja aplicar as alterações?';

    const color = isDelete ? 'var(--danger)' : 'var(--primary)';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px'
        }}>
            <div className="card animate-fade-in" style={{
                width: '100%', maxWidth: '400px',
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '20px',
                        background: isDelete ? 'rgba(255, 59, 48, 0.1)' : 'rgba(0, 122, 255, 0.1)',
                        color: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px auto'
                    }}>
                        <Layers size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>
                        {title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        {description}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Option 1: Only This / Selected */}
                    <button
                        onClick={() => onConfirm('single')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '16px', borderRadius: '16px',
                            background: '#F2F2F7', border: '2px solid transparent',
                            cursor: 'pointer', transition: 'all 0.2s',
                            textAlign: 'left'
                        }}
                    >
                        <div style={{ background: '#FFF', padding: '8px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <FileText size={20} color="var(--text-primary)" />
                        </div>
                        <div>
                            <span style={{ display: 'block', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                {isBulk ? 'Apenas os selecionados' : 'Apenas este'}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {isDelete
                                    ? (isBulk ? 'Exclui apenas os itens marcados na lista.' : 'Exclui só este item.')
                                    : 'Edita só este, mantém os outros.'}
                            </span>
                        </div>
                    </button>

                    {/* Option 2: Future (Hidden in Bulk) */}
                    {!isBulk && (
                        <button
                            onClick={() => onConfirm('future')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '16px',
                                padding: '16px', borderRadius: '16px',
                                background: '#F2F2F7', border: '2px solid transparent',
                                cursor: 'pointer', transition: 'all 0.2s',
                                textAlign: 'left'
                            }}
                        >
                            <div style={{ background: '#FFF', padding: '8px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <Calendar size={20} color="var(--text-primary)" />
                            </div>
                            <div>
                                <span style={{ display: 'block', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Deste em diante</span>
                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {isDelete ? 'Exclui este e os futuros.' : 'Muda este e todos os próximos.'}
                                </span>
                            </div>
                        </button>
                    )}

                    {/* Option 3: All */}
                    <button
                        onClick={() => onConfirm('all')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '16px', borderRadius: '16px',
                            background: '#F2F2F7', border: '2px solid transparent',
                            cursor: 'pointer', transition: 'all 0.2s',
                            textAlign: 'left'
                        }}
                    >
                        <div style={{ background: '#FFF', padding: '8px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <CheckCircle size={20} color="var(--text-primary)" />
                        </div>
                        <div>
                            <span style={{ display: 'block', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                {isBulk ? 'Todas as séries envolvidas' : 'Todos os itens'}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {isDelete
                                    ? (isBulk ? 'Exclui todas as recorrências dos itens selecionados.' : 'Exclui a série inteira.')
                                    : 'Atualiza todos, passados e futuros.'}
                            </span>
                        </div>
                    </button>

                </div>

                <div style={{ marginTop: '24px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%', padding: '16px',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            border: 'none',
                            fontSize: '1rem', fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
