import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Delete, Calculator as CalcIcon, Check } from 'lucide-react';
import { hapticFeedback } from '../utils/haptic';

const CALC_BUTTONS = [
    ['C', '⌫', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['0', ',', '±', '=']
];

function formatDisplay(value) {
    if (value === '' || value === '0') return '0';
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    if (Number.isInteger(num) && !value.includes('.')) {
        return num.toLocaleString('pt-BR');
    }
    const parts = value.split('.');
    const intPart = parseInt(parts[0]).toLocaleString('pt-BR');
    const decPart = parts[1] !== undefined ? parts[1] : '';
    return decPart !== '' ? `${intPart},${decPart}` : intPart;
}

function formatResultForAmount(value) {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return '';
    return Math.abs(num).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export default function Calculator({ onUseValue, onClose, inline = false, accentColor = 'var(--primary)' }) {
    const [display, setDisplay] = useState('0');
    const [previousValue, setPreviousValue] = useState(null);
    const [operation, setOperation] = useState(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [history, setHistory] = useState('');
    const displayRef = useRef(null);

    const resetCalculator = useCallback(() => {
        setDisplay('0');
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(false);
        setHistory('');
    }, []);

    const calculate = useCallback((left, op, right) => {
        const l = parseFloat(left);
        const r = parseFloat(right);
        switch (op) {
            case '+': return l + r;
            case '−': return l - r;
            case '×': return l * r;
            case '÷': return r !== 0 ? l / r : 0;
            default: return r;
        }
    }, []);

    const handleNumber = useCallback((num) => {
        hapticFeedback('light');
        if (waitingForOperand) {
            setDisplay(num);
            setWaitingForOperand(false);
        } else {
            if (display === '0' && num !== ',') {
                setDisplay(num);
            } else if (display.length < 12) {
                setDisplay(display + num);
            }
        }
    }, [display, waitingForOperand]);

    const handleDecimal = useCallback(() => {
        hapticFeedback('light');
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
            return;
        }
        if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    }, [display, waitingForOperand]);

    const handleOperation = useCallback((op) => {
        hapticFeedback('medium');
        const currentValue = parseFloat(display);

        if (previousValue !== null && !waitingForOperand) {
            const result = calculate(previousValue, operation, currentValue);
            const resultStr = String(parseFloat(result.toFixed(10)));
            setDisplay(resultStr);
            setPreviousValue(result);
            setHistory(`${formatDisplay(String(previousValue))} ${operation} ${formatDisplay(display)} ${op}`);
        } else {
            setPreviousValue(currentValue);
            setHistory(`${formatDisplay(display)} ${op}`);
        }

        setOperation(op);
        setWaitingForOperand(true);
    }, [display, previousValue, operation, waitingForOperand, calculate]);

    const handleEquals = useCallback(() => {
        hapticFeedback('medium');
        if (previousValue === null || operation === null) return;

        const currentValue = parseFloat(display);
        const result = calculate(previousValue, operation, currentValue);
        const resultStr = String(parseFloat(result.toFixed(10)));

        setHistory(`${formatDisplay(String(previousValue))} ${operation} ${formatDisplay(display)} =`);
        setDisplay(resultStr);
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(true);
    }, [display, previousValue, operation, calculate]);

    const handlePercent = useCallback(() => {
        hapticFeedback('light');
        const currentValue = parseFloat(display);
        if (previousValue !== null && operation) {
            const percentValue = previousValue * (currentValue / 100);
            setDisplay(String(parseFloat(percentValue.toFixed(10))));
        } else {
            setDisplay(String(parseFloat((currentValue / 100).toFixed(10))));
        }
    }, [display, previousValue, operation]);

    const handleToggleSign = useCallback(() => {
        hapticFeedback('light');
        const val = parseFloat(display);
        if (val !== 0) {
            setDisplay(String(-val));
        }
    }, [display]);

    const handleBackspace = useCallback(() => {
        hapticFeedback('light');
        if (waitingForOperand) return;
        if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
            setDisplay('0');
        } else {
            setDisplay(display.slice(0, -1));
        }
    }, [display, waitingForOperand]);

    const handleButtonPress = useCallback((label) => {
        switch (label) {
            case 'C': resetCalculator(); hapticFeedback('medium'); break;
            case '⌫': handleBackspace(); break;
            case '%': handlePercent(); break;
            case '±': handleToggleSign(); break;
            case ',': handleDecimal(); break;
            case '=': handleEquals(); break;
            case '+': case '−': case '×': case '÷':
                handleOperation(label); break;
            default:
                handleNumber(label); break;
        }
    }, [resetCalculator, handleBackspace, handlePercent, handleToggleSign, handleDecimal, handleEquals, handleOperation, handleNumber]);

    // Keyboard support
    useEffect(() => {
        if (inline) return;
        const handleKeyDown = (e) => {
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                handleNumber(e.key);
            }
            else if (e.key === '.' || e.key === ',') {
                e.preventDefault();
                handleDecimal();
            }
            else if (e.key === '+') { e.preventDefault(); handleOperation('+'); }
            else if (e.key === '-') { e.preventDefault(); handleOperation('−'); }
            else if (e.key === '*') { e.preventDefault(); handleOperation('×'); }
            else if (e.key === '/') { e.preventDefault(); handleOperation('÷'); }
            else if (e.key === '%') { e.preventDefault(); handlePercent(); }
            else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleEquals(); }
            else if (e.key === 'Backspace') { e.preventDefault(); handleBackspace(); }
            else if (e.key === 'Escape') { e.preventDefault(); if (onClose) onClose(); }
            else if (e.key === 'c' || e.key === 'C') { e.preventDefault(); resetCalculator(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [inline, handleNumber, handleDecimal, handleOperation, handlePercent, handleEquals, handleBackspace, onClose, resetCalculator]);

    const getButtonStyle = (label) => {
        const isOperator = ['+', '−', '×', '÷'].includes(label);
        const isEquals = label === '=';
        const isAction = ['C', '⌫', '%', '±'].includes(label);

        let bg = 'rgba(255, 255, 255, 0.08)';
        let color = '#FFFFFF';
        let fontSize = inline ? '1.1rem' : '1.3rem';
        let fontWeight = '600';

        if (isOperator) {
            bg = operation === label && waitingForOperand
                ? '#FFFFFF'
                : 'rgba(255, 149, 0, 0.85)';
            color = operation === label && waitingForOperand
                ? 'rgba(255, 149, 0, 1)'
                : '#FFFFFF';
            fontWeight = '700';
        } else if (isEquals) {
            bg = accentColor;
            color = '#FFFFFF';
            fontWeight = '800';
        } else if (isAction) {
            bg = 'rgba(255, 255, 255, 0.15)';
            color = label === 'C' ? '#FF6B6B' : '#FFFFFF';
            fontWeight = '700';
        }

        return {
            width: '100%',
            aspectRatio: '1',
            borderRadius: inline ? '14px' : '50%',
            border: 'none',
            background: bg,
            color,
            fontSize,
            fontWeight,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTapHighlightColor: 'transparent'
        };
    };

    const displayValue = formatDisplay(display);
    const resultForAmount = formatResultForAmount(display);
    const hasResult = parseFloat(display) !== 0 && !isNaN(parseFloat(display));

    const calcContent = (
        <div style={{
            background: inline
                ? 'rgba(28, 28, 30, 0.92)'
                : 'rgba(28, 28, 30, 0.85)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderRadius: inline ? '24px' : '28px',
            padding: inline ? '16px' : '20px',
            width: inline ? '320px' : '340px', // Travado no tamanho
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: inline
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            {onClose && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                    <span style={{
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: 'rgba(255, 255, 255, 0.4)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                    }}>
                        Calculadora
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Display */}
            <div style={{
                textAlign: 'right',
                marginBottom: inline ? '12px' : '16px',
                padding: inline ? '8px 4px' : '12px 4px',
                height: inline ? '74px' : '94px', // Altura fixa para histórico + display
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                boxSizing: 'border-box'
            }}>
                {/* Histórico fixo para evitar pulos de layout */}
                <div style={{
                    height: '1.2rem',
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.35)',
                    fontWeight: '500',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {history || '\u00A0'}
                </div>
                <div
                    ref={displayRef}
                    style={{
                        fontSize: displayValue.length > 12
                            ? (inline ? '1.2rem' : '1.5rem')
                            : (displayValue.length > 9 ? (inline ? '1.5rem' : '1.8rem') : (inline ? '2rem' : '2.5rem')),
                        fontWeight: '300',
                        color: '#FFFFFF',
                        letterSpacing: '-1px',
                        height: inline ? '2.5rem' : '3rem', // Altura fixa do número
                        lineHeight: inline ? '2.5rem' : '3rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                        transition: 'font-size 0.1s ease'
                    }}
                >
                    {displayValue}
                </div>
            </div>

            {/* Buttons Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: inline ? '6px' : '8px'
            }}>
                {CALC_BUTTONS.flat().map((label, i) => (
                    <button
                        key={`${label}-${i}`}
                        onClick={() => handleButtonPress(label)}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.92)';
                            e.currentTarget.style.opacity = '0.8';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.opacity = '1';
                        }}
                        onTouchStart={(e) => {
                            e.currentTarget.style.transform = 'scale(0.92)';
                            e.currentTarget.style.opacity = '0.8';
                        }}
                        onTouchEnd={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.opacity = '1';
                        }}
                        style={getButtonStyle(label)}
                    >
                        {label === '⌫' ? <Delete size={inline ? 18 : 20} /> : label}
                    </button>
                ))}
            </div>

            {/* Use Value Button */}
            {onUseValue && hasResult && (
                <button
                    onClick={() => {
                        hapticFeedback('medium');
                        onUseValue(resultForAmount);
                        if (onClose) onClose();
                    }}
                    style={{
                        width: '100%',
                        marginTop: inline ? '10px' : '12px',
                        padding: inline ? '12px' : '14px',
                        borderRadius: '16px',
                        border: 'none',
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                        color: '#FFFFFF',
                        fontSize: '0.95rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: `0 8px 24px ${accentColor}40`,
                        transition: 'all 0.2s ease',
                        letterSpacing: '-0.3px'
                    }}
                    onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'scale(0.97)';
                    }}
                    onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <Check size={18} />
                    Adicionar valor
                </button>
            )}
        </div>
    );

    return calcContent;
}

export { CalcIcon };
