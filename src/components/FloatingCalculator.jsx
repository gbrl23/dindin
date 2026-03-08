import React, { useState, useEffect, useRef } from 'react';
import Calculator from './Calculator';
import { Calculator as CalcIcon } from 'lucide-react';
import { hapticFeedback } from '../utils/haptic';

export default function FloatingCalculator() {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (
                panelRef.current && !panelRef.current.contains(e.target) &&
                buttonRef.current && !buttonRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleUseValue = (formattedValue) => {
        window.dispatchEvent(new CustomEvent('calculator:use-value', {
            detail: { value: formattedValue }
        }));
        setIsOpen(false);
    };

    return (
        <>
            {/* FAB Button */}
            <button
                ref={buttonRef}
                onClick={() => {
                    hapticFeedback('medium');
                    setIsOpen(!isOpen);
                }}
                style={{
                    position: 'fixed',
                    bottom: '32px',
                    right: '32px',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: isOpen
                        ? 'rgba(28, 28, 30, 0.9)'
                        : 'linear-gradient(135deg, rgba(28, 28, 30, 0.85), rgba(44, 44, 46, 0.85))',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: isOpen
                        ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 2px var(--primary)'
                        : '0 8px 32px rgba(0, 0, 0, 0.3)',
                    color: isOpen ? 'var(--primary)' : 'rgba(255, 255, 255, 0.85)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isOpen ? 'scale(1.05) rotate(15deg)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                    if (!isOpen) e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Calculadora"
                aria-label="Abrir calculadora"
            >
                <CalcIcon size={22} />
            </button>

            {/* Calculator Panel */}
            {isOpen && (
                <div
                    ref={panelRef}
                    style={{
                        position: 'fixed',
                        bottom: '96px',
                        right: '24px',
                        zIndex: 1001,
                        animation: 'calcSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                    }}
                >
                    <Calculator
                        onUseValue={handleUseValue}
                        onClose={() => setIsOpen(false)}
                    />
                </div>
            )}

            <style>{`
                @keyframes calcSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(15px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </>
    );
}
