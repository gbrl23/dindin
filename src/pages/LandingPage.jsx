import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, CheckCircle, Smartphone, Shield, Users, CreditCard } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        document.title = "DinDin - Domine suas finanças com elegância";
        return () => { document.title = "DinDin Expense Tracker"; };
    }, []);

    const handleCta = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/signup');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#1D1D1F', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

            {/* Navbar */}
            <style>{`
                .features-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 32px;
                }
                @media (min-width: 768px) {
                    .features-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                .how-it-works-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 40px;
                }
                @media (min-width: 900px) {
                    .how-it-works-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
            `}</style>
            <nav style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(90deg, #5100FF, #FF2D55)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    DinDin
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', color: '#86868B', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                        Entrar
                    </button>
                    <button onClick={() => navigate('/signup')} style={{ background: '#1D1D1F', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '24px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', transition: 'transform 0.1s' }}>
                        Começar
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 20px 120px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

                {/* Badge */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.03)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    padding: '8px 16px',
                    borderRadius: '24px',
                    color: '#1D1D1F',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    marginBottom: '32px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backdropFilter: 'blur(10px)'
                }}>
                    ✨ Simplifique sua vida financeira
                </div>

                <h1 style={{
                    fontSize: 'clamp(3rem, 5vw, 4.5rem)',
                    fontWeight: '800',
                    lineHeight: '1.1',
                    marginBottom: '24px',
                    letterSpacing: '-1px',
                    maxWidth: '800px'
                }}>
                    Domine suas finanças com <span style={{ color: '#5100FF' }}>elegância.</span>
                </h1>

                <p style={{
                    fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
                    color: '#86868B',
                    maxWidth: '600px',
                    marginBottom: '40px',
                    lineHeight: '1.6'
                }}>
                    O gerenciador financeiro que simplifica o controle do seu dinheiro. Divida despesas, controle cartões e visualize seu futuro. Diga adeus às planilhas feias.
                </p>

                <div style={{ display: 'flex', gap: '16px', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        onClick={handleCta}
                        style={{
                            background: '#5100FF',
                            color: '#fff',
                            border: 'none',
                            padding: '16px 32px',
                            borderRadius: '32px',
                            fontWeight: '700',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 8px 24px rgba(81, 0, 255, 0.4)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {user ? 'Ir para Dashboard' : 'Começar Gratuitamente'} <ArrowRight size={20} />
                    </button>
                </div>

                {/* Hero Image / Placeholder for 3D Tilt */}
                <div style={{
                    marginTop: '80px',
                    width: '100%',
                    maxWidth: '1000px',
                    aspectRatio: '16/9',
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    border: '1px solid #E5E5E5',
                    boxShadow: '0 40px 100px -20px rgba(81, 0, 255, 0.15)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#F5F5F7' }}>
                        {/* Fake Window Bar */}
                        <div style={{ height: '32px', borderBottom: '1px solid #E5E5E5', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px', background: '#FFFFFF' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }}></div>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }}></div>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }}></div>
                        </div>
                        {/* Fake UI */}
                        <div style={{ flex: 1, padding: '24px', display: 'flex', gap: '24px', overflow: 'hidden' }}>
                            {/* Sidebar Mock */}
                            <div style={{ width: '200px', background: '#FFFFFF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', border: '1px solid #E5E5E5' }}>
                                <div style={{ height: '32px', background: '#E5E5EA', borderRadius: '8px', width: '100%' }}></div>
                                <div style={{ height: '12px', width: '60%', background: '#F0F0F2', borderRadius: '4px', marginTop: '12px' }}></div>
                                <div style={{ height: '24px', width: '100%', background: '#F5F5F7', borderRadius: '6px' }}></div>
                                <div style={{ height: '24px', width: '100%', background: '#FFFFFF', borderRadius: '6px' }}></div>
                                <div style={{ height: '24px', width: '100%', background: '#FFFFFF', borderRadius: '6px' }}></div>

                                <div style={{ height: '12px', width: '60%', background: '#F0F0F2', borderRadius: '4px', marginTop: '12px' }}></div>
                                <div style={{ height: '24px', width: '100%', background: '#FFFFFF', borderRadius: '6px' }}></div>
                            </div>
                            {/* Main Area */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', gap: '24px' }}>
                                    {[1, 2, 3].map(i => (
                                        <div key={i} style={{ flex: 1, height: '100px', background: '#FFFFFF', borderRadius: '20px', padding: '16px', border: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ width: '32px', height: '32px', background: i === 1 ? '#E8EAFD' : (i === 2 ? '#FFE8EC' : '#E8FCEF'), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ width: 12, height: 12, background: i === 1 ? '#5100FF' : (i === 2 ? '#FF2D55' : '#34C759'), borderRadius: '50%' }}></div>
                                                </div>
                                            </div>
                                            <div style={{ width: '80%', height: '16px', background: '#D1D1D6', borderRadius: '4px' }}></div>
                                            <div style={{ width: '40%', height: '12px', background: '#E5E5EA', borderRadius: '4px' }}></div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ flex: 1, background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E5E5E5', position: 'relative', overflow: 'hidden', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                        <div style={{ width: '40%', height: '24px', background: '#D1D1D6', borderRadius: '6px' }}></div>
                                        <div style={{ width: '20%', height: '24px', background: '#F5F5F7', borderRadius: '6px' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '16px', paddingBottom: '0' }}>
                                        {[40, 65, 45, 80, 55, 90, 70, 85].map((h, k) => (
                                            <div key={k} style={{
                                                flex: 1,
                                                height: `${h}%`,
                                                background: k === 5 ? '#5100FF' : '#E5E5EA',
                                                borderRadius: '8px 8px 0 0',
                                                opacity: k === 5 ? 1 : 0.8
                                            }}></div>
                                        ))}
                                    </div>
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: '#E5E5E5' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Proof */}
                <div style={{ marginTop: '60px', color: '#86868B', fontSize: '0.9rem', display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> +1.000 Usuários</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={16} /> 100% Seguro</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} /> Grátis para começar</div>
                </div>

            </main>

            {/* Features Section */}
            <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', textAlign: 'center', marginBottom: '60px' }}>
                    Tudo o que você precisa. <br /><span style={{ color: '#86868B', fontSize: '1.5rem', fontWeight: '500' }}>E nada do que atrapalha.</span>
                </h2>

                <div className="features-grid">
                    {[
                        { icon: <CreditCard size={32} color="#5100FF" />, title: "Gestão de Cartões", desc: "Acompanhe faturas, limites e dias de fechamento de todos os seus cartões em um só lugar." },
                        { icon: <Users size={32} color="#FF2D55" />, title: "Divisão de Contas", desc: "Crie grupos para dividir o aluguel, viagens ou streamings. O fim das planilhas de rateio." },
                        { icon: <Smartphone size={32} color="#34C759" />, title: "Design Premium", desc: "Modo escuro nativo, animações fluidas e uma interface que você vai ter prazer de usar." },
                        { icon: <CheckCircle size={32} color="#FF9500" />, title: "Controle Total", desc: "Metas de gastos, orçamentos mensais e relatórios detalhados para você dominar seu dinheiro." }
                    ].map((feature, i) => (
                        <div key={i} style={{
                            background: 'rgba(245,245,247,0.5)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            borderRadius: '24px',
                            padding: '32px',
                            transition: 'transform 0.2s',
                            cursor: 'default'
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ marginBottom: '20px', background: '#fff', width: 60, height: 60, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                {feature.icon}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px' }}>{feature.title}</h3>
                            <p style={{ color: '#86868B', lineHeight: '1.5' }}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it Works Section */}
            <section style={{ padding: '100px 20px', background: '#F5F5F7', width: '100%' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', textAlign: 'center', marginBottom: '80px' }}>
                        Simples é melhor.
                    </h2>

                    <div className="how-it-works-grid">
                        {[
                            { step: '01', title: 'Cadastre suas despesas', text: 'Importe suas faturas ou registre gastos manualmente. O DinDin organiza tudo por data de vencimento.' },
                            { step: '02', title: 'Convide parceiros', text: 'Adicione amigos ou familiares. Cada um vê o que precisa, e o saldo é calculado automaticamente.' },
                            { step: '03', title: 'Acompanhe a evolução', text: 'Gráficos claros mostram para onde seu dinheiro vai. Sem sustos no fim do mês.' }
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                                <div style={{
                                    width: 48, height: 48,
                                    background: 'linear-gradient(135deg, #5100FF 0%, #FF2D55 100%)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: '800', fontSize: '1.25rem',
                                    marginBottom: '24px',
                                    boxShadow: '0 8px 16px rgba(81, 0, 255, 0.2)'
                                }}>
                                    {i + 1}
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px', color: '#1D1D1F' }}>{item.title}</h3>
                                <p style={{ color: '#86868B', lineHeight: '1.6', fontSize: '1rem' }}>{item.text}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '80px' }}>
                        <button
                            onClick={handleCta}
                            style={{
                                background: '#1D1D1F',
                                color: '#fff',
                                border: 'none',
                                padding: '16px 40px',
                                borderRadius: '32px',
                                fontWeight: '700',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                            }}
                        >
                            Começar Agora
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid #E5E5E5', padding: '60px 20px', textAlign: 'center', color: '#86868B', fontSize: '0.9rem', background: '#FFF' }}>
                <div style={{ marginBottom: '24px', fontSize: '1.25rem', fontWeight: '800', color: '#1D1D1F', background: 'linear-gradient(90deg, #5100FF, #FF2D55)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>DinDin</div>
                <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
                    <span style={{ cursor: 'pointer' }}>Sobre</span>
                    <span style={{ cursor: 'pointer' }}>Privacidade</span>
                    <span style={{ cursor: 'pointer' }}>Termos</span>
                    <span style={{ cursor: 'pointer' }}>Contato</span>
                </div>
                <p>© {new Date().getFullYear()} Expense Tracker. Feito com ❤️ e ☕️.</p>
            </footer>

        </div>
    );
}
