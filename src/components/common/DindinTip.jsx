import React, { useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import { getRandomTip } from '../../utils/tips';

export default function DindinTip({ category = 'general', style = {} }) {
    // Generate the tip once when the component mounts to avoid flickering on re-renders
    const tip = useMemo(() => getRandomTip(category), [category]);

    return (
        <div className="card animate-fade-in" style={{
            padding: '20px',
            background: 'var(--bg-secondary)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            ...style
        }}>
            <h4 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                fontWeight: '700',
                color: 'var(--primary)'
            }}>
                <Lightbulb size={18} />
                Dicas do Dindin
            </h4>
            <p style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
                margin: 0
            }}>
                {tip}
            </p>
        </div>
    );
}
