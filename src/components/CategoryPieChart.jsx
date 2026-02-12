import React, { useMemo } from 'react';

export default function CategoryPieChart({ transactions, height = 240 }) {
    const data = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];

        const categoriesMap = {};
        let totalExpenses = 0;

        transactions.forEach(t => {
            if (t.type === 'expense' || t.type === 'bill') {
                const catName = t.category || 'Geral';
                const catColor = t.category_details?.color || '#A0A0A0';

                if (!categoriesMap[catName]) {
                    categoriesMap[catName] = { name: catName, value: 0, color: catColor };
                }
                categoriesMap[catName].value += t.amount;
                totalExpenses += t.amount;
            }
        });

        if (totalExpenses === 0) return [];

        // Sort by value and take top 5, group rest as 'Outros'
        const sorted = Object.values(categoriesMap).sort((a, b) => b.value - a.value);

        return sorted.map(c => ({
            ...c,
            percentage: (c.value / totalExpenses) * 100
        }));
    }, [transactions]);

    if (data.length === 0) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', flexWrap: 'wrap', textAlign: 'center' }}>
                Nenhum gasto registrado neste mês.
            </div>
        );
    }

    // Pie chart logic using SVG
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const slices = data.map((slice, i) => {
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
        cumulativePercent += slice.percentage / 100;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

        const largeArcFlag = slice.percentage > 50 ? 1 : 0;

        const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
        ].join(' ');

        return <path key={i} d={pathData} fill={slice.color} />;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', borderRadius: '50%' }}>
                    {slices}
                    {/* Inner circle for Donut effect */}
                    <circle cx="0" cy="0" r="0.65" fill="var(--bg-card)" />
                </svg>
            </div>

            {/* Legend */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px 24px',
                width: '100%',
                padding: '0 10px'
            }}>
                {data.slice(0, 6).map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color, flexShrink: 0 }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.name}
                            </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {Math.round(item.percentage)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
