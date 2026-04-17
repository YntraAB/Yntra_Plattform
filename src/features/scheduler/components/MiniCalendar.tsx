/**
 * A compact monthly calendar widget for quick date navigation.
 * Displays the current month with day selection and event indicators.
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn, formatMonthYear, isSameDay, isToday } from '@/lib/utils';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface MiniCalendarProps {
  selectedDate: Date;
  selectedEndDate?: Date | null;
  onSelectDate: (date: Date, isShiftClick?: boolean) => void;
  onNewEvent?: () => void;
  datesWithEvents?: Date[];
}

/**
 * MiniCalendar Component
 * Compact monthly calendar for sidebar navigation
 */
export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  selectedEndDate = null,
  onSelectDate,
  onNewEvent,
  datesWithEvents = [],
}) => {
  const { settings } = useWorkspace();
  const { t } = useTranslation();
  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US';
  /**
   * Generate the calendar grid data
   * Returns days for the current month view including padding days
   */
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const diffToStart = (startDayOfWeek < settings.week_start ? 7 : 0) + startDayOfWeek - settings.week_start;
    const daysInMonth = lastDayOfMonth.getDate();

    const days: Array<{
      date: Date;
      dayOfMonth: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      hasEvents: boolean;
    }> = [];

    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = diffToStart - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date,
        dayOfMonth: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: isToday(date),
        hasEvents: datesWithEvents.some(d => isSameDay(d, date)),
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: isToday(date),
        hasEvents: datesWithEvents.some(d => isSameDay(d, date)),
      });
    }

    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: isToday(date),
        hasEvents: datesWithEvents.some(d => isSameDay(d, date)),
      });
    }

    return days;
  }, [selectedDate, datesWithEvents, settings.week_start]);

  /**
   * Navigate to the previous month
   */
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    const originalDay = newDate.getDate();
    newDate.setMonth(newDate.getMonth() - 1);
    if (newDate.getDate() < originalDay) {
      newDate.setDate(0);
    }
    onSelectDate(newDate);
  };

  /**
   * Navigate to the next month
   */
  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    const originalDay = newDate.getDate();
    newDate.setMonth(newDate.getMonth() + 1);
    if (newDate.getDate() < originalDay) {
      newDate.setDate(0);
    }
    onSelectDate(newDate);
  };

  const isSv = settings.language === 'sv';
  const dayLabels = settings.week_start === 1
    ? (isSv ? ['M', 'T', 'O', 'T', 'F', 'L', 'S'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'])
    : (isSv ? ['S', 'M', 'T', 'O', 'T', 'F', 'L'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']);

  return (
    <div className="bg-sidebar rounded-lg p-4">
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>

        <span className="text-foreground text-sm font-medium">
          {formatMonthYear(selectedDate, locale)}
        </span>

        <button
          onClick={goToNextMonth}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayLabels.map((label, index) => (
          <div
            key={index}
            className="text-center text-muted-foreground text-xs font-medium py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <button
            key={index}
            onClick={(e) => onSelectDate(day.date, e.shiftKey)}
            className={cn(
              'relative h-8 w-8 mx-auto rounded-full flex items-center justify-center',
              'text-sm transition-all duration-150',
              day.isCurrentMonth && 'text-foreground hover:bg-muted',
              !day.isCurrentMonth && 'text-muted-foreground/50',
              selectedEndDate && day.date > selectedDate && day.date < selectedEndDate && 'bg-primary/20 text-foreground',
              (isSameDay(day.date, selectedDate) || (selectedEndDate && isSameDay(day.date, selectedEndDate))) && 'bg-primary text-white hover:bg-primary/80',
              day.isToday && !isSameDay(day.date, selectedDate) && (!selectedEndDate || !isSameDay(day.date, selectedEndDate)) && 'ring-1 ring-primary text-primary',
            )}
          >
            {day.dayOfMonth}

            {/* Event indicator dot */}
            {day.hasEvents && !isSameDay(day.date, selectedDate) && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

        <button 
          onClick={onNewEvent}
          className="
        w-full mt-4 py-2 px-4
        bg-muted hover:bg-muted
        text-foreground text-sm font-medium
        rounded-md transition-colors
        flex items-center justify-center gap-2
      ">
        <span className="text-primary">+</span>
        {t('scheduler.new_event')}
      </button>
    </div>
  );
};

export default MiniCalendar;
