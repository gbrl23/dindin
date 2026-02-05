import React, { useMemo } from 'react';

export default function SimpleLineChart({ data, color = '#5100FF', height = 200 }) {
    // Data expected: array of { label: string, value: number }
    // We need at least 2 points to draw a line

    const points = useMemo(() => {
        if (!data || data.length === 0) return [];

        const maxVal = Math.max(...data.map(d => d.value)) || 100;
        const minVal = 0; // Always start from 0 for context
        const range = maxVal - minVal;

        return data.map((d, index) => {
            const x = (index / (data.length - 1)) * 100; // Percentage width
            const y = 100 - ((d.value - minVal) / (range || 1)) * 80; // Leave 20% padding at top
            return { x, y, value: d.value, label: d.label };
        });
    }, [data]);

    if (points.length < 2) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Dados insuficientes para gráfico</div>;

    // Build SVG Path (Smooth Bezier)
    // Simple Lineto for now to ensure robustness
    const pathD = points.reduce((acc, p, i, a) => {
        if (i === 0) return `M 0 ${p.y}`;

        // Smooth curve calc could go here, but straight lines are safer for MVP
        // Let's try simple bezier
        const prev = a[i - 1];
        const cp1x = prev.x + (p.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = prev.x + (p.x - prev.x) / 2;
        const cp2y = p.y;

        return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
    }, "");

    return (
        <div style={{ width: '100%', height: height, position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area under curve */}
                <path
                    d={`${pathD} L 100 100 L 0 100 Z`}
                    fill={`url(#grad-${color})`}
                    stroke="none"
                />

                {/* The Line */}
                <path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke" // Keeps line thickness constant
                />

                {/* Points */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="1.5"
                        fill="#fff"
                        stroke={color}
                        strokeWidth="1"
                        style={{ transition: 'all 0.2s' }}
                    >
                        <title>{p.label}: R$ {p.value.toLocaleString('pt-BR')}</title>
                    </circle>
                ))}
            </svg>

            {/* X Axis Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>{points[0].label}</span>
                <span>{points[points.length - 1].label}</span>
            </div>
        </div>
    );
}
