/**
 * =============================================================================
 * MINI CALENDAR COMPONENT
 * =============================================================================
 * A compact monthly calendar widget for quick date navigation.
 * Displays the current month with day selection and event indicators.
 * =============================================================================
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatMonthYear, isSameDay, isToday } from '@/lib/utils';

/**
 * Props for the MiniCalendar component
 */
interface MiniCalendarProps {
  /** Currently selected date */
  selectedDate: Date;
  /** Callback when a date is selected */
  onSelectDate: (date: Date) => void;
  /** Dates that have events (for indicators) */
  datesWithEvents?: Date[];
}

/**
 * MiniCalendar Component
 * Compact monthly calendar for sidebar navigation
 */
export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  onSelectDate,
  datesWithEvents = [],
}) => {
  /**
   * Generate the calendar grid data
   * Returns days for the current month view including padding days
   */
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    // Last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Day of week for the first day, adjusted to Monday start
    const startDayOfWeek = firstDayOfMonth.getDay();
    const diffToMonday = (startDayOfWeek + 6) % 7;
    
    // Total days in the month
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Generate days array
    const days: Array<{
      date: Date;
      dayOfMonth: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      hasEvents: boolean;
    }> = [];
    
    // Add padding days from previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = diffToMonday - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date,
        dayOfMonth: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: isToday(date),
        hasEvents: datesWithEvents.some(d => isSameDay(d, date)),
      });
    }
    
    // Add days of current month
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
    
    // Add padding days from next month to complete the grid (6 rows x 7 columns = 42 cells)
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
  }, [selectedDate, datesWithEvents]);

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

  // Day labels
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
          {formatMonthYear(selectedDate)}
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
            onClick={() => onSelectDate(day.date)}
            className={cn(
              'relative h-8 w-8 mx-auto rounded-full flex items-center justify-center',
              'text-sm transition-all duration-150',
              // Current month days
              day.isCurrentMonth && 'text-foreground hover:bg-muted',
              // Other month days (dimmed)
              !day.isCurrentMonth && 'text-muted-foreground/50',
              // Selected day
              isSameDay(day.date, selectedDate) && 'bg-primary text-white hover:bg-primary/80',
              // Today (if not selected)
              day.isToday && !isSameDay(day.date, selectedDate) && 'ring-1 ring-primary text-primary',
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

      {/* Quick action button */}
      <button className="
        w-full mt-4 py-2 px-4
        bg-muted hover:bg-muted
        text-foreground text-sm font-medium
        rounded-md transition-colors
        flex items-center justify-center gap-2
      ">
        <span className="text-primary">+</span>
        New Event
      </button>
    </div>
  );
};

export default MiniCalendar;
