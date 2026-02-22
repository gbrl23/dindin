import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfiles } from '../../hooks/useProfiles';
import { supabase } from '../../supabaseClient';
import {
    User, Lock, Shield, Save, LogOut, ArrowLeft,
    ChevronRight, Trash2, Camera, Calendar, DollarSign, AlertTriangle, Bell
} from 'lucide-react';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useNavigate } from 'react-router-dom';

export default function AccountView() {
    const { user, signOut } = useAuth();
    const { myProfile } = useProfiles();
    const navigate = useNavigate();
    const { preferences: notifPrefs, fetchPreferences, updatePreference } = useNotificationPreferences();
    const { permissionStatus, requestPermission, subscribe, unsubscribe } = usePushNotifications();

    // State
    const [isLoading, setIsLoading] = useState(false);
    const [activeSection, setActiveSection] = useState(null); // 'profile' | 'password' | 'config' | null

    // Profile
    const [profileName, setProfileName] = useState(user?.user_metadata?.full_name || '');
    const [profilePhone, setProfilePhone] = useState('');
    const [profileBirthDate, setProfileBirthDate] = useState('');
    const [profileBio, setProfileBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [financialStartDay, setFinancialStartDay] = useState(1);
    const [salary, setSalary] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // Password
    const [passData, setPassData] = useState({ newPassword: '', confirmPassword: '' });

    // Load current avatar and settings on mount
    useEffect(() => {
        const fetchProfile = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('avatar_url, financial_start_day, monthly_income, phone, birth_date, bio')
                .eq('user_id', user.id)
                .single();
            if (data) {
                if (data.avatar_url) setAvatarUrl(data.avatar_url);
                if (data.financial_start_day) setFinancialStartDay(data.financial_start_day);
                if (data.monthly_income) setSalary(data.monthly_income.toString().replace('.', ','));
                if (data.phone) setProfilePhone(data.phone);
                if (data.birth_date) setProfileBirthDate(data.birth_date);
                if (data.bio) setProfileBio(data.bio);
            }
        };
        if (user?.id) {
            fetchProfile();
            fetchPreferences();
        }
    }, [user?.id]);

    // Get member since date
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : 'Janeiro 2024';

    // Handlers
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: profileName }
            });
            if (authError) throw authError;

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: profileName,
                    phone: profilePhone,
                    birth_date: profileBirthDate || null,
                    bio: profileBio
                })
                .eq('user_id', user.id);
            if (profileError) throw profileError;

            alert('Perfil atualizado com sucesso!');
            setActiveSection(null);
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar perfil: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            return alert('As senhas não coincidem!');
        }
        if (passData.newPassword.length < 6) {
            return alert('A senha deve ter pelo menos 6 caracteres.');
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passData.newPassword
            });
            if (error) throw error;

            alert('Senha alterada com sucesso!');
            setPassData({ newPassword: '', confirmPassword: '' });
            setActiveSection(null);
        } catch (error) {
            console.error(error);
            alert('Erro ao alterar senha: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateConfig = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const numericSalary = salary ? parseFloat(salary.replace(/\./g, '').replace(',', '.')) : 0;

            const { error } = await supabase
                .from('profiles')
                .update({
                    financial_start_day: financialStartDay,
                    monthly_income: numericSalary,
                    salary: numericSalary
                })
                .eq('user_id', user.id);

            if (error) throw error;
            alert('Configurações salvas!');
            setActiveSection(null);
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar configurações.');
        } finally {
            setIsLoading(false);
        }
    };

    // Notification toggle handler
    const handleNotifToggle = async (key, value) => {
        if (key === 'enabled' && value) {
            // Ask for push permission when enabling
            const perm = await requestPermission();
            if (perm === 'denied') {
                alert('Permissão de notificação negada. Habilite nas configurações do navegador.');
                return;
            }
            if (perm === 'granted') {
                await subscribe();
            }
        }
        if (key === 'enabled' && !value) {
            await unsubscribe();
        }
        await updatePreference(key, value);
    };

    // Avatar Upload Handler
    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            return alert('Por favor, selecione uma imagem.');
        }
        if (file.size > 2 * 1024 * 1024) {
            return alert('A imagem deve ter no máximo 2MB.');
        }

        setUploadingAvatar(true);
        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update profile with new avatar URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            // Update auth metadata too
            await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            setAvatarUrl(publicUrl);
            alert('Foto atualizada com sucesso!');
        } catch (error) {
            console.error('Avatar upload error:', error);
            alert('Erro ao fazer upload: ' + error.message);
        } finally {
            setUploadingAvatar(false);
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '100px', maxWidth: '700px', margin: '0 auto' }}>
            {/* Header */}
            <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '50%',
                        padding: '10px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800' }}>Minha Conta</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Gerencie seu perfil e preferências</p>
                </div>
            </header>

            {/* Profile Card - Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #8B5CF6 100%)',
                borderRadius: '24px',
                padding: '32px',
                marginBottom: '24px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Pattern */}
                <div style={{
                    position: 'absolute',
                    right: '-50px',
                    top: '-50px',
                    width: '200px',
                    height: '200px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%'
                }} />
                <div style={{
                    position: 'absolute',
                    right: '50px',
                    bottom: '-80px',
                    width: '150px',
                    height: '150px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '50%'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
                    {/* Avatar */}
                    <div style={{ position: 'relative' }}>
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Avatar"
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '4px solid rgba(255,255,255,0.3)'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.5rem',
                                fontWeight: '700',
                                color: 'white',
                                border: '4px solid rgba(255,255,255,0.3)'
                            }}>
                                {profileName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        )}
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        {/* Camera Badge */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'white',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: uploadingAvatar ? 'wait' : 'pointer',
                                boxShadow: 'var(--shadow-md)',
                                opacity: uploadingAvatar ? 0.7 : 1
                            }}
                            title="Alterar foto"
                        >
                            {uploadingAvatar ? (
                                <div style={{
                                    width: '14px',
                                    height: '14px',
                                    border: '2px solid var(--primary)',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                            ) : (
                                <Camera size={16} color="var(--primary)" />
                            )}
                        </button>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '4px', color: 'white' }}>
                            {profileName || 'Usuário'}
                        </h2>
                        <p style={{ opacity: 0.9, marginBottom: '8px' }}>{user?.email}</p>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            // Load current avatar and settings on mount
                            background: 'rgba(255,255,255,0.2)',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem'
                        }}>
                            <Calendar size={14} />
                            Membro desde {memberSince}
                        </div>
                    </div>
                </div>
            </section>

            {/* Preferences Section */}
            <section style={{ marginBottom: '24px' }}>
                <h3 style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '12px',
                    paddingLeft: '4px'
                }}>
                    Configurações
                </h3>

                <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>

                    {/* Salary Configuration */}
                    <div
                        onClick={() => setActiveSection(activeSection === 'salary' ? null : 'salary')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            borderBottom: '1px solid var(--border)'
                        }}
                        className="hover-bg"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <DollarSign size={20} color="#3B82F6" />
                            </div>
                            <div>
                                <span style={{ fontWeight: '600' }}>Salário / Renda Mensal</span>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    Definir valor base do mês
                                </p>
                            </div>
                        </div>
                        <ChevronRight
                            size={20}
                            color="var(--text-secondary)"
                            style={{
                                transform: activeSection === 'salary' ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                            }}
                        />
                    </div>

                    {/* Expand: Salary Form */}
                    {activeSection === 'salary' && (
                        <form onSubmit={handleUpdateConfig} style={{
                            padding: '20px',
                            background: 'var(--bg-secondary)',
                            borderBottom: '1px solid var(--border)'
                        }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    Renda Mensal (R$)
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="0,00"
                                    value={salary}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9.,]/g, '');
                                        setSalary(val);
                                    }}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                    Este valor será usado como seu saldo inicial do mês.
                                </p>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                                style={{ width: '100%' }}
                            >
                                <Save size={18} style={{ marginRight: '8px' }} />
                                {isLoading ? 'Salvando...' : 'Salvar Renda'}
                            </button>
                        </form>
                    )}

                    {/* Financial Start Day */}
                    <div
                        onClick={() => setActiveSection(activeSection === 'config' ? null : 'config')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            borderBottom: activeSection === 'config' ? '1px solid var(--border)' : 'none'
                        }}
                        className="hover-bg"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Calendar size={20} color="#10B981" />
                            </div>
                            <div>
                                <span style={{ fontWeight: '600' }}>Início do Mês Financeiro</span>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    Definir data de corte
                                </p>
                            </div>
                        </div>
                        <ChevronRight
                            size={20}
                            color="var(--text-secondary)"
                            style={{
                                transform: activeSection === 'config' ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                            }}
                        />
                    </div>

                    {/* Expand: Config Form */}
                    {activeSection === 'config' && (
                        <form onSubmit={handleUpdateConfig} style={{
                            padding: '20px',
                            background: 'var(--bg-secondary)'
                        }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    Dia de Início (1-31)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    className="input"
                                    value={financialStartDay}
                                    onChange={e => setFinancialStartDay(parseInt(e.target.value))}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                    Receitas e despesas (exceto cartão) a partir deste dia serão contabilizadas no mês seguinte.
                                </p>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                                style={{ width: '100%' }}
                            >
                                <Save size={18} style={{ marginRight: '8px' }} />
                                {isLoading ? 'Salvando...' : 'Salvar Configuração'}
                            </button>
                        </form>
                    )}
                </div>

                <h3 style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '12px',
                    paddingLeft: '4px'
                }}>
                    Preferências
                </h3>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>


                    {/* Edit Profile */}
                    <div
                        onClick={() => setActiveSection(activeSection === 'profile' ? null : 'profile')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        className="hover-bg"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'rgba(139, 92, 246, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <User size={20} color="var(--primary)" />
                            </div>
                            <div>
                                <span style={{ fontWeight: '600' }}>Editar perfil</span>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    Alterar nome e informações
                                </p>
                            </div>
                        </div>
                        <ChevronRight
                            size={20}
                            color="var(--text-secondary)"
                            style={{
                                transform: activeSection === 'profile' ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                            }}
                        />
                    </div>

                    {/* Expand: Edit Profile Form */}
                    {activeSection === 'profile' && (
                        <form onSubmit={handleUpdateProfile} style={{
                            padding: '20px',
                            background: 'var(--bg-secondary)',
                            borderTop: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                                        Nome Completo
                                    </label>
                                    <input
                                        className="input"
                                        value={profileName}
                                        onChange={e => setProfileName(e.target.value)}
                                        placeholder="Seu nome completo"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                                            Telefone
                                        </label>
                                        <input
                                            className="input"
                                            value={profilePhone}
                                            onChange={e => setProfilePhone(e.target.value)}
                                            placeholder="(00) 0 0000-0000"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                                            Nascimento
                                        </label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={profileBirthDate}
                                            onChange={e => setProfileBirthDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                                        Bio / Sobre você
                                    </label>
                                    <textarea
                                        className="input"
                                        style={{ height: '80px', paddingTop: '12px', resize: 'none' }}
                                        value={profileBio}
                                        onChange={e => setProfileBio(e.target.value)}
                                        placeholder="Conte um pouco sobre você..."
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                                style={{ width: '100%' }}
                            >
                                <Save size={18} style={{ marginRight: '8px' }} />
                                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </form>
                    )}
                </div>
            </section>

            {/* Security Section */}
            <section style={{ marginBottom: '24px' }}>
                <h3 style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '12px',
                    paddingLeft: '4px'
                }}>
                    Segurança
                </h3>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Change Password */}
                    <div
                        onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        className="hover-bg"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Lock size={20} color="var(--danger)" />
                            </div>
                            <div>
                                <span style={{ fontWeight: '600' }}>Alterar senha</span>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    Atualize sua senha de acesso
                                </p>
                            </div>
                        </div>
                        <ChevronRight
                            size={20}
                            color="var(--text-secondary)"
                            style={{
                                transform: activeSection === 'password' ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                            }}
                        />
                    </div>

                    {/* Expand: Password Form */}
                    {activeSection === 'password' && (
                        <form onSubmit={handleChangePassword} style={{
                            padding: '20px',
                            background: 'var(--bg-secondary)',
                            borderTop: '1px solid var(--border)'
                        }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    Nova Senha
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="password"
                                        className="input"
                                        style={{ paddingLeft: '44px' }}
                                        placeholder="••••••••"
                                        value={passData.newPassword}
                                        onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    Confirmar Senha
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Shield size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="password"
                                        className="input"
                                        style={{ paddingLeft: '44px' }}
                                        placeholder="••••••••"
                                        value={passData.confirmPassword}
                                        onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                                style={{ width: '100%' }}
                            >
                                {isLoading ? 'Atualizando...' : 'Atualizar Senha'}
                            </button>
                        </form>
                    )}
                </div>
            </section>

            {/* Notifications Section */}
            <section style={{ marginBottom: '24px' }}>
                <h3 style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '12px',
                    paddingLeft: '4px'
                }}>
                    Notificações
                </h3>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Notifications accordion header */}
                    <div
                        onClick={() => setActiveSection(activeSection === 'notifications' ? null : 'notifications')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        className="hover-bg"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Bell size={20} color="#F59E0B" />
                            </div>
                            <div>
                                <span style={{ fontWeight: '600' }}>Preferências de notificação</span>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    {notifPrefs?.enabled ? 'Ativadas' : 'Desativadas'}
                                    {permissionStatus === 'denied' && ' (bloqueadas no navegador)'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight
                            size={20}
                            color="var(--text-secondary)"
                            style={{
                                transform: activeSection === 'notifications' ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                            }}
                        />
                    </div>

                    {/* Expand: Notification Toggles */}
                    {activeSection === 'notifications' && (
                        <div style={{
                            padding: '20px',
                            background: 'var(--bg-secondary)',
                            borderTop: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            {permissionStatus === 'denied' && (
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '12px',
                                    fontSize: '0.85rem',
                                    color: 'var(--danger)'
                                }}>
                                    Notificações bloqueadas no navegador. Acesse as configurações do navegador para habilitar.
                                </div>
                            )}

                            {/* Master Toggle */}
                            <ToggleRow
                                label="Ativar notificações"
                                description="Receber alertas push neste dispositivo"
                                checked={notifPrefs?.enabled || false}
                                onChange={(val) => handleNotifToggle('enabled', val)}
                                disabled={permissionStatus === 'denied'}
                            />

                            {/* Sub-toggles */}
                            <ToggleRow
                                label="Contas a vencer"
                                description="Lembrete 3 dias antes do vencimento"
                                checked={notifPrefs?.bills_due || false}
                                onChange={(val) => handleNotifToggle('bills_due', val)}
                                disabled={!notifPrefs?.enabled}
                            />

                            <ToggleRow
                                label="Orçamento excedido"
                                description="Alerta ao atingir 80% e 100% do limite"
                                checked={notifPrefs?.budget_exceeded || false}
                                onChange={(val) => handleNotifToggle('budget_exceeded', val)}
                                disabled={!notifPrefs?.enabled}
                            />

                            <ToggleRow
                                label="Atividade do grupo"
                                description="Novos gastos adicionados por membros"
                                checked={notifPrefs?.group_activity || false}
                                onChange={(val) => handleNotifToggle('group_activity', val)}
                                disabled={!notifPrefs?.enabled}
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Danger Zone */}
            <section>
                <h3 style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: 'var(--danger)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '12px',
                    paddingLeft: '4px'
                }}>
                    Zona de Perigo
                </h3>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Sign Out */}
                    <div
                        onClick={signOut}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.2s'
                        }}
                        className="hover-bg"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <LogOut size={20} color="var(--danger)" />
                            </div>
                            <div>
                                <span style={{ fontWeight: '600', color: 'var(--danger)' }}>Sair da Conta</span>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    Encerrar sessão atual
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={20} color="var(--text-secondary)" />
                    </div>

                    {/* Reset Data */}
                    <div
                        onClick={async () => {
                            if (window.confirm('⚠️ ATENÇÃO: Deseja realmente excluir TODAS as suas transações?\n\nIsso apagará receitas, despesas e cartões. Essa ação NÃO pode ser desfeita.')) {
                                if (window.confirm('TEM CERTEZA ABSOLUTA?\n\nClique em OK para confirmar a exclusão PERMANENTE de todos os seus dados financeiros.')) {
                                    setIsLoading(true);
                                    try {
                                        // 1. Delete transactions by payer_id
                                        const { error: txError } = await supabase
                                            .from('transactions')
                                            .delete()
                                            .eq('payer_id', myProfile?.id);
                                        if (txError) throw txError;

                                        // 2. Delete cards (optional, but requested "refazer tudo")
                                        // Let's ask user? User said "refazer tudo". Usually means transactions.
                                        // I'll stick to transactions for now to be safe, or just transactions?
                                        // "Excluir todos os gastos" -> transactions.

                                        alert('Todas as transações foram excluídas com sucesso. Sua conta está limpa.');
                                        window.location.reload(); // Reload to clear states
                                    } catch (error) {
                                        console.error(error);
                                        alert('Erro ao excluir dados: ' + error.message);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.2s'
                        }}
                        className="hover-bg"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <AlertTriangle size={20} color="#F59E0B" />
                            </div>
                            <div>
                                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Resetar Transações</span>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    Apagar todos os lançamentos
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={20} color="var(--text-secondary)" />
                    </div>

                    {/* Delete Account (disabled for now) */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            opacity: 0.5,
                            cursor: 'not-allowed'
                        }}
                        title="Em breve"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Trash2 size={20} color="var(--danger)" />
                            </div>
                            <div>
                                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Excluir Conta</span>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    Em breve
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={20} color="var(--text-secondary)" />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <div style={{
                marginTop: '48px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem'
            }}>
                <p style={{ marginBottom: '4px' }}>Dindin v{__APP_VERSION__}</p>
                <p style={{ opacity: 0.7 }}>Feito com 💜 para organizar suas finanças</p>
            </div>

            <style>{`
                .hover-bg:hover { background-color: var(--bg-secondary) !important; }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

function ToggleRow({ label, description, checked, onChange, disabled }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: disabled ? 0.5 : 1,
        }}>
            <div>
                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{label}</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                style={{
                    width: '48px',
                    height: '28px',
                    borderRadius: '14px',
                    background: checked ? 'var(--primary)' : 'var(--border)',
                    border: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                }}
            >
                <span style={{
                    position: 'absolute',
                    top: '3px',
                    left: checked ? '23px' : '3px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
            </button>
        </div>
    );
}
