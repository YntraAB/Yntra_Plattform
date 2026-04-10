/**
 * =============================================================================
 * CALENDAR VIEW COMPONENT
 * =============================================================================
 * This is the main calendar/scheduler view component with support for
 * multiple view modes: Day, Week, Month, and Agenda.
 * 
 * Each view mode provides a different perspective on the scheduled events,
 * allowing users to choose the most appropriate view for their needs.
 * =============================================================================
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  formatTimeRange,
  generateTimeSlots, 
  generateWeekDays,
  getStartOfWeek,
  isToday,
  isSameDay,
  getCategoryConfig,
  calculateEventTop,
  calculateEventHeight,
  formatMonthYear
} from '@/lib/utils';
import type { CalendarEvent, CalendarView as ViewType } from '@/types';

/**
 * View mode selector buttons
 */
const VIEW_MODES: { id: ViewType; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'agenda', label: 'Agenda' },
];

/**
 * Event Card Component for Day/Week views
 * Displays a single event in the calendar grid with absolute positioning
 */
interface EventCardProps {
  event: CalendarEvent;
  onClick: () => void;
  hourHeight?: number;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick, hourHeight = 60 }) => {
  const categoryConfig = getCategoryConfig(event.category);
  
  // Calculate position and height based on event time
  const top = calculateEventTop(event.startTime, hourHeight);
  const height = calculateEventHeight(event.startTime, event.endTime, hourHeight);
  
  return (
    <div
      onClick={onClick}
      className="absolute left-1 right-1 rounded-md px-2 py-1.5 cursor-pointer
                 transition-all duration-150 hover:brightness-110 hover:shadow-lg
                 overflow-hidden text-xs"
      style={{
        top: `${top}px`,
        height: `${Math.max(height - 2, 24)}px`,
        backgroundColor: categoryConfig.bgColor,
        borderLeft: `3px solid ${categoryConfig.color}`,
      }}
    >
      {/* Event title */}
      <div 
        className="font-medium truncate"
        style={{ color: categoryConfig.color }}
      >
        {event.title}
      </div>
      
      {/* Event time (only show if height allows) */}
      {height > 35 && (
        <div className="text-muted-foreground text-[10px] mt-0.5">
          {formatTimeRange(event.startTime, event.endTime)}
        </div>
      )}
      
      {/* Event location (only show if height allows) */}
      {height > 50 && event.location && (
        <div className="flex items-center gap-1 text-muted-foreground text-[10px] mt-0.5">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{event.location}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Event Card Component for Month view
 * Compact event display for the monthly calendar grid
 */
interface MonthEventCardProps {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
}

const MonthEventCard: React.FC<MonthEventCardProps> = ({ event, onClick }) => {
  const categoryConfig = getCategoryConfig(event.category);
  
  return (
    <div
      onClick={onClick}
      className="px-1.5 py-0.5 rounded text-[10px] cursor-pointer
                 transition-all duration-150 hover:brightness-110 truncate"
      style={{
        backgroundColor: categoryConfig.bgColor,
        color: categoryConfig.color,
      }}
    >
      {event.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} {event.title}
    </div>
  );
};

/**
 * DAY VIEW COMPONENT
 * Shows a single day with hourly time slots
 */
interface DayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const DayView: React.FC<DayViewProps> = ({ selectedDate, events, onEventClick }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const HOUR_HEIGHT = 60;
  
  // Auto-scroll to current time
  useEffect(() => {
    if (scrollContainerRef.current && isToday(selectedDate)) {
      const now = new Date();
      const scrollPosition = (now.getHours() - 2) * HOUR_HEIGHT;
      scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [selectedDate]);
  
  // Get events for the selected day
  const dayEvents = events.filter(event => isSameDay(event.startTime, selectedDate));
  
  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-dark">
      <div className="flex min-h-full">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r border-border bg-sidebar">
          <div className="h-4 border-b border-border" />
          {timeSlots.map((slot, index) => (
            <div key={index} className="h-[60px] border-b border-border relative">
              <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground">
                {slot.label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Day column with events */}
        <div className="flex-1 relative">
          <div className="h-4 border-b border-border" />
          
          {/* Current time indicator */}
          {isToday(selectedDate) && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{
                top: `calc(1rem + ${(new Date().getHours() + new Date().getMinutes() / 60) * HOUR_HEIGHT}px)`,
              }}
            >
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
                <div className="flex-1 h-px bg-red-500" />
              </div>
            </div>
          )}
          
          {/* Hour grid lines */}
          {timeSlots.map((_, index) => (
            <div key={index} className="h-[60px] border-b border-border" />
          ))}
          
          {/* Events */}
          <div className="absolute inset-x-0 bottom-0 top-4">
            {dayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => onEventClick(event)}
                hourHeight={HOUR_HEIGHT}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * WEEK VIEW COMPONENT
 * Shows 7 days with hourly time slots
 */
interface WeekViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ selectedDate, events, onEventClick }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const weekDays = useMemo(() => {
    const weekStart = getStartOfWeek(selectedDate);
    return generateWeekDays(weekStart);
  }, [selectedDate]);
  const HOUR_HEIGHT = 60;
  
  // Auto-scroll to current time
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const scrollPosition = (now.getHours() - 2) * HOUR_HEIGHT;
      scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);
  
  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(event.startTime, date));
  };
  
  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-dark">
      <div className="flex min-h-full">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r border-border bg-sidebar">
          <div className="h-4 border-b border-border" />
          {timeSlots.map((slot, index) => (
            <div key={index} className="h-[60px] border-b border-border relative">
              <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground">
                {slot.label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Day columns with events */}
        <div className="flex-1 grid grid-cols-7 relative">
          {/* Current time indicator */}
          {weekDays.some(day => day.isToday) && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{
                top: `calc(1rem + ${(new Date().getHours() + new Date().getMinutes() / 60) * HOUR_HEIGHT}px)`,
              }}
            >
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
                <div className="flex-1 h-px bg-red-500" />
              </div>
            </div>
          )}
          
          {/* Grid lines and events for each day */}
          {weekDays.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={cn(
                'relative border-r border-border last:border-r-0',
                day.isWeekend && 'bg-muted/50 dark:bg-[#0F1115]'
              )}
            >
              <div className="h-4 border-b border-border" />
              
              {/* Hour grid lines */}
              {timeSlots.map((_, hourIndex) => (
                <div key={hourIndex} className="h-[60px] border-b border-border" />
              ))}
              
              {/* Events for this day */}
              <div className="absolute inset-x-0 bottom-0 top-4">
                {getEventsForDay(day.date).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick(event)}
                    hourHeight={HOUR_HEIGHT}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * MONTH VIEW COMPONENT
 * Shows a full month in a grid layout
 */
interface MonthViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateChange: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ selectedDate, events, onEventClick, onDateChange }) => {
  // Generate calendar grid data
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const diffToMonday = (startDayOfWeek + 6) % 7;
    const daysInMonth = lastDayOfMonth.getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days: Array<{
      date: Date;
      dayOfMonth: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CalendarEvent[];
    }> = [];
    
    // Previous month padding days
    for (let i = diffToMonday - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date,
        dayOfMonth: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: isToday(date),
        events: events.filter(e => isSameDay(e.startTime, date)),
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: isToday(date),
        events: events.filter(e => isSameDay(e.startTime, date)),
      });
    }
    
    // Next month padding days (fill to 6 rows = 42 cells)
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: isToday(date),
        events: events.filter(e => isSameDay(e.startTime, date)),
      });
    }
    
    return days;
  }, [selectedDate, events]);
  
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="flex-1 overflow-y-auto scrollbar-dark p-4">
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayLabels.map((label, index) => (
          <div key={index} className="text-center text-xs text-muted-foreground font-medium py-2">
            {label}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            onClick={() => onDateChange(day.date)}
            className={cn(
              'min-h-[100px] p-2 rounded-lg border cursor-pointer transition-all duration-150',
              'hover:border-primary/50',
              day.isCurrentMonth 
                ? 'bg-muted border-border' 
                : 'bg-background border-border',
              isSameDay(day.date, selectedDate) && 'ring-2 ring-primary'
            )}
          >
            {/* Day number */}
            <div className={cn(
              'text-sm font-medium mb-1',
              day.isToday 
                ? 'w-7 h-7 flex items-center justify-center bg-primary text-white rounded-full'
                : day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {day.dayOfMonth}
            </div>
            
            {/* Events for this day */}
            <div className="space-y-1">
              {day.events.slice(0, 3).map((event) => (
                <MonthEventCard
                  key={event.id}
                  event={event}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                />
              ))}
              {day.events.length > 3 && (
                <div className="text-[10px] text-muted-foreground pl-1">
                  +{day.events.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * AGENDA VIEW COMPONENT
 * Shows events in a chronological list
 */
interface AgendaViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ events, onEventClick }) => {
  // Group events by date
  const groupedEvents = useMemo(() => {
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );
    
    // Group by date
    const groups: Array<{
      date: Date;
      dateLabel: string;
      isToday: boolean;
      events: CalendarEvent[];
    }> = [];
    
    sortedEvents.forEach((event) => {
      const existingGroup = groups.find(g => isSameDay(g.date, event.startTime));
      if (existingGroup) {
        existingGroup.events.push(event);
      } else {
        const isEventToday = isToday(event.startTime);
        groups.push({
          date: event.startTime,
          dateLabel: isEventToday 
            ? 'Today' 
            : event.startTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              }),
          isToday: isEventToday,
          events: [event],
        });
      }
    });
    
    return groups;
  }, [events]);
  
  return (
    <div className="flex-1 overflow-y-auto scrollbar-dark p-4">
      {groupedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <CalendarIcon className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg">No upcoming events</p>
          <p className="text-sm">Your scheduled events will appear here</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          {groupedEvents.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs',
                  group.isToday 
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                )}>
                  <span className="text-[10px] uppercase">
                    {group.date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="font-bold">{group.date.getDate()}</span>
                </div>
                <h3 className={cn(
                  'text-lg font-medium',
                  group.isToday ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {group.dateLabel}
                </h3>
              </div>
              
              {/* Events for this date */}
              <div className="space-y-2 ml-12">
                {group.events.map((event) => {
                  const categoryConfig = getCategoryConfig(event.category);
                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted 
                                 border border-border hover:border-primary/50
                                 cursor-pointer transition-all duration-150"
                    >
                      {/* Time */}
                      <div className="flex-shrink-0 w-20 text-right">
                        <div className="text-foreground text-sm font-medium">
                          {event.startTime.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false 
                          })}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {event.endTime.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false 
                          })}
                        </div>
                      </div>
                      
                      {/* Category indicator */}
                      <div 
                        className="w-1 h-10 rounded-full flex-shrink-0"
                        style={{ backgroundColor: categoryConfig.color }}
                      />
                      
                      {/* Event details */}
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground font-medium truncate">
                          {event.title}
                        </div>
                        {event.description && (
                          <div className="text-muted-foreground text-sm truncate">
                            {event.description}
                          </div>
                        )}
                      </div>
                      
                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center gap-1 text-muted-foreground text-sm flex-shrink-0">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      
                      {/* Category badge */}
                      <span 
                        className="px-2 py-1 rounded text-xs flex-shrink-0"
                        style={{ 
                          backgroundColor: categoryConfig.bgColor,
                          color: categoryConfig.color 
                        }}
                      >
                        {categoryConfig.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main CalendarView Component
 * Renders the appropriate view based on the current view mode
 */
interface CalendarViewProps {
  selectedDate: Date;
  view: ViewType;
  events: CalendarEvent[];
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  onEventClick: (event: CalendarEvent) => void;
  onNext: () => void;
  onPrevious: () => void;
  onToday: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  view,
  events,
  onDateChange,
  onViewChange,
  onEventClick,
  onNext,
  onPrevious,
  onToday,
}) => {
  // Generate week days for header display
  const weekDays = useMemo(() => {
    const weekStart = getStartOfWeek(selectedDate);
    return generateWeekDays(weekStart);
  }, [selectedDate]);
  
  /**
   * Format the date range for the header based on current view
   */
  const formatDateRange = () => {
    switch (view) {
      case 'day':
        return selectedDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        });
      
      case 'week':
        const start = weekDays[0].date;
        const end = weekDays[6].date;
        if (start.getMonth() === end.getMonth()) {
          return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
        } else if (start.getFullYear() === end.getFullYear()) {
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
        } else {
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
      
      case 'month':
        return formatMonthYear(selectedDate);
      
      case 'agenda':
        return 'Upcoming Events';
      
      default:
        return '';
    }
  };
  
  /**
   * Render the appropriate view based on current view mode
   */
  const renderView = () => {
    switch (view) {
      case 'day':
        return (
          <DayView
            selectedDate={selectedDate}
            events={events}
            onEventClick={onEventClick}
          />
        );
      
      case 'week':
        return (
          <WeekView
            selectedDate={selectedDate}
            events={events}
            onEventClick={onEventClick}
          />
        );
      
      case 'month':
        return (
          <MonthView
            selectedDate={selectedDate}
            events={events}
            onEventClick={onEventClick}
            onDateChange={onDateChange}
          />
        );
      
      case 'agenda':
        return (
          <AgendaView
            events={events}
            onEventClick={onEventClick}
          />
        );
      
      default:
        return null;
    }
  };
  
  /**
   * Render the appropriate header based on view mode
   */
  const renderHeader = () => {
    if (view === 'month') {
      // Month view doesn't need the day column headers
      return null;
    }
    
    if (view === 'agenda') {
      // Agenda view doesn't need column headers
      return null;
    }
    
    if (view === 'day') {
      // Day view shows single day header
      return (
        <div className="flex border-b border-border overflow-y-scroll scrollbar-dark" style={{ scrollbarColor: 'transparent transparent' }}>
          <div className="w-16 flex-shrink-0 border-r border-border" />
          <div className="flex-1 px-2 py-3 text-center">
            <div className={cn(
              'text-xs uppercase tracking-wider',
              isToday(selectedDate) ? 'text-primary' : 'text-muted-foreground'
            )}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className={cn(
              'text-lg font-semibold mt-1',
              isToday(selectedDate) 
                ? 'w-8 h-8 mx-auto flex items-center justify-center bg-primary text-white rounded-full'
                : 'text-foreground'
            )}>
              {selectedDate.getDate()}
            </div>
          </div>
        </div>
      );
    }
    
    // Week view - show all 7 days
    return (
      <div className="flex border-b border-border overflow-y-scroll scrollbar-dark" style={{ scrollbarColor: 'transparent transparent' }}>
        <div className="w-16 flex-shrink-0 border-r border-border" />
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                'px-2 py-3 text-center border-r border-border last:border-r-0',
                day.isWeekend && 'bg-muted/50 dark:bg-[#0F1115]'
              )}
            >
              <div className={cn(
                'text-xs uppercase tracking-wider',
                day.isToday ? 'text-primary' : 'text-muted-foreground'
              )}>
                {day.name}
              </div>
              <div className={cn(
                'text-lg font-semibold mt-1',
                day.isToday 
                  ? 'w-8 h-8 mx-auto flex items-center justify-center bg-primary text-white rounded-full'
                  : 'text-foreground'
              )}>
                {day.dayOfMonth}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        {/* Left side - Navigation and date display */}
        <div className="flex items-center gap-4">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevious}
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={onToday}
              className="px-3 py-1.5 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={onNext}
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          {/* Date display */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground font-medium">
              {formatDateRange()}
            </span>
          </div>
        </div>
        
        {/* Right side - View mode selector */}
        <div className="flex items-center bg-secondary rounded-lg p-1">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onViewChange(mode.id)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-all duration-150',
                view === mode.id
                  ? 'bg-primary/80 text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* View-specific header (day/week column headers) */}
      {renderHeader()}
      
      {/* Main content - renders the active view */}
      {renderView()}
    </div>
  );
};

export default CalendarView;
