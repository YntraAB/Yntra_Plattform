/**
 * This is the main calendar/scheduler view component with support for
 * multiple view modes: Day, Week, Month, and Agenda.
 * 
 * Each view mode provides a different perspective on the scheduled events,
 * allowing users to choose the most appropriate view for their needs.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/contexts/WorkspaceContext';
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
import type { CalendarEvent, CalendarView as ViewType, User } from '@/types';

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
  startHour?: number;
  locale?: string;
  tooltipPosition?: 'side' | 'top';
  currentDate: Date;
  users?: User[];
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  hourHeight = 60,
  startHour = 0,
  locale = 'en-US',
  tooltipPosition = 'side',
  currentDate,
  users = []
}) => {
  const categoryConfig = getCategoryConfig(event.category);

  // Helper to format assignee name
  const getDisplayName = () => {
    if (!event.assigneeId) return event.title;
    const user = users.find(u => u.id === event.assigneeId);
    if (!user) return event.title;

    const fullName = user.name || (user as any).full_name || '';
    if (!fullName) return event.title;

    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0];
    if (parts.length === 1) return firstName;

    const lastName = parts[parts.length - 1];
    // If "First Last" is longer than 12 chars, use "First L."
    if (`${firstName} ${lastName}`.length > 12) {
      return `${firstName} ${lastName.charAt(0)}.`;
    }
    return `${firstName} ${lastName}`;
  };

  const displayName = getDisplayName();

  const dayStart = new Date(currentDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(currentDate);
  dayEnd.setHours(23, 59, 59, 999);

  const effectiveStart = event.startTime < dayStart ? dayStart : event.startTime;
  const effectiveEnd = event.endTime > dayEnd ? dayEnd : event.endTime;

  const top = calculateEventTop(effectiveStart, hourHeight, startHour);
  const height = calculateEventHeight(effectiveStart, effectiveEnd, hourHeight);

  return (
    <div
      onClick={onClick}
      className="group absolute left-1 right-1 rounded-md px-2 py-1.5 cursor-pointer
                 transition-all duration-200 hover:brightness-105 hover:shadow-xl
                 text-xs z-10 hover:z-50"
      style={{
        top: `${top}px`,
        height: `${Math.max(height - 2, 24)}px`,
        backgroundColor: categoryConfig.bgColor,
        borderLeft: `3px solid ${categoryConfig.color}`,
      }}
    >
      {/* Event title */}
      <div
        style={{ color: categoryConfig.color }}
      >
        {displayName}
      </div>

      {/* Event time (only show if height allows) */}
      {height > 35 && (
        <div className="text-muted-foreground text-[10px] mt-0.5">
          {formatTimeRange(event.startTime, event.endTime, locale)}
        </div>
      )}

      {/* Event location (only show if height allows) */}
      {height > 50 && event.location && (
        <div className="flex items-center gap-1 text-muted-foreground text-[10px] mt-0.5">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{event.location}</span>
        </div>
      )}

      {/* Hover Information Popup */}
      <div className={cn(
        "hidden group-hover:block absolute w-64 p-4",
        "bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl z-[100]",
        "pointer-events-none animate-in fade-in duration-200",
        tooltipPosition === 'top'
          ? "bottom-full left-1/2 -translate-x-1/2 mb-2 slide-in-from-bottom-2"
          : "left-full top-0 ml-2 zoom-in-95"
      )}>
        <div className="flex items-center justify-between mb-2">
          <span
            className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider"
            style={{ backgroundColor: categoryConfig.bgColor, color: categoryConfig.color }}
          >
            {categoryConfig.label}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            {event.startTime.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <h4 className="text-sm font-bold text-foreground mb-1 leading-tight">{event.title}</h4>

        <div className="text-xs text-muted-foreground mb-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryConfig.color }} />
            {formatTimeRange(event.startTime, event.endTime, locale)}
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-primary" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
              {event.description}
            </p>
          </div>
        )}
      </div>
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
  locale?: string;
}

const MonthEventCard: React.FC<MonthEventCardProps> = ({ event, onClick, locale = 'en-US' }) => {
  const categoryConfig = getCategoryConfig(event.category);

  return (
    <div className="relative group">
      <div
        onClick={onClick}
        className="px-1.5 py-0.5 rounded text-[10px] cursor-pointer
                   transition-all duration-150 hover:brightness-110 truncate"
        style={{
          backgroundColor: categoryConfig.bgColor,
          color: categoryConfig.color,
        }}
      >
        {event.startTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })} {event.title}
      </div>

      {/* Hover Information Popup */}
      <div className="hidden group-hover:block absolute bottom-full mb-1 left-0 w-64 p-4 
                      bg-background/95 backdrop-blur-md border border-border rounded-xl 
                      shadow-2xl z-[100] pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200">
        <div className="flex items-center justify-between mb-2">
          <span
            className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider"
            style={{ backgroundColor: categoryConfig.bgColor, color: categoryConfig.color }}
          >
            {categoryConfig.label}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            {event.startTime.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <h4 className="text-sm font-bold text-foreground mb-1 leading-tight">{event.title}</h4>

        <div className="text-xs text-muted-foreground mb-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryConfig.color }} />
            {formatTimeRange(event.startTime, event.endTime, locale)}
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-primary" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
              {event.description}
            </p>
          </div>
        )}
      </div>
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
  users: User[];
  onEventClick: (event: CalendarEvent) => void;
}

const DayView: React.FC<DayViewProps> = ({ selectedDate, events, users, onEventClick }) => {
  const { settings, preferences } = useWorkspace();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const startHour = settings.business_hours?.start ?? 0;
  const endHour = settings.business_hours?.end ?? 23;
  const timeSlots = useMemo(() => generateTimeSlots(startHour, endHour), [startHour, endHour]);
  const HOUR_HEIGHT = preferences.calendar_density === 'compact' ? 40 : 60;
  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US';

  useEffect(() => {
    if (scrollContainerRef.current && isToday(selectedDate)) {
      const now = new Date();
      if (now.getHours() >= startHour && now.getHours() <= endHour) {
        const scrollPosition = (now.getHours() - startHour - 1) * HOUR_HEIGHT;
        scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
      }
    }
  }, [selectedDate, startHour, endHour, HOUR_HEIGHT]);

  const dayEvents = useMemo(() => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  }, [events, selectedDate]);

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-dark">
      <div className="flex min-h-full">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r border-border bg-sidebar">
          <div className="h-4 border-b border-border" />
          <div className="h-4 border-b border-border" />
          {timeSlots.map((slot, index) => (
            <div key={index} style={{ height: `${HOUR_HEIGHT}px` }} className="border-b border-border relative">
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
                top: `calc(1rem + ${(new Date().getHours() - startHour + new Date().getMinutes() / 60) * HOUR_HEIGHT}px)`,
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
            <div key={index} style={{ height: `${HOUR_HEIGHT}px` }} className="border-b border-border" />
          ))}

          {/* Events */}
          <div className="absolute inset-x-0 bottom-0 top-4">
            {dayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => onEventClick(event)}
                hourHeight={HOUR_HEIGHT}
                startHour={startHour}
                locale={locale}
                tooltipPosition="top"
                currentDate={selectedDate}
                users={users}
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
  selectedEndDate?: Date | null;
  events: CalendarEvent[];
  users: User[];
  onEventClick: (event: CalendarEvent) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ selectedDate, selectedEndDate, events, users, onEventClick }) => {
  const { settings, preferences } = useWorkspace();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const startHour = settings.business_hours?.start ?? 0;
  const endHour = settings.business_hours?.end ?? 23;
  const timeSlots = useMemo(() => generateTimeSlots(startHour, endHour), [startHour, endHour]);
  const HOUR_HEIGHT = preferences.calendar_density === 'compact' ? 40 : 60;
  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US';

  const weekDays = useMemo(() => {
    if (selectedEndDate) {
      const days = [];
      const current = new Date(selectedDate);
      while (current <= selectedEndDate) {
        days.push({
          date: new Date(current),
          name: current.toLocaleDateString(locale, { weekday: 'short' }),
          dayOfMonth: current.getDate(),
          isToday: isToday(current),
          isWeekend: current.getDay() === 0 || current.getDay() === 6
        });
        current.setDate(current.getDate() + 1);
      }
      return days;
    }
    const weekStart = getStartOfWeek(selectedDate, settings.week_start);
    return generateWeekDays(weekStart, locale);
  }, [selectedDate, selectedEndDate, settings.week_start, locale]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      if (now.getHours() >= startHour && now.getHours() <= endHour) {
        const scrollPosition = (now.getHours() - startHour - 1) * HOUR_HEIGHT;
        scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
      }
    }
  }, [startHour, endHour, HOUR_HEIGHT]);

  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  };

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-dark">
      <div className="flex min-h-full">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r border-border bg-sidebar">
          <div className="h-4 border-b border-border" />
          {timeSlots.map((slot, index) => (
            <div key={index} style={{ height: `${HOUR_HEIGHT}px` }} className="border-b border-border relative">
              <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground">
                {slot.label}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns with events */}
        <div className="flex-1 grid relative divide-x divide-border" style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(0, 1fr))` }}>
          {/* Current time indicator */}
          {weekDays.some(day => day.isToday) && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{
                top: `calc(1rem + ${(new Date().getHours() - startHour + new Date().getMinutes() / 60) * HOUR_HEIGHT}px)`,
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
                <div key={hourIndex} style={{ height: `${HOUR_HEIGHT}px` }} className="border-b border-border" />
              ))}

              {/* Events for this day */}
              <div className="absolute inset-x-0 bottom-0 top-4">
                {getEventsForDay(day.date).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick(event)}
                    hourHeight={HOUR_HEIGHT}
                    startHour={startHour}
                    locale={locale}
                    tooltipPosition="side"
                    currentDate={day.date}
                    users={users}
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
  users: User[];
  onEventClick: (event: CalendarEvent) => void;
  onDateChange: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ selectedDate, events, onEventClick, onDateChange }) => {
  const { settings } = useWorkspace();
  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US';

  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();
    const diffToStart = (startDayOfWeek < settings.week_start ? 7 : 0) + startDayOfWeek - settings.week_start;

    const daysInMonth = lastDayOfMonth.getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      dayOfMonth: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CalendarEvent[];
    }> = [];

    for (let i = diffToStart - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date,
        dayOfMonth: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: isToday(date),
        events: events.filter(e => isSameDay(e.startTime, date)),
      });
    }

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
  }, [selectedDate, events, settings.week_start]);

  const dayLabels = settings.week_start === 1
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
                  locale={locale}
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
  users: User[];
  onEventClick: (event: CalendarEvent) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ events, onEventClick }) => {
  const { settings } = useWorkspace();
  const { t } = useTranslation();
  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US';

  const groupedEvents = useMemo(() => {
    const sortedEvents = [...events].sort((a, b) =>
      a.startTime.getTime() - b.startTime.getTime()
    );

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
            ? t('common.today')
            : event.startTime.toLocaleDateString(locale, {
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
                          {event.startTime.toLocaleTimeString(locale, {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {event.endTime.toLocaleTimeString(locale, {
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
  selectedEndDate?: Date | null;
  view: ViewType;
  events: CalendarEvent[];
  users: User[];
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  onEventClick: (event: CalendarEvent) => void;
  onNext: () => void;
  onPrevious: () => void;
  onToday: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  selectedEndDate,
  view,
  events,
  users,
  onDateChange,
  onViewChange,
  onEventClick,
  onNext,
  onPrevious,
  onToday,
}) => {
  const { settings } = useWorkspace();
  const { t } = useTranslation();
  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US';

  const weekDays = useMemo(() => {
    if (selectedEndDate && view === 'week') {
      const days = [];
      const current = new Date(selectedDate);
      while (current <= selectedEndDate) {
        days.push({
          date: new Date(current),
          name: current.toLocaleDateString(locale, { weekday: 'short' }),
          dayOfMonth: current.getDate(),
          isToday: isToday(current),
          isWeekend: current.getDay() === 0 || current.getDay() === 6
        });
        current.setDate(current.getDate() + 1);
      }
      return days;
    }
    const weekStart = getStartOfWeek(selectedDate, settings.week_start);
    return generateWeekDays(weekStart, locale);
  }, [selectedDate, selectedEndDate, view, settings.week_start, locale]);

  /**
   * Format the date range for the header based on current view
   */
  const formatDateRange = () => {
    switch (view) {
      case 'day':
        return selectedDate.toLocaleDateString(locale, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });

      case 'week':
        const start = weekDays[0].date;
        const end = weekDays[weekDays.length - 1].date;
        if (start.getMonth() === end.getMonth()) {
          return `${start.toLocaleDateString(locale, { month: 'long' })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
        } else if (start.getFullYear() === end.getFullYear()) {
          return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
        } else {
          return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }

      case 'month':
        return formatMonthYear(selectedDate, locale);

      case 'agenda':
        return t('scheduler.upcoming_events');

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
            users={users}
            onEventClick={onEventClick}
          />
        );

      case 'week':
        return (
          <WeekView
            selectedDate={selectedDate}
            selectedEndDate={selectedEndDate}
            events={events}
            users={users}
            onEventClick={onEventClick}
          />
        );

      case 'month':
        return (
          <MonthView
            selectedDate={selectedDate}
            events={events}
            users={users}
            onEventClick={onEventClick}
            onDateChange={onDateChange}
          />
        );

      case 'agenda':
        return (
          <AgendaView
            events={events}
            users={users}
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
      return null;
    }

    if (view === 'agenda') {
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
              {selectedDate.toLocaleDateString(locale, { weekday: 'long' })}
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

    // Week view - show dynamic days
    return (
      <div className="flex border-b border-border overflow-y-scroll scrollbar-dark" style={{ scrollbarColor: 'transparent transparent' }}>
        <div className="w-16 flex-shrink-0 border-r border-border bg-sidebar">
          <div className="h-4 border-b border-border" />
        </div>
        <div className="flex-1 grid divide-x divide-border" style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(0, 1fr))` }}>
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
