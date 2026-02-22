
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ArrowRight } from 'lucide-react';

export default function LoginView() {
    const { signIn, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(() => {
        return localStorage.getItem('dindin_remember_me') !== 'false';
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            localStorage.setItem('dindin_remember_me', rememberMe ? 'true' : 'false');
            const { error } = await signIn(email, password);
            if (error) throw error;
            navigate('/dashboard');
        } catch (err) {
            setError('Falha ao fazer login. Verifique suas credenciais.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            const { error } = await signInWithGoogle();
            if (error) throw error;
        } catch (err) {
            setError('Falha ao autenticar com o Google.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-secondary)', // Better background context
            padding: '20px'
        }}>
            <div className="card animate-scale-in" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '48px 40px',
                background: 'var(--bg-card)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                border: '1px solid var(--border)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: 64, height: 64, margin: '0 auto 24px auto',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
                        borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 10px 20px rgba(81, 0, 255, 0.2)'
                    }}>
                        <LogIn size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Bem-vindo</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Entre para gerenciar seu Dindin</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        padding: '16px',
                        borderRadius: '16px',
                        marginBottom: '24px',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        fontWeight: '500'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        fontSize: '1rem',
                        borderRadius: '16px',
                        fontWeight: '600',
                        background: 'white',
                        color: '#374151',
                        border: '1px solid #D1D5DB',
                        marginBottom: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                >
                    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Continuar com o Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
                    <div style={{ flex: 1, borderTop: '1px solid var(--border)' }}></div>
                    <span style={{ margin: '0 16px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>ou entre com email</span>
                    <div style={{ flex: 1, borderTop: '1px solid var(--border)' }}></div>
                </div>

                <form id="login-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label htmlFor="email" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', paddingLeft: '4px' }}>Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="username"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="seu@email.com"
                            style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-secondary)', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', paddingLeft: '4px' }}>Senha</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-secondary)', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>

                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        userSelect: 'none',
                    }}>
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        Permanecer conectado
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{
                            marginTop: '4px',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '1rem',
                            borderRadius: '16px',
                            fontWeight: '700'
                        }}
                    >
                        {loading ? 'Entrando...' : (
                            <>
                                Entrar <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    Não tem uma conta? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Crie agora</Link>
                </div>
            </div>
        </div>
    );
}
