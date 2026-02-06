import React from 'react';
import { format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Lock, AlertCircle } from 'lucide-react';

export default function DesktopCalendarGrid({
    currentDate,
    selectedDate,
    onDateSelect,
    onMonthChange,
    calendarDays,
    daysData
}) {
    const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 140px)',
            border: '1px solid var(--border-light)'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px',
                borderBottom: '1px solid var(--bg-secondary)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)',
                        textTransform: 'capitalize',
                        margin: 0
                    }}>
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => onMonthChange(-1)} style={{
                            padding: '8px',
                            background: 'transparent',
                            border: '1px solid var(--border-light)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)'
                        }}>
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => onMonthChange(1)} style={{
                            padding: '8px',
                            background: 'transparent',
                            border: '1px solid var(--border-light)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)'
                        }}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                borderBottom: '1px solid var(--border-light)',
                background: 'var(--bg-primary)'
            }}>
                {weekDays.map(day => (
                    <div key={day} style={{
                        padding: '12px 0',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid Body */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                flex: 1,
                overflowY: 'auto'
            }}>
                {calendarDays.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayData = daysData[dateStr];
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isDayToday = isToday(day);
                    const isSelected = isSameDay(day, selectedDate);

                    const hasIncome = dayData?.income > 0;
                    const hasExpense = dayData?.expense > 0;

                    return (
                        <div
                            key={i}
                            onClick={() => onDateSelect(day)}
                            style={{
                                borderBottom: '1px solid var(--border-light)',
                                borderRight: '1px solid var(--border-light)',
                                padding: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: !isCurrentMonth ? 'var(--bg-primary)' : 'var(--bg-card)',
                                minHeight: '100px', // Ensure visible size
                                opacity: !isCurrentMonth ? 0.6 : 1
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{
                                    width: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    background: isDayToday ? 'var(--primary)' : 'transparent',
                                    color: isDayToday ? '#fff' : 'var(--text-secondary)',
                                }}>
                                    {format(day, 'd')}
                                </span>

                                {/* Event Icons */}
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {dayData?.events?.map((evt, idx) => (
                                        <div
                                            key={idx}
                                            title={evt.title}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDateSelect(day);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {evt.type === 'closing' ?
                                                <Lock size={14} color="var(--warning)" /> :
                                                <AlertCircle size={14} color="var(--danger)" />
                                            }
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                                {dayData.income > 0 && (
                                    <div style={{
                                        fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--success)',
                                        background: 'rgba(52, 199, 89, 0.1)', padding: '4px 6px',
                                        borderRadius: '4px', border: '1px solid rgba(52, 199, 89, 0.2)',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                        + R$ {dayData.income.toFixed(2)}
                                    </div>
                                )}
                                {dayData.expense > 0 && (
                                    <div style={{
                                        fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--danger)',
                                        background: 'rgba(255, 59, 48, 0.1)', padding: '4px 6px',
                                        borderRadius: '4px', border: '1px solid rgba(255, 59, 48, 0.2)',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                        - R$ {dayData.expense.toFixed(2)}
                                    </div>
                                )}
                                {dayData.bill > 0 && (
                                    <div style={{
                                        fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--warning)',
                                        background: 'rgba(255, 149, 0, 0.1)', padding: '4px 6px',
                                        borderRadius: '4px', border: '1px solid rgba(255, 149, 0, 0.2)',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                        - R$ {dayData.bill.toFixed(2)}
                                    </div>
                                )}
                                {dayData.investment > 0 && (
                                    <div style={{
                                        fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--info)',
                                        background: 'rgba(0, 122, 255, 0.1)', padding: '4px 6px',
                                        borderRadius: '4px', border: '1px solid rgba(0, 122, 255, 0.2)',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                        - R$ {dayData.investment.toFixed(2)}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
