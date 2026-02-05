
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                width: '64px',
                height: '32px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s'
            }}
            title={isDark ? 'Mudar para Claro' : 'Mudar para Escuro'}
        >
            {/* Icons Background */}
            <div style={{
                position: 'absolute',
                left: '8px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                opacity: isDark ? 0.3 : 1
            }}>
                <Sun size={14} />
            </div>

            <div style={{
                position: 'absolute',
                right: '8px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                opacity: isDark ? 1 : 0.3
            }}>
                <Moon size={14} />
            </div>

            {/* Sliding Thumb */}
            <div style={{
                width: '24px',
                height: '24px',
                background: isDark ? 'var(--primary)' : '#FFF',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transform: isDark ? 'translateX(32px)' : 'translateX(0)',
                transition: 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                color: isDark ? '#FFF' : 'var(--primary)'
            }}>
                {/* Optional: Icon inside thumb */}
                {isDark ? <Moon size={14} /> : <Sun size={14} />}
            </div>
        </button>
    );
}
