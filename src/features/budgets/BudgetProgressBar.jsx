import React from 'react';

const STATUS_COLORS = {
    healthy: '#34C759',
    warning: '#FF9500',
    critical: '#FF3B30',
    exceeded: '#FF3B30',
};

export default function BudgetProgressBar({ percentage, status }) {
    const color = STATUS_COLORS[status] || STATUS_COLORS.healthy;
    const clampedWidth = Math.min(percentage, 100);

    return (
        <div style={{
            width: '100%',
            height: 8,
            backgroundColor: '#f0f0f0',
            borderRadius: 4,
            overflow: 'hidden',
        }}>
            <div style={{
                width: `${clampedWidth}%`,
                height: '100%',
                backgroundColor: color,
                borderRadius: 4,
                transition: 'width 0.3s ease',
            }} />
        </div>
    );
}
