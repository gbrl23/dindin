import React, { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useCalendarData } from './hooks/useCalendarData';
import MobileCalendarWidget from './components/MobileCalendarWidget';
import DayTransactionList from './components/DayTransactionList';
import DesktopCalendarGrid from './components/DesktopCalendarGrid';
import { addMonths, format } from 'date-fns';
import { Filter, X, Tag } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';

export default function CalendarView() {
    const isMobile = useIsMobile();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedType, setSelectedType] = useState('all');

    // Custom Hook logic
    const { calendarDays, daysData } = useCalendarData(currentMonth, { type: selectedType });

    const handleMonthChange = (increment) => {
        setCurrentMonth(prev => addMonths(prev, increment));
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        if (date.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(date);
        }
    };

    // Get Data for Selected Date to pass to List
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const selectedDayData = daysData[selectedDateStr] || { transactions: [], events: [] };

    const filterOptions = [
        { id: 'all', label: 'Todos', color: 'var(--primary)' },
        { id: 'income', label: 'Receitas', color: 'var(--success)' },
        { id: 'expense', label: 'Despesas', color: 'var(--danger)' },
        { id: 'investment', label: 'Investimentos', color: 'var(--info)' },
        { id: 'bill', label: 'Contas', color: 'var(--warning)' }
    ];

    const renderFilterTabs = () => (
        <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            overflowX: 'auto',
            paddingBottom: '4px',
            justifyContent: isMobile ? 'flex-start' : 'flex-end'
        }}>
            {filterOptions.map(type => {
                const isActive = selectedType === type.id;
                return (
                    <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        style={{
                            padding: isMobile ? '8px 16px' : '8px 24px',
                            borderRadius: '24px',
                            border: isActive ? `1px solid ${type.color}` : '1px solid var(--border)',
                            background: isActive ? `${type.color}15` : 'var(--bg-card)',
                            color: isActive ? type.color : 'var(--text-secondary)',
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {type.label}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            {isMobile ? (
                <>
                    {/* Mobile Type Filter */}
                    <div style={{ padding: '0 16px' }}>
                        {renderFilterTabs()}
                    </div>

                    {/* Mobile: Apple Calendar Style */}
                    <MobileCalendarWidget
                        currentDate={currentMonth}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        onMonthChange={handleMonthChange}
                        calendarDays={calendarDays}
                        daysData={daysData}
                    />

                    {/* Detailed List for Selected Day */}
                    <DayTransactionList
                        date={selectedDate}
                        data={selectedDayData}
                    />
                </>
            ) : (
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', width: '100%' }}>
                    {/* Desktop Filter And Calendar */}
                    {renderFilterTabs()}

                    <DesktopCalendarGrid
                        currentDate={currentMonth}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        onMonthChange={handleMonthChange}
                        calendarDays={calendarDays}
                        daysData={daysData}
                    />
                </div>
            )}
        </div>
    );
}
