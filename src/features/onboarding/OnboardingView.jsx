import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { validateName, validateDayOfMonth, validateAll } from '../../utils/validation';
import { useProfiles } from '../../hooks/useProfiles';
import {
    CreditCard, DollarSign, Calendar, ChevronRight, ChevronLeft,
    ChevronDown, Check, Trash2, Wallet, CalendarClock, Settings
} from 'lucide-react';

const STEPS = [
    { title: 'Cartão de Crédito', icon: CreditCard, color: '#5856D6' },
    { title: 'Salário / Renda', icon: DollarSign, color: '#3B82F6' },
    { title: 'Ciclo Financeiro', icon: Calendar, color: '#10B981' },
];

const COLORS = [
    { name: 'Black', value: '#1C1C1E' },
    { name: 'Purple', value: '#5856D6' },
    { name: 'Blue', value: '#007AFF' },
    { name: 'Pink', value: '#FF2D55' },
    { name: 'Gold', value: '#FFD60A' },
    { name: 'Teal', value: '#30B0C7' },
    { name: 'Green', value: '#34C759' },
    { name: 'Red', value: '#FF3B30' },
];

export default function OnboardingView() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { refreshProfiles } = useProfiles();

    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [profileId, setProfileId] = useState(null); // Armazena profile.id após step 1

    // Step 1: Card
    const [cardData, setCardData] = useState({
        name: '', closingDay: '', dueDay: '', brand: 'mastercard', color: '#5856D6'
    });
    const [cardErrors, setCardErrors] = useState({});
    const [cardSaved, setCardSaved] = useState(false);

    // Step 2: Salary
    const [salaryType, setSalaryType] = useState('full');
    const [salaryParts, setSalaryParts] = useState([{ day: 5, amount: '' }]);
    const [salary, setSalary] = useState('');
    const [salaryError, setSalaryError] = useState('');
    const [salarySaved, setSalarySaved] = useState(false);

    // Step 3: Financial cycle
    const [financialStartDay, setFinancialStartDay] = useState('');
    const [cycleError, setCycleError] = useState('');

    const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário';

    // Helper: busca profile com fallback e criação automática se necessário
    const findOrCreateProfile = async () => {
        // 1. Tenta por user_id (padrão correto)
        const { data: profile, error: err1 } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (profile) return profile;

        // 2. Fallback: perfis legados com id = auth_uid mas user_id = NULL
        const { data: legacyProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (legacyProfile) {
            // Corrige user_id para queries futuras
            await supabase
                .from('profiles')
                .update({ user_id: user.id })
                .eq('id', user.id);
            return legacyProfile;
        }

        // 3. Perfil não existe — cria agora
        console.warn('Onboarding: profile not found, creating...', err1?.message);
        const { data: newProfile, error: createErr } = await supabase
            .from('profiles')
            .insert({
                user_id: user.id,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
                email: user.email,
            })
            .select('id')
            .single();

        if (createErr) {
            console.error('Onboarding: failed to create profile', createErr);
            throw new Error('Não foi possível criar o perfil: ' + createErr.message);
        }

        return newProfile;
    };

    // === Step 1: Card handlers ===
    const handleCardNext = async () => {
        const validation = validateAll({
            name: validateName(cardData.name, { maxLength: 50, fieldName: 'Nome do cartão' }),
            closingDay: validateDayOfMonth(cardData.closingDay),
            dueDay: validateDayOfMonth(cardData.dueDay),
        });

        if (!validation.valid) {
            setCardErrors(validation.errors);
            return;
        }

        setIsLoading(true);
        try {
            const profile = await findOrCreateProfile();
            setProfileId(profile.id);

            const { error: cardError } = await supabase
                .from('cards')
                .insert([{
                    owner_id: profile.id,
                    name: cardData.name,
                    type: 'credit',
                    closing_day: parseInt(cardData.closingDay),
                    due_day: parseInt(cardData.dueDay),
                    color: cardData.color,
                    brand: cardData.brand,
                    last_4_digits: '',
                }]);

            if (cardError) throw cardError;
            setCardSaved(true);
            setCurrentStep(1);
        } catch (error) {
            alert('Erro ao salvar cartão: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // === Step 2: Salary handlers ===
    const handleSalaryNext = async () => {
        let totalIncome;
        let parts;

        if (salaryType === 'full') {
            totalIncome = salary ? parseFloat(salary.replace(/\./g, '').replace(',', '.')) : 0;
            parts = [{ day: parseInt(salaryParts[0]?.day) || 1, amount: totalIncome }];
        } else {
            parts = salaryParts.map(p => ({
                day: parseInt(p.day) || 1,
                amount: p.amount ? parseFloat(String(p.amount).replace(/\./g, '').replace(',', '.')) : 0
            })).filter(p => p.amount > 0);
            totalIncome = parts.reduce((sum, p) => sum + p.amount, 0);
        }

        if (totalIncome <= 0) {
            setSalaryError('Informe pelo menos um valor de renda.');
            return;
        }

        setSalaryError('');
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    salary_type: salaryType,
                    salary_parts: parts,
                    monthly_income: totalIncome,
                    salary: totalIncome,
                })
                .eq('id', profileId);

            if (error) throw error;
            setSalarySaved(true);
            setCurrentStep(2);
        } catch (error) {
            alert('Erro ao salvar renda: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // === Step 3: Financial cycle handler ===
    const handleFinish = async () => {
        const val = validateDayOfMonth(financialStartDay);
        if (!val.valid) {
            setCycleError(val.message);
            return;
        }

        setCycleError('');
        setIsLoading(true);
        try {
            // Safety: re-fetch profile if profileId was lost (eg. page reload)
            let finalProfileId = profileId;
            if (!finalProfileId) {
                const profile = await findOrCreateProfile();
                finalProfileId = profile.id;
                setProfileId(finalProfileId);
            }

            // Include salary_type as safety net — ProtectedRoute checks this field
            const { data: updated, error } = await supabase
                .from('profiles')
                .update({
                    financial_start_day: parseInt(financialStartDay),
                    salary_type: salaryType || 'full',
                })
                .eq('id', finalProfileId)
                .select('id, salary_type')
                .maybeSingle();

            if (error) throw error;

            if (!updated) {
                console.error('Onboarding: update returned no rows. profileId:', finalProfileId);
                throw new Error('Falha ao salvar configuração. Tente novamente.');
            }

            // Refresh profiles para que ProtectedRoute veja os dados atualizados
            await refreshProfiles();
            navigate('/dashboard', { replace: true });
        } catch (error) {
            alert('Erro ao salvar configuração: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // === Preview for step 3 ===
    const getPreviewText = () => {
        const day = parseInt(financialStartDay);
        if (!day || day < 1 || day > 31) return null;
        const endDay = day === 1 ? 'último dia do mês anterior' : `${day - 1}`;
        return `Seu mês vai de ${day} até ${endDay} do mês seguinte.`;
    };

    // === Salary total ===
    const getSalaryTotal = () => {
        if (salaryType === 'full') {
            return salary ? parseFloat(salary.replace(/\./g, '').replace(',', '.')) || 0 : 0;
        }
        return salaryParts.reduce((sum, p) => {
            const val = p.amount ? parseFloat(String(p.amount).replace(/\./g, '').replace(',', '.')) : 0;
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 16px',
            paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
        }}>
            <div style={{ width: '100%', maxWidth: '480px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{
                        fontSize: '1.8rem',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, var(--primary), #8B5CF6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '8px',
                    }}>
                        {currentStep === 0 ? `Olá, ${userName}!` : STEPS[currentStep].title}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        {currentStep === 0
                            ? 'Vamos configurar o essencial para começar.'
                            : `Etapa ${currentStep + 1} de 3`
                        }
                    </p>
                </div>

                {/* Progress Bar */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '32px',
                }}>
                    {STEPS.map((step, i) => (
                        <div key={i} style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            background: i <= currentStep ? step.color : 'var(--border)',
                            transition: 'background 0.3s',
                        }} />
                    ))}
                </div>

                {/* Step Icon */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: `${STEPS[currentStep].color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {React.createElement(STEPS[currentStep].icon, {
                            size: 28,
                            color: STEPS[currentStep].color
                        })}
                    </div>
                </div>

                {/* Card container */}
                <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>

                    {/* === STEP 0: Cartão === */}
                    {currentStep === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px' }}>
                                Adicione seu cartão de crédito
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                                Para calcular faturas e controlar gastos no cartão.
                            </p>

                            {/* Color picker */}
                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                                padding: '12px',
                                background: 'var(--bg-secondary)',
                                borderRadius: '16px',
                            }}>
                                {COLORS.map((c) => (
                                    <div
                                        key={c.value}
                                        onClick={() => setCardData({ ...cardData, color: c.value })}
                                        style={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            backgroundColor: c.value,
                                            cursor: 'pointer',
                                            border: cardData.color === c.value ? '2px solid #fff' : '2px solid transparent',
                                            boxShadow: cardData.color === c.value
                                                ? '0 0 0 2px var(--primary)'
                                                : 'inset 0 1px 3px rgba(0,0,0,0.1)',
                                            transform: cardData.color === c.value ? 'scale(1.15)' : 'scale(1)',
                                            transition: 'all 0.2s',
                                        }}
                                        title={c.name}
                                    />
                                ))}
                            </div>

                            {/* Name */}
                            <div>
                                <label htmlFor="card-name" style={labelStyle}>Nome / Apelido *</label>
                                <input
                                    id="card-name"
                                    className="input"
                                    value={cardData.name}
                                    onChange={e => {
                                        setCardData({ ...cardData, name: e.target.value });
                                        if (cardErrors.name) setCardErrors({ ...cardErrors, name: null });
                                    }}
                                    placeholder="Ex: Nubank, Cartão Black..."
                                    maxLength={50}
                                />
                                {cardErrors.name && <span style={errorStyle}>{cardErrors.name}</span>}
                            </div>

                            {/* Brand */}
                            <div>
                                <label htmlFor="card-brand" style={labelStyle}>Bandeira</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        id="card-brand"
                                        className="input"
                                        value={cardData.brand}
                                        onChange={e => setCardData({ ...cardData, brand: e.target.value })}
                                        style={{ appearance: 'none', paddingRight: '36px' }}
                                    >
                                        <option value="mastercard">Mastercard</option>
                                        <option value="visa">Visa</option>
                                        <option value="elo">Elo</option>
                                        <option value="amex">Amex</option>
                                        <option value="hipercard">Hipercard</option>
                                        <option value="other">Outra</option>
                                    </select>
                                    <ChevronDown size={16} color="var(--text-secondary)" style={{
                                        position: 'absolute', right: '14px', top: '50%',
                                        transform: 'translateY(-50%)', pointerEvents: 'none'
                                    }} />
                                </div>
                            </div>

                            {/* Days row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label htmlFor="card-closing" style={labelStyle}>Dia Fechamento *</label>
                                    <input
                                        id="card-closing"
                                        className="input"
                                        type="text" inputMode="numeric" maxLength={2}
                                        value={cardData.closingDay}
                                        onChange={e => {
                                            setCardData({ ...cardData, closingDay: e.target.value.replace(/[^0-9]/g, '') });
                                            if (cardErrors.closingDay) setCardErrors({ ...cardErrors, closingDay: null });
                                        }}
                                        placeholder="Ex: 05"
                                        style={{ textAlign: 'center' }}
                                    />
                                    {cardErrors.closingDay && <span style={errorStyle}>{cardErrors.closingDay}</span>}
                                </div>
                                <div>
                                    <label htmlFor="card-due" style={labelStyle}>Dia Vencimento *</label>
                                    <input
                                        id="card-due"
                                        className="input"
                                        type="text" inputMode="numeric" maxLength={2}
                                        value={cardData.dueDay}
                                        onChange={e => {
                                            setCardData({ ...cardData, dueDay: e.target.value.replace(/[^0-9]/g, '') });
                                            if (cardErrors.dueDay) setCardErrors({ ...cardErrors, dueDay: null });
                                        }}
                                        placeholder="Ex: 12"
                                        style={{ textAlign: 'center' }}
                                    />
                                    {cardErrors.dueDay && <span style={errorStyle}>{cardErrors.dueDay}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === STEP 1: Salário === */}
                    {currentStep === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px' }}>
                                Configure sua renda
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                                Usamos isso para calcular quanto sobra e sugerir orçamentos.
                            </p>

                            {/* Salary type selector */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {[
                                    { value: 'full', label: 'Inteiro', Icon: Wallet },
                                    { value: 'biweekly', label: '15 em 15', Icon: CalendarClock },
                                    { value: 'custom', label: 'Outro', Icon: Settings },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            setSalaryType(opt.value);
                                            if (opt.value === 'full') {
                                                setSalaryParts([{ day: salaryParts[0]?.day || 5, amount: salary }]);
                                            } else if (opt.value === 'biweekly') {
                                                setSalaryParts([
                                                    { day: salaryParts[0]?.day || 5, amount: salaryParts[0]?.amount || '' },
                                                    { day: salaryParts[1]?.day || 20, amount: salaryParts[1]?.amount || '' },
                                                ]);
                                            } else {
                                                if (salaryParts.length < 2) {
                                                    setSalaryParts([...salaryParts, { day: 20, amount: '' }]);
                                                }
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: salaryType === opt.value ? '2px solid var(--primary)' : '1px solid var(--border)',
                                            background: salaryType === opt.value ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-card)',
                                            color: salaryType === opt.value ? 'var(--primary)' : 'var(--text-secondary)',
                                            fontWeight: salaryType === opt.value ? '600' : '400',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <opt.Icon size={20} />
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                {salaryType === 'full' && 'Você recebe tudo de uma vez em um dia do mês.'}
                                {salaryType === 'biweekly' && 'Você recebe em duas partes, geralmente no dia 5 e 20.'}
                                {salaryType === 'custom' && 'Configure livremente quantas parcelas recebe e em quais dias.'}
                            </p>

                            {/* Full: single input */}
                            {salaryType === 'full' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>Dia</label>
                                        <input
                                            type="number" min="1" max="31"
                                            className="input" inputMode="numeric"
                                            value={salaryParts[0]?.day || ''}
                                            onChange={e => setSalaryParts([{ ...salaryParts[0], day: e.target.value }])}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Valor (R$)</label>
                                        <input
                                            type="text" className="input" inputMode="decimal"
                                            placeholder="0,00"
                                            value={salary}
                                            onChange={e => setSalary(e.target.value.replace(/[^0-9.,]/g, ''))}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Biweekly / Custom: multiple parts */}
                            {(salaryType === 'biweekly' || salaryType === 'custom') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {salaryParts.map((part, i) => (
                                        <div key={i} style={{
                                            display: 'grid',
                                            gridTemplateColumns: salaryType === 'custom' ? '90px 1fr 40px' : '90px 1fr',
                                            gap: '12px',
                                            alignItems: 'end',
                                        }}>
                                            <div>
                                                <label style={labelStyle}>
                                                    {salaryType === 'biweekly'
                                                        ? (i === 0 ? '1ª parcela' : '2ª parcela')
                                                        : `${i + 1}ª parcela`
                                                    }
                                                </label>
                                                <input
                                                    type="number" min="1" max="31"
                                                    className="input" inputMode="numeric" placeholder="Dia"
                                                    value={part.day}
                                                    onChange={e => {
                                                        const updated = [...salaryParts];
                                                        updated[i] = { ...updated[i], day: e.target.value };
                                                        setSalaryParts(updated);
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Valor (R$)</label>
                                                <input
                                                    type="text" className="input" inputMode="decimal"
                                                    placeholder="0,00"
                                                    value={part.amount}
                                                    onChange={e => {
                                                        const updated = [...salaryParts];
                                                        updated[i] = { ...updated[i], amount: e.target.value.replace(/[^0-9.,]/g, '') };
                                                        setSalaryParts(updated);
                                                    }}
                                                />
                                            </div>
                                            {salaryType === 'custom' && salaryParts.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSalaryParts(salaryParts.filter((_, idx) => idx !== i))}
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.08)',
                                                        border: '1px solid rgba(239, 68, 68, 0.15)',
                                                        borderRadius: '10px',
                                                        padding: '0',
                                                        color: 'var(--danger)',
                                                        cursor: 'pointer',
                                                        height: '44px',
                                                        width: '40px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {salaryType === 'custom' && (
                                        <button
                                            type="button"
                                            onClick={() => setSalaryParts([...salaryParts, { day: '', amount: '' }])}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: '10px',
                                                border: '1px dashed var(--border)',
                                                background: 'transparent',
                                                color: 'var(--primary)',
                                                fontSize: '0.85rem',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            + Adicionar parcela
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Total display */}
                            <div style={{
                                padding: '14px 16px',
                                borderRadius: '12px',
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                    Total mensal
                                </span>
                                <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--success)' }}>
                                    R$ {getSalaryTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            {salaryError && <span style={errorStyle}>{salaryError}</span>}
                        </div>
                    )}

                    {/* === STEP 2: Ciclo Financeiro === */}
                    {currentStep === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px' }}>
                                Início do mês financeiro
                            </h3>

                            <div style={{
                                padding: '16px',
                                borderRadius: '12px',
                                background: 'rgba(99, 102, 241, 0.06)',
                                border: '1px solid rgba(99, 102, 241, 0.15)',
                                lineHeight: '1.6',
                            }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>
                                    Esse dia define seu <strong>ciclo financeiro</strong>. É com base nele que calculamos
                                    quanto sobrou, divisões e metas.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="financial-start-day" style={labelStyle}>Dia de Início (1-31) *</label>
                                <input
                                    id="financial-start-day"
                                    type="number" min="1" max="31"
                                    className="input" inputMode="numeric"
                                    value={financialStartDay}
                                    onChange={e => {
                                        setFinancialStartDay(e.target.value);
                                        setCycleError('');
                                    }}
                                    placeholder="Ex: 1"
                                    style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: '700' }}
                                />
                                {cycleError && <span style={errorStyle}>{cycleError}</span>}
                            </div>

                            {/* Dynamic preview */}
                            {getPreviewText() && (
                                <div style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'rgba(16, 185, 129, 0.08)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    textAlign: 'center',
                                }}>
                                    <Calendar size={20} color="#10B981" style={{ marginBottom: '8px' }} />
                                    <p style={{
                                        fontSize: '0.95rem',
                                        fontWeight: '600',
                                        color: 'var(--text-primary)',
                                        margin: 0,
                                    }}>
                                        {getPreviewText()}
                                    </p>
                                </div>
                            )}

                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                Receitas e despesas (exceto cartão) a partir deste dia serão contabilizadas no mês seguinte.
                                Você pode alterar isso depois em Configurações.
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    {currentStep > 0 && (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            disabled={isLoading}
                            style={{
                                padding: '16px 20px',
                                borderRadius: '14px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-secondary)',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.5 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <ChevronLeft size={18} />
                            Voltar
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            if (currentStep === 0) handleCardNext();
                            else if (currentStep === 1) handleSalaryNext();
                            else handleFinish();
                        }}
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            padding: '16px',
                            borderRadius: '14px',
                            border: 'none',
                            background: STEPS[currentStep].color,
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '1rem',
                            cursor: isLoading ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        {isLoading ? 'Salvando...' : (
                            currentStep === 2 ? (
                                <>
                                    <Check size={20} />
                                    Concluir
                                </>
                            ) : (
                                <>
                                    Próximo
                                    <ChevronRight size={20} />
                                </>
                            )
                        )}
                    </button>
                </div>

                {/* Step indicator dots */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '24px',
                }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{
                            width: i === currentStep ? '24px' : '8px',
                            height: '8px',
                            borderRadius: '4px',
                            background: i === currentStep ? STEPS[i].color : 'var(--border)',
                            transition: 'all 0.3s',
                        }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
};

const errorStyle = {
    color: '#FF3B30',
    fontSize: '0.75rem',
    marginTop: '4px',
    display: 'block',
    fontWeight: '500',
};
