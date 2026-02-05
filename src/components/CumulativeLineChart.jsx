import React, { useMemo, useState } from 'react';

export default function CumulativeLineChart({ incomeData, expenseData, labels, height = 240 }) {
    const [hoverIndex, setHoverIndex] = useState(null);

    const chartPoints = useMemo(() => {
        if (!incomeData || !expenseData || incomeData.length === 0) return null;

        const maxVal = Math.max(
            ...incomeData,
            ...expenseData
        ) * 1.1;

        const pointsCount = incomeData.length;

        const incomePoints = incomeData.map((val, i) => ({
            x: (i / (pointsCount - 1)) * 100,
            y: 100 - (val / maxVal) * 100,
            val
        }));

        const expensePoints = expenseData.map((val, i) => ({
            x: (i / (pointsCount - 1)) * 100,
            y: 100 - (val / maxVal) * 100,
            val
        }));

        const gridLines = [0, 0.25, 0.5, 0.75, 1].map(p => ({
            y: 100 - (p * 100),
            val: maxVal * p
        }));

        return { incomePoints, expensePoints, gridLines, maxVal };
    }, [incomeData, expenseData]);

    if (!chartPoints) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Carregando gráfico...</div>;

    const buildPath = (pts) => {
        return pts.reduce((acc, p, i, a) => {
            if (i === 0) return `M ${p.x} ${p.y}`;
            const prev = a[i - 1];
            // Smooth Curve logic
            const cp1x = prev.x + (p.x - prev.x) / 3;
            const cp2x = p.x - (p.x - prev.x) / 3;
            return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${p.y}, ${p.x} ${p.y}`;
        }, "");
    };

    const incomePath = buildPath(chartPoints.incomePoints);
    const expensePath = buildPath(chartPoints.expensePoints);

    return (
        <div style={{ width: '100%', height: height, position: 'relative', display: 'flex' }}>

            {/* Y Axis */}
            <div style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                paddingRight: '12px', color: 'var(--text-secondary)', fontSize: '0.7rem',
                textAlign: 'right', height: '100%', paddingBottom: '20px'
            }}>
                {chartPoints.gridLines.slice().reverse().map((g, i) => (
                    <span key={i} style={{ height: '0', display: 'flex', alignItems: 'center' }}>
                        {g.val >= 1000 ? `${(g.val / 1000).toFixed(0)}k` : g.val.toFixed(0)}
                    </span>
                ))}
            </div>

            {/* Chart */}
            <div style={{ flex: 1, position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>

                    {/* Horizontal Grid */}
                    {chartPoints.gridLines.map((g, i) => (
                        <line key={i} x1="0" y1={g.y} x2="100" y2={g.y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2,2" />
                    ))}

                    {/* Gradient Fills */}
                    {/* Purple Fill for Income */}
                    <defs>
                        <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#5100FF" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#5100FF" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <path d={`${incomePath} L 100 100 L 0 100 Z`} fill="url(#gradPurple)" stroke="none" />
                    <path d={`${expensePath} L 100 100 L 0 100 Z`} fill="rgba(0, 0, 0, 0.02)" stroke="none" />

                    {/* Lines */}
                    <path d={incomePath} fill="none" stroke="#5100FF" strokeWidth="3" vectorEffect="non-scaling-stroke" /> {/* Primary Purple */}
                    <path d={expensePath} fill="none" stroke="var(--text-primary)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />

                    {/* Hover Line */}
                    {hoverIndex !== null && (
                        <line
                            x1={chartPoints.incomePoints[hoverIndex].x}
                            y1={0}
                            x2={chartPoints.incomePoints[hoverIndex].x}
                            y2={100}
                            stroke="var(--text-tertiary)"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                        />
                    )}
                </svg>

                <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                    {chartPoints.incomePoints.map((_, i) => (
                        <div
                            key={i}
                            style={{ flex: 1 }}
                            onMouseEnter={() => setHoverIndex(i)}
                            onMouseLeave={() => setHoverIndex(null)}
                        />
                    ))}
                </div>

                {hoverIndex !== null && (
                    <div style={{
                        position: 'absolute',
                        left: `${chartPoints.incomePoints[hoverIndex].x}%`,
                        top: '10px',
                        transform: 'translateX(-50%)',
                        background: 'var(--bg-card)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-md)',
                        fontSize: '0.75rem',
                        pointerEvents: 'none',
                        zIndex: 10,
                        whiteSpace: 'nowrap',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{ fontWeight: '700', marginBottom: '2px' }}>Dia {labels[hoverIndex]}</div>
                        <div style={{ color: '#5100FF' }}>Receita: R$ {chartPoints.incomePoints[hoverIndex].val.toLocaleString()}</div>
                        <div style={{ color: 'var(--text-primary)' }}>Despesa: R$ {chartPoints.expensePoints[hoverIndex].val.toLocaleString()}</div>
                    </div>
                )}
            </div>

            <div style={{
                position: 'absolute', bottom: 0, left: '30px', right: 0,
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.7rem', color: 'var(--text-secondary)'
            }}>
                <span>1</span>
                <span>10</span>
                <span>20</span>
                <span>30</span>
            </div>
        </div>
    );
}
