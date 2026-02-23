import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
    CheckCircle2,
    XCircle,
    CreditCard,
    PieChart,
    Users,
    Smartphone,
    ArrowRight,
    ChevronDown,
    Wallet,
    TrendingUp,
    TrendingDown,
    Receipt,
    Coins,
    AlertCircle
} from 'lucide-react';

const FadeIn = ({ children, delay = 0, className = "", viewport = true }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        {...(viewport ? { whileInView: { opacity: 1, y: 0 } } : { animate: { opacity: 1, y: 0 } })}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        className={className}
    >
        {children}
    </motion.div>
);

const Navbar = ({ onLoginClick, onRegisterClick }) => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-warm/80 backdrop-blur-md border-b border-black/5" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand-purple">
                <Coins size={32} />
                <span className="font-display font-bold text-xl tracking-tight text-brand-deep">Dindin</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                <a href="#recursos" className="hover:text-brand-purple transition-colors">Recursos</a>
                <a href="#comparacao" className="hover:text-brand-purple transition-colors">Comparação</a>
                <a href="#precos" className="hover:text-brand-purple transition-colors">Preços</a>
                <a href="#faq" className="hover:text-brand-purple transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <button
                    onClick={onLoginClick}
                    className="text-gray-600 hover:text-brand-purple font-medium text-sm transition-colors"
                >
                    Entrar
                </button>
                <button
                    onClick={onRegisterClick}
                    className="bg-brand-purple hover:bg-brand-deep text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium text-xs sm:text-sm transition-colors shadow-sm"
                >
                    Começar grátis
                </button>
            </div>
        </div>
    </nav>
);

const DashboardMockup = () => (
    <div className="relative w-full max-w-lg mx-auto aspect-square md:aspect-[4/3]">
        {/* Decorative Blobs */}
        <div className="absolute inset-0 bg-brand-lavender blob-shape opacity-50 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-4 bg-brand-purple/10 blob-shape-2 opacity-60 animate-[spin_15s_linear_infinite_reverse]" />

        {/* Main Dashboard Card */}
        <div className="absolute inset-8 bg-white rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(81,0,255,0.15)] border border-black/5 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-black/5 flex items-center justify-between bg-gray-50/50">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Saldo Disponível</p>
                    <h3 className="text-3xl font-display font-bold text-brand-deep">R$ 4.250,00</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-brand-lavender flex items-center justify-center text-brand-purple">
                    <Wallet size={24} />
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="flex gap-4">
                    <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-black/5">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <TrendingUp size={16} className="text-emerald-500" />
                            <span className="text-xs font-medium">Receitas</span>
                        </div>
                        <p className="font-display font-bold text-lg">R$ 8.500</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-black/5">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <Receipt size={16} className="text-red-500" />
                            <span className="text-xs font-medium">Despesas</span>
                        </div>
                        <p className="font-display font-bold text-lg">R$ 4.250</p>
                    </div>
                </div>

                {/* Fake Chart */}
                <div className="flex-1 bg-gray-50 rounded-2xl border border-black/5 p-4 flex items-end gap-2">
                    {[40, 70, 45, 90, 65, 85, 50].map((h, i) => (
                        <div key={i} className="flex-1 bg-brand-lavender rounded-t-md relative group">
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-brand-purple rounded-t-md transition-all duration-500"
                                style={{ height: `${h}%` }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Floating Elements - hidden on small screens to prevent overflow */}
        <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="hidden sm:flex absolute -right-4 top-20 bg-white p-4 rounded-2xl shadow-lg border border-black/5 items-center gap-3"
        >
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <CreditCard size={20} />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium">Fatura atual</p>
                <p className="font-display font-bold text-sm">R$ 1.240,50</p>
            </div>
        </motion.div>

        <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="hidden sm:flex absolute -left-8 bottom-24 bg-white p-4 rounded-2xl shadow-lg border border-black/5 items-center gap-3"
        >
            <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white" />
                <div className="w-8 h-8 rounded-full bg-brand-purple border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">+2</div>
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium">Divisão Viagem</p>
                <p className="font-display font-bold text-sm text-emerald-600">Você recebe R$ 450</p>
            </div>
        </motion.div>
    </div>
);

const Hero = ({ onRegisterClick }) => (
    <section className="pt-24 pb-16 md:pt-40 md:pb-32 px-4 sm:px-6 overflow-hidden relative">
        {/* Decorative background lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
                <FadeIn viewport={false}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-lavender text-brand-purple text-sm font-medium mb-6">
                        <span className="w-2 h-2 rounded-full bg-brand-purple animate-pulse" />
                        O fim das planilhas chegou
                    </div>
                </FadeIn>
                <FadeIn delay={0.1} viewport={false}>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-brand-deep leading-[1.1] tracking-tight mb-6 text-balance">
                        Pare de se perder no cartão e na divisão de gastos.
                    </h1>
                </FadeIn>
                <FadeIn delay={0.2} viewport={false}>
                    <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                        Você não precisa mais descobrir o problema só quando a fatura chega. E muito menos fazer conta manual para dividir despesas. O Dindin organiza seu dinheiro, seu cartão e suas divisões — tudo em um só lugar.
                    </p>
                </FadeIn>
                <FadeIn delay={0.3} viewport={false}>
                    <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                        <button
                            onClick={onRegisterClick}
                            className="bg-brand-purple hover:bg-brand-deep text-white px-8 py-4 rounded-full font-medium text-lg transition-colors shadow-lg shadow-brand-purple/20 flex items-center justify-center gap-2 group w-full sm:w-auto"
                        >
                            Começar teste grátis de 7 dias
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-sm text-gray-500 text-center lg:text-left sm:self-center">
                            Sem risco. Cancele quando quiser.
                        </p>
                    </div>
                </FadeIn>
            </div>

            <FadeIn delay={0.4} viewport={false} className="relative">
                <DashboardMockup />
            </FadeIn>
        </div>
    </section>
);

const FloatingElement = ({ children, delay = 0, yOffset = 20, duration = 3, className = "" }) => (
    <motion.div
        animate={{ y: [0, yOffset, 0] }}
        transition={{
            duration: duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay
        }}
        className={className}
    >
        {children}
    </motion.div>
);

const PainPoints = () => (
    <section className="py-20 md:py-32 relative overflow-hidden">
        {/* Abstract gradients overlapping */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-brand-purple)_0%,transparent_30%)] opacity-5 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--color-brand-purple)_0%,transparent_40%)] opacity-5 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
            <FadeIn>
                <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full bg-brand-lavender text-brand-purple font-bold text-sm tracking-wide uppercase border border-brand-purple/20">
                    O Verdadeiro Problema
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-7xl font-display font-black text-brand-deep mb-16 leading-[1.1] tracking-tight text-balance">
                    Seu dinheiro não some.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-deep">Ele está desorganizado.</span>
                </h2>
            </FadeIn>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-20 text-left">
                {[
                    "“Eu nunca sei pra onde meu dinheiro vai.”",
                    "“A fatura sempre vem maior do que eu esperava.”",
                    "“Eu não sei quanto realmente posso gastar.”",
                    "“No fim do mês parece que o dinheiro some.”",
                    "“Planilha é um saco de atualizar toda semana.”",
                    "“A gente sempre erra a conta na divisão.”"
                ].map((quote, i) => (
                    <FadeIn key={i} delay={i * 0.1}>
                        <div className="bg-gray-50 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-purple/10 text-gray-700 font-medium h-full flex items-center justify-center text-center relative overflow-hidden group hover:border-brand-purple/30 transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute top-0 left-0 w-full h-1 bg-brand-lavender group-hover:bg-brand-purple transition-colors duration-300" />
                            <p className="relative z-10 italic text-base md:text-lg leading-relaxed text-gray-600">
                                {quote}
                            </p>
                        </div>
                    </FadeIn>
                ))}
            </div>

            <FadeIn delay={0.6}>
                <div className="bg-gray-50 p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-brand-purple/5 border border-brand-purple/10 max-w-3xl mx-auto relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-lavender rounded-full mix-blend-multiply filter blur-2xl opacity-50 translate-x-1/2 -translate-y-1/2" />
                    <p className="text-xl md:text-2xl text-gray-600 relative z-10 text-balance leading-relaxed">
                        Você não está sozinho.<br /><br />
                        <span className="text-2xl md:text-3xl font-display font-bold text-brand-deep block mb-3">O problema não é falta de esforço.</span>
                        É a falta de um sistema prático que funcione na vida real.
                    </p>
                </div>
            </FadeIn>
        </div>
    </section >
);

const Problem = () => (
    <section className="py-16 md:py-24 bg-brand-deep text-white relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -translate-x-1/2 translate-y-1/2" />

        <div className="max-w-4xl mx-auto px-6 relative z-10">
            <FadeIn>
                <h2 className="text-3xl md:text-5xl font-display font-bold mb-12 text-center text-white">
                    O caos da planilha<br />
                    <span className="text-brand-lavender opacity-80 text-2xl md:text-4xl">(e por que ela não funciona)</span>
                </h2>
            </FadeIn>

            <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[2rem] p-6 sm:p-8 md:p-12 backdrop-blur-sm">
                <FadeIn delay={0.1}>
                    <p className="text-xl mb-8 font-medium">No começo você cria uma planilha linda. Depois:</p>
                </FadeIn>

                <ul className="space-y-4 mb-12">
                    {[
                        "Esquece de atualizar.",
                        "A outra pessoa também esquece.",
                        "Um valor é digitado errado.",
                        "A soma não bate.",
                        "Ninguém sabe mais quem deve quanto."
                    ].map((item, i) => (
                        <FadeIn key={i} delay={0.2 + (i * 0.1)}>
                            <li className="flex items-center gap-3 text-lg text-brand-lavender">
                                <XCircle className="text-red-400 shrink-0" />
                                {item}
                            </li>
                        </FadeIn>
                    ))}
                </ul>

                <FadeIn delay={0.7}>
                    <div className="pt-8 border-t border-white/10">
                        <p className="text-xl mb-4">E quando envolve viagem ou gastos da casa? <span className="font-bold text-red-400">Vira um caos.</span></p>
                        <p className="text-brand-lavender/80 mb-6">WhatsApp, calculadora, planilha, anotações soltas.</p>
                        <p className="text-2xl font-display font-bold text-white">Muito esforço. Pouca clareza.</p>
                    </div>
                </FadeIn>
            </div>
        </div>
    </section>
);

const Comparison = () => (
    <section id="comparacao" className="py-16 md:py-24 bg-bg-soft">
        <div className="max-w-6xl mx-auto px-6">
            <FadeIn>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-deep text-center mb-16">
                    Planilha vs Dindin
                </h2>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Planilha Card */}
                <FadeIn delay={0.1}>
                    <div className="bg-white rounded-2xl md:rounded-[2rem] p-6 sm:p-8 md:p-10 border border-black/5 shadow-sm h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                <XCircle size={24} />
                            </div>
                            <h3 className="text-2xl font-display font-bold text-gray-900">Planilha</h3>
                        </div>
                        <ul className="space-y-5 flex-1">
                            {[
                                "Atualização manual",
                                "Erro fácil de digitação",
                                "Não entende ciclo do cartão",
                                "Não calcula divisão automaticamente",
                                "Precisa revisar tudo no fim do mês",
                                "Difícil de usar no celular"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-gray-600">
                                    <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </FadeIn>

                {/* Dindin Card */}
                <FadeIn delay={0.2}>
                    <div className="bg-brand-purple rounded-2xl md:rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-xl shadow-brand-purple/20 text-white h-full relative overflow-hidden flex flex-col">
                        {/* Decorative blob */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-2xl translate-x-1/3 -translate-y-1/3" />

                        <div className="relative z-10 flex-1 flex flex-col">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                                    <CheckCircle2 size={24} />
                                </div>
                                <h3 className="text-2xl font-display font-bold text-white">Dindin</h3>
                            </div>
                            <ul className="space-y-5 mb-10 flex-1">
                                {[
                                    "Registro em segundos",
                                    "Cálculo automático de quem deve quanto",
                                    "Controle real do ciclo do cartão",
                                    "Visão clara do que vai sobrar",
                                    "Orçamentos com alerta de limite",
                                    "Funciona perfeitamente no celular"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-brand-lavender">
                                        <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-6 border-t border-white/20 mt-auto">
                                <p className="font-display font-bold text-lg">
                                    Você não trabalha para organizar o dinheiro.<br />
                                    O app trabalha para você.
                                </p>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    </section>
);

const Feature = ({
    title,
    description,
    icon: Icon,
    items,
    reversed = false,
    imageContent
}) => (
    <div className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-20 items-center py-20`}>
        <div className="flex-1 w-full">
            <FadeIn>
                <div className="w-14 h-14 rounded-2xl bg-brand-lavender flex items-center justify-center text-brand-purple mb-6">
                    <Icon size={28} />
                </div>
                <h3 className="text-3xl md:text-4xl font-display font-bold text-brand-deep mb-6 text-balance">
                    {title}
                </h3>
                <div className="text-lg text-gray-600 mb-8 space-y-4">
                    {description}
                </div>
                {items && (
                    <ul className="space-y-3">
                        {items.map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                                {item}
                            </li>
                        ))}
                    </ul>
                )}
            </FadeIn>
        </div>
        <div className="flex-1 w-full">
            <FadeIn delay={0.2}>
                <div className="relative aspect-square md:aspect-[4/3] bg-bg-soft rounded-2xl md:rounded-[2.5rem] border border-black/5 overflow-hidden flex items-center justify-center p-4 sm:p-8">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(var(--color-brand-purple) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                    <div className="relative z-10 w-full">
                        {imageContent}
                    </div>
                </div>
            </FadeIn>
        </div>
    </div>
);

const FeaturesList = () => (
    <section id="recursos" className="py-16 md:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
            <Feature
                title="Divisão de gastos sem dor de cabeça"
                icon={Users}
                description={
                    <>
                        <p>Crie grupos para diferentes ocasiões e adicione participantes. Até quem não tem conta pode participar.</p>
                        <p>O Dindin calcula automaticamente:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2 font-medium text-brand-deep">
                            <li>Quem pagou mais</li>
                            <li>Quem deve</li>
                            <li>Quem já acertou</li>
                        </ul>
                        <p className="mt-4 font-bold text-brand-purple">Sem conta manual. Sem planilha. Sem discussão.</p>
                    </>
                }
                items={["Casa", "Viagem", "Amigos", "Faculdade", "Eventos"]}
                imageContent={
                    <div className="bg-white rounded-2xl shadow-xl border border-black/5 p-6 max-w-sm mx-auto">
                        <h4 className="font-display font-bold text-lg mb-4">Viagem Praia 🏖️</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-purple text-white flex items-center justify-center font-bold">V</div>
                                    <div>
                                        <p className="font-medium text-sm">Você</p>
                                        <p className="text-xs text-emerald-600 font-medium">A receber</p>
                                    </div>
                                </div>
                                <p className="font-bold text-emerald-600">R$ 450,00</p>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold">M</div>
                                    <div>
                                        <p className="font-medium text-sm">Marcos</p>
                                        <p className="text-xs text-red-500 font-medium">Deve</p>
                                    </div>
                                </div>
                                <p className="font-bold text-red-500">R$ 200,00</p>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold">J</div>
                                    <div>
                                        <p className="font-medium text-sm">Julia</p>
                                        <p className="text-xs text-red-500 font-medium">Deve</p>
                                    </div>
                                </div>
                                <p className="font-bold text-red-500">R$ 250,00</p>
                            </div>
                        </div>
                        <button className="w-full mt-4 bg-brand-lavender text-brand-purple font-medium py-2 rounded-xl text-sm">
                            Enviar cobranças
                        </button>
                    </div>
                }
            />

            <Feature
                title="Controle real do cartão de crédito"
                icon={CreditCard}
                reversed
                description={
                    <>
                        <p className="font-display font-bold text-xl text-brand-deep mb-4">O cartão não é extensão do salário.</p>
                        <p>O Dindin organiza suas compras pelo dia de fechamento. Mostra quanto já está comprometido e quanto ainda cabe no mês.</p>
                        <p>Assim você não toma susto quando a fatura fecha.</p>
                        <p className="italic mt-4">"Sempre vem maior do que eu esperava" deixa de existir.</p>
                    </>
                }
                imageContent={
                    <div className="bg-white rounded-2xl shadow-xl border border-black/5 p-6 max-w-sm mx-auto">
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 font-medium mb-1">Fatura atual • Fecha em 5 dias</p>
                            <h4 className="font-display font-bold text-3xl text-brand-deep">R$ 2.450,80</h4>
                        </div>


                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Próximas faturas</p>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Novembro</span>
                                <span className="text-sm font-bold text-gray-900">R$ 850,00</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Dezembro</span>
                                <span className="text-sm font-bold text-gray-900">R$ 320,00</span>
                            </div>
                        </div>
                    </div>
                }
            />

            <Feature
                title="Visão completa do seu mês"
                icon={PieChart}
                description={
                    <>
                        <p>Em um só lugar você acompanha tudo o que importa para a sua saúde financeira.</p>
                        <p className="font-bold text-brand-deep mt-6 text-xl">Você para de reagir ao dinheiro. E começa a planejar.</p>
                    </>
                }
                items={[
                    "Saldo previsto",
                    "Receitas e despesas",
                    "Assinaturas e contas recorrentes",
                    "Orçamentos mensais",
                    "Relatórios exportáveis"
                ]}
                imageContent={
                    <div className="bg-white rounded-2xl shadow-xl border border-black/5 p-6 max-w-sm mx-auto w-full">
                        <h4 className="font-display font-bold text-lg mb-4">Orçamentos</h4>
                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between text-sm font-medium mb-2">
                                    <span className="text-gray-700">Mercado</span>
                                    <span className="text-gray-500">R$ 800 / R$ 1.000</span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[80%]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm font-medium mb-2">
                                    <span className="text-gray-700">Lazer</span>
                                    <span className="text-red-500">R$ 550 / R$ 500</span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 w-[100%]" />
                                </div>
                                <p className="text-xs text-red-500 mt-1 font-medium">Passou do limite</p>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm font-medium mb-2">
                                    <span className="text-gray-700">Transporte</span>
                                    <span className="text-gray-500">R$ 150 / R$ 400</span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-purple w-[37%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                }
            />
        </div>
    </section>
);

const BrazilReality = () => (
    <section className="py-16 md:py-24 bg-brand-deep text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
            <FadeIn>
                <Smartphone size={48} className="mx-auto mb-8 text-brand-purple" />
                <h2 className="text-3xl md:text-5xl font-display font-bold mb-8 text-white">
                    Feito para a realidade do Brasil
                </h2>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-sm sm:text-lg md:text-xl font-medium text-brand-lavender mb-12">
                    <span className="bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm">Cartões com dia de fechamento</span>
                    <span className="bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm">Parcelamentos</span>
                    <span className="bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm">Divisão entre pessoas</span>
                    <span className="bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm">Controle mensal</span>
                </div>
                <p className="text-2xl font-display font-bold text-white">Simples. Direto. Sem complicação.</p>
            </FadeIn>
        </div>
    </section>
);

const Pricing = ({ onRegisterClick }) => (
    <section id="precos" className="py-16 md:py-24 bg-bg-soft">
        <div className="max-w-5xl mx-auto px-6">
            <FadeIn>
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-brand-deep mb-4">
                        Quanto custa ter clareza?
                    </h2>
                    <p className="text-xl text-gray-600">Escolha o plano ideal para você.</p>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Monthly */}
                <FadeIn delay={0.1}>
                    <div className="bg-white rounded-2xl md:rounded-[2rem] p-6 sm:p-8 border border-black/5 shadow-sm h-full flex flex-col">
                        <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Mensal</h3>
                        <p className="text-gray-500 mb-6">Para quem quer flexibilidade.</p>
                        <div className="mb-8">
                            <span className="text-4xl sm:text-5xl font-display font-bold text-brand-deep">R$19,90</span>
                            <span className="text-gray-500">/mês</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-gray-700"><CheckCircle2 size={20} className="text-brand-purple" /> Acesso a todos os recursos</li>
                            <li className="flex items-center gap-3 text-gray-700"><CheckCircle2 size={20} className="text-brand-purple" /> Divisão de gastos ilimitada</li>
                            <li className="flex items-center gap-3 text-gray-700"><CheckCircle2 size={20} className="text-brand-purple" /> Suporte prioritário</li>
                        </ul>
                        <button
                            onClick={onRegisterClick}
                            className="w-full bg-brand-lavender hover:bg-brand-purple hover:text-white text-brand-purple font-bold py-4 rounded-xl transition-colors"
                        >
                            Começar teste grátis
                        </button>
                    </div>
                </FadeIn>

                {/* Annual */}
                <FadeIn delay={0.2}>
                    <div className="bg-brand-deep rounded-2xl md:rounded-[2rem] p-6 sm:p-8 shadow-xl text-white h-full flex flex-col relative border border-brand-purple/30 mt-4 md:mt-0">
                        <div className="absolute top-0 right-6 sm:right-8 transform -translate-y-1/2 bg-brand-purple text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 rounded-full">
                            MAIS POPULAR
                        </div>
                        <h3 className="text-2xl font-display font-bold text-white mb-2">Anual</h3>
                        <p className="text-brand-lavender/80 mb-6">Economia no longo prazo.</p>
                        <div className="mb-2">
                            <span className="text-4xl sm:text-5xl font-display font-bold">R$199</span>
                            <span className="text-brand-lavender/80">/ano</span>
                        </div>
                        <p className="text-emerald-400 text-sm font-medium mb-8">Equivale a R$ 16,58 por mês</p>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-brand-lavender"><CheckCircle2 size={20} className="text-brand-purple" /> Acesso a todos os recursos</li>
                            <li className="flex items-center gap-3 text-brand-lavender"><CheckCircle2 size={20} className="text-brand-purple" /> Divisão de gastos ilimitada</li>
                            <li className="flex items-center gap-3 text-brand-lavender"><CheckCircle2 size={20} className="text-brand-purple" /> Suporte prioritário</li>
                        </ul>
                        <button
                            onClick={onRegisterClick}
                            className="w-full bg-brand-purple hover:bg-brand-deep text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-brand-purple/20"
                        >
                            Começar teste grátis
                        </button>
                    </div>
                </FadeIn>
            </div>

            <FadeIn delay={0.4}>
                <div className="mt-16 text-center">
                    <p className="text-2xl font-display font-black text-gray-900 mb-2">Teste grátis por 7 dias.</p>
                    <p className="text-gray-600">Você usa tudo. Se não fizer sentido, cancela. Simples assim.</p>
                </div>
            </FadeIn>
        </div>
    </section>
);

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-black/5">
            <button
                className="w-full py-6 flex items-center justify-between text-left focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-lg font-display font-bold text-brand-deep">{question}</span>
                <ChevronDown
                    size={20}
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-gray-600 leading-relaxed">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FAQ = () => (
    <section id="faq" className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
            <FadeIn>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-deep text-center mb-12">
                    Perguntas Frequentes
                </h2>
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="border-t border-black/5">
                    <FAQItem
                        question="Preciso colocar cartão para testar?"
                        answer="Sim. O teste é gratuito por 7 dias. Só será cobrado se decidir continuar após esse período. Você pode cancelar a qualquer momento antes da cobrança."
                    />
                    <FAQItem
                        question="Posso dividir com alguém que não tem conta?"
                        answer="Sim. Você pode criar perfis virtuais para qualquer pessoa dentro do seu app e gerenciar a parte dela na divisão, sem que ela precise baixar o aplicativo."
                    />
                    <FAQItem
                        question="Funciona no celular?"
                        answer="Sim. O Dindin é mobile-first e funciona perfeitamente tanto no celular quanto no computador, com a mesma experiência fluida."
                    />
                </div>
            </FadeIn>
        </div>
    </section>
);

const Footer = () => (
    <footer className="bg-brand-deep text-brand-lavender/60 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-brand-lavender">
                <Coins size={32} />
                <span className="font-display font-bold text-xl tracking-tight text-white">Dindin</span>
            </div>
            <div className="text-sm">
                © {new Date().getFullYear()} Dindin. Todos os direitos reservados.
            </div>
            <div className="flex gap-6 text-sm">
                <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            </div>
        </div>
    </footer>
);

export default function LandingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        document.title = "DinDin - Pare de se perder no cartão e na divisão de gastos";
        return () => { document.title = "DinDin Expense Tracker"; };
    }, []);

    const handleLoginClick = () => {
        navigate('/login');
    };

    const handleRegisterClick = () => {
        navigate('/signup');
    };

    return (
        <div className="landing-page min-h-screen font-sans selection:bg-brand-purple/20 selection:text-brand-deep bg-bg-warm text-gray-900">
            <Navbar onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />
            <main>
                <Hero onRegisterClick={handleRegisterClick} />
                <PainPoints />
                <Problem />
                <Comparison />
                <FeaturesList />
                <BrazilReality />
                <Pricing onRegisterClick={handleRegisterClick} />
                <FAQ />
            </main>
            <Footer />
        </div>
    );
}
