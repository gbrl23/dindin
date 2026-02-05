
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowRight } from 'lucide-react';

export default function SignUpView() {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            const { error } = await signUp(email, password, fullName);
            if (error) throw error;
            navigate('/dashboard');
        } catch (err) {
            setError('Falha ao criar conta. ' + err.message);
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
            background: 'var(--bg-secondary)', // Consistent background
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
                        <UserPlus size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Criar Conta</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Comece a controlar seu Dindin hoje</p>
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', paddingLeft: '4px' }}>Nome Completo</label>
                        <input
                            type="text"
                            className="input"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            placeholder="Seu nome"
                            style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-secondary)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', paddingLeft: '4px' }}>Email</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="seu@email.com"
                            style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-secondary)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', paddingLeft: '4px' }}>Senha</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-secondary)' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{
                            marginTop: '16px',
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
                        {loading ? 'Criando...' : (
                            <>
                                Criar Conta <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    Já tem uma conta? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Entre aqui</Link>
                </div>
            </div>
        </div>
    );
}
