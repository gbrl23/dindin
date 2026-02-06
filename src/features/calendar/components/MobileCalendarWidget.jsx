import React from 'react';
import { format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MobileCalendarWidget({
    currentDate,
    selectedDate,
    onDateSelect,
    onMonthChange,
    calendarDays,
    daysData
}) {
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
        <div style={{
            background: 'var(--bg-card)',
            paddingBottom: '16px',
            paddingTop: '8px',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 10,
            position: 'sticky',
            top: 0
        }}>
            {/* Header: Month Navigation */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                marginBottom: '16px'
            }}>
                <button
                    onClick={() => onMonthChange(-1)}
                    style={{
                        padding: '8px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--danger)', // Apple Red
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                    textTransform: 'capitalize',
                    margin: 0
                }}>
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h2>
                <button
                    onClick={() => onMonthChange(1)}
                    style={{
                        padding: '8px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Week Days Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                marginBottom: '8px',
                padding: '0 8px'
            }}>
                {weekDays.map((day, i) => (
                    <div key={i} style={{
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--text-tertiary)'
                    }}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                padding: '0 8px',
                rowGap: '8px' // Converted from gap-y-2
            }}>
                {calendarDays.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayData = daysData[dateStr];
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isDayToday = isToday(day);

                    const hasIncome = dayData?.income > 0;
                    const hasExpense = dayData?.expense > 0;
                    const hasEvents = dayData?.events?.length > 0;

                    return (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                height: '48px',
                                cursor: 'pointer'
                            }}
                            onClick={() => onDateSelect(day)}
                        >
                            <div
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s',
                                    background: isSelected ? '#000000' : 'transparent',
                                    color: isSelected ? '#FFFFFF' : (
                                        isDayToday ? 'var(--danger)' : (
                                            !isCurrentMonth ? 'var(--text-tertiary)' : 'var(--text-primary)'
                                        )
                                    ),
                                    fontWeight: (isDayToday || isSelected) ? 'bold' : 'normal',
                                    boxShadow: isSelected ? '0 4px 10px rgba(0,0,0,0.2)' : 'none',
                                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                }}
                            >
                                {format(day, 'd')}
                            </div>

                            {/* Dots Indicators */}
                            <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                                {/* Event Indicators (Closing/Due) */}
                                {hasEvents && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-secondary)' }}></div>}

                                {/* Transaction Type Indicators */}
                                {dayData?.hasIncome && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--success)' }}></div>}
                                {dayData?.hasExpense && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--danger)' }}></div>}
                                {dayData?.hasBill && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--warning)' }}></div>}
                                {dayData?.hasInvestment && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--info)' }}></div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
