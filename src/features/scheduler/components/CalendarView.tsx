/**
 * This is the main calendar/scheduler view component with support for
 * multiple view modes: Day, Week, Month, and Agenda.
 *
 * Each view mode provides a different perspective on the scheduled events,
 * allowing users to choose the most appropriate view for their needs.
 */

import React, { useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  formatMonthYear,
} from '@/lib/utils'
import type { CalendarEvent, CalendarView as ViewType, User } from '@/types'

const VIEW_MODES: ViewType[] = ['day', 'week', 'month', 'agenda']

/**
 * Event Card Component for Day/Week views
 * Displays a single event in the calendar grid with absolute positioning
 */
interface EventCardProps {
  event: CalendarEvent
  onClick: () => void
  hourHeight?: number
  startHour?: number
  locale?: string
  tooltipPosition?: 'side' | 'top'
  currentDate: Date
  users?: User[]
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  hourHeight = 60,
  startHour = 0,
  locale = 'en-US',
  tooltipPosition = 'side',
  currentDate,
  users = [],
}) => {
  const { t } = useTranslation()
  const categoryConfig = getCategoryConfig(event.category)

  // Helper to format assignee name
  const getDisplayName = () => {
    if (!event.assigneeId) return event.title
    const user = users.find((u) => u.id === event.assigneeId)
    if (!user) return event.title

    const fullName = user.name || (user as unknown as { full_name?: string }).full_name || ''
    if (!fullName) return event.title

    const parts = fullName.trim().split(/\s+/)
    const firstName = parts[0]
    if (parts.length === 1) return firstName

    const lastName = parts[parts.length - 1]
    // If "First Last" is longer than 12 chars, use "First L."
    if (`${firstName} ${lastName}`.length > 12) {
      return `${firstName} ${lastName.charAt(0)}.`
    }
    return `${firstName} ${lastName}`
  }

  const displayName = getDisplayName()

  const dayStart = new Date(currentDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(currentDate)
  dayEnd.setHours(23, 59, 59, 999)

  const effectiveStart = event.startTime < dayStart ? dayStart : event.startTime
  const effectiveEnd = event.endTime > dayEnd ? dayEnd : event.endTime

  const top = calculateEventTop(effectiveStart, hourHeight, startHour)
  const height = calculateEventHeight(effectiveStart, effectiveEnd, hourHeight)

  return (
    <div
      onClick={onClick}
      className="group absolute left-1 right-1 z-10 cursor-pointer rounded-md px-2 py-1.5 text-xs transition-all duration-200 hover:z-50 hover:shadow-xl hover:brightness-105"
      style={{
        top: `${top}px`,
        height: `${Math.max(height - 2, 24)}px`,
        backgroundColor: categoryConfig.bgColor,
        borderLeft: `3px solid ${categoryConfig.color}`,
      }}
    >
      {/* Event title */}
      <div style={{ color: categoryConfig.color }}>{displayName}</div>

      {/* Event time (only show if height allows) */}
      {height > 35 && (
        <div className="mt-0.5 text-[10px] text-muted-foreground">
          {formatTimeRange(event.startTime, event.endTime, locale)}
        </div>
      )}

      {/* Event location (only show if height allows) */}
      {height > 50 && event.location && (
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{event.location}</span>
        </div>
      )}

      {/* Hover Information Popup */}
      <div
        className={cn(
          'absolute hidden w-64 p-4 group-hover:block',
          'z-[100] rounded-xl border border-border bg-background/95 shadow-2xl backdrop-blur-md',
          'pointer-events-none duration-200 animate-in fade-in',
          tooltipPosition === 'top'
            ? 'bottom-full left-1/2 mb-2 -translate-x-1/2 slide-in-from-bottom-2'
            : 'left-full top-0 ml-2 zoom-in-95',
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <span
            className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: categoryConfig.bgColor, color: categoryConfig.color }}
          >
            {t(categoryConfig.label)}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
            {event.startTime.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <h4 className="mb-1 text-sm font-bold leading-tight text-foreground">{event.title}</h4>

        <div className="mb-3 flex flex-col gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: categoryConfig.color }}
            />
            {formatTimeRange(event.startTime, event.endTime, locale)}
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-primary" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="mt-2 border-t border-border pt-2">
            <p className="text-[11px] italic leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Event Card Component for Month view
 * Compact event display for the monthly calendar grid
 */
interface MonthEventCardProps {
  event: CalendarEvent
  onClick: (e: React.MouseEvent) => void
  locale?: string
}

const MonthEventCard: React.FC<MonthEventCardProps> = ({ event, onClick, locale = 'en-US' }) => {
  const { t } = useTranslation()
  const categoryConfig = getCategoryConfig(event.category)

  return (
    <div className="group relative">
      <div
        onClick={onClick}
        className="cursor-pointer truncate rounded px-1.5 py-0.5 text-[10px] transition-all duration-150 hover:brightness-110"
        style={{
          backgroundColor: categoryConfig.bgColor,
          color: categoryConfig.color,
        }}
      >
        {event.startTime.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}{' '}
        {event.title}
      </div>

      {/* Hover Information Popup */}
      <div className="pointer-events-none absolute bottom-full left-0 z-[100] mb-1 hidden w-64 rounded-xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-md duration-200 animate-in fade-in slide-in-from-bottom-1 group-hover:block">
        <div className="mb-2 flex items-center justify-between">
          <span
            className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: categoryConfig.bgColor, color: categoryConfig.color }}
          >
            {t(categoryConfig.label)}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
            {event.startTime.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <h4 className="mb-1 text-sm font-bold leading-tight text-foreground">{event.title}</h4>

        <div className="mb-3 flex flex-col gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: categoryConfig.color }}
            />
            {formatTimeRange(event.startTime, event.endTime, locale)}
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-primary" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="mt-2 border-t border-border pt-2">
            <p className="text-[11px] italic leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * DAY VIEW COMPONENT
 * Shows a single day with hourly time slots
 */
interface DayViewProps {
  selectedDate: Date
  events: CalendarEvent[]
  users: User[]
  onEventClick: (event: CalendarEvent) => void
}

const DayView: React.FC<DayViewProps> = ({ selectedDate, events, users, onEventClick }) => {
  const { settings, preferences } = useWorkspace()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const startHour = settings.business_hours?.start ?? 0
  const endHour = settings.business_hours?.end ?? 23
  const timeSlots = useMemo(() => generateTimeSlots(startHour, endHour), [startHour, endHour])
  const HOUR_HEIGHT = preferences.calendar_density === 'compact' ? 40 : 60
  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US'

  useEffect(() => {
    if (scrollContainerRef.current && isToday(selectedDate)) {
      const now = new Date()
      if (now.getHours() >= startHour && now.getHours() <= endHour) {
        const scrollPosition = (now.getHours() - startHour - 1) * HOUR_HEIGHT
        scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition)
      }
    }
  }, [selectedDate, startHour, endHour, HOUR_HEIGHT])

  const dayEvents = useMemo(() => {
    const dayStart = new Date(selectedDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(selectedDate)
    dayEnd.setHours(23, 59, 59, 999)

    return events.filter((event) => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      return eventStart <= dayEnd && eventEnd >= dayStart
    })
  }, [events, selectedDate])

  return (
    <div ref={scrollContainerRef} className="scrollbar-dark flex-1 overflow-y-auto">
      <div className="flex min-h-full">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r border-border bg-sidebar">
          <div className="h-4 border-b border-border" />
          <div className="h-4 border-b border-border" />
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="relative border-b border-border"
            >
              <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground">
                {slot.label}
              </span>
            </div>
          ))}
        </div>

        {/* Day column with events */}
        <div className="relative flex-1">
          <div className="h-4 border-b border-border" />

          {/* Current time indicator */}
          {isToday(selectedDate) && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-20"
              style={{
                top: `calc(1rem + ${(new Date().getHours() - startHour + new Date().getMinutes() / 60) * HOUR_HEIGHT}px)`,
              }}
            >
              <div className="flex items-center">
                <div className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
                <div className="h-px flex-1 bg-red-500" />
              </div>
            </div>
          )}

          {/* Hour grid lines */}
          {timeSlots.map((_, index) => (
            <div
              key={index}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="border-b border-border"
            />
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
  )
}

/**
 * WEEK VIEW COMPONENT
 * Shows 7 days with hourly time slots
 */
interface WeekViewProps {
  selectedDate: Date
  selectedEndDate?: Date | null
  events: CalendarEvent[]
  users: User[]
  onEventClick: (event: CalendarEvent) => void
}

const WeekView: React.FC<WeekViewProps> = ({
  selectedDate,
  selectedEndDate,
  events,
  users,
  onEventClick,
}) => {
  const { settings, preferences } = useWorkspace()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const startHour = settings.business_hours?.start ?? 0
  const endHour = settings.business_hours?.end ?? 23
  const timeSlots = useMemo(() => generateTimeSlots(startHour, endHour), [startHour, endHour])
  const HOUR_HEIGHT = preferences.calendar_density === 'compact' ? 40 : 60
  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US'

  const weekDays = useMemo(() => {
    if (selectedEndDate) {
      const days = []
      const current = new Date(selectedDate)
      while (current <= selectedEndDate) {
        days.push({
          date: new Date(current),
          name: current.toLocaleDateString(locale, { weekday: 'short' }),
          dayOfMonth: current.getDate(),
          isToday: isToday(current),
          isWeekend: current.getDay() === 0 || current.getDay() === 6,
        })
        current.setDate(current.getDate() + 1)
      }
      return days
    }
    const weekStart = getStartOfWeek(selectedDate, settings.week_start)
    return generateWeekDays(weekStart, locale)
  }, [selectedDate, selectedEndDate, settings.week_start, locale])

  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date()
      if (now.getHours() >= startHour && now.getHours() <= endHour) {
        const scrollPosition = (now.getHours() - startHour - 1) * HOUR_HEIGHT
        scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition)
      }
    }
  }, [startHour, endHour, HOUR_HEIGHT])

  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    return events.filter((event) => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      return eventStart <= dayEnd && eventEnd >= dayStart
    })
  }

  return (
    <div ref={scrollContainerRef} className="scrollbar-dark flex-1 overflow-y-auto">
      <div className="flex min-h-full">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r border-border bg-sidebar">
          <div className="h-4 border-b border-border" />
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="relative border-b border-border"
            >
              <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground">
                {slot.label}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns with events */}
        <div
          className="relative grid flex-1 divide-x divide-border"
          style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(0, 1fr))` }}
        >
          {/* Current time indicator */}
          {weekDays.some((day) => day.isToday) && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-20"
              style={{
                top: `calc(1rem + ${(new Date().getHours() - startHour + new Date().getMinutes() / 60) * HOUR_HEIGHT}px)`,
              }}
            >
              <div className="flex items-center">
                <div className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
                <div className="h-px flex-1 bg-red-500" />
              </div>
            </div>
          )}

          {/* Grid lines and events for each day */}
          {weekDays.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={cn(
                'relative border-r border-border last:border-r-0',
                day.isWeekend && 'bg-muted/50 dark:bg-[#0F1115]',
              )}
            >
              <div className="h-4 border-b border-border" />

              {/* Hour grid lines */}
              {timeSlots.map((_, hourIndex) => (
                <div
                  key={hourIndex}
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  className="border-b border-border"
                />
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
  )
}

/**
 * MONTH VIEW COMPONENT
 * Shows a full month in a grid layout
 */
interface MonthViewProps {
  selectedDate: Date
  events: CalendarEvent[]
  users: User[]
  onEventClick: (event: CalendarEvent) => void
  onDateChange: (date: Date) => void
}

const MonthView: React.FC<MonthViewProps> = ({
  selectedDate,
  events,
  onEventClick,
  onDateChange,
}) => {
  const { settings } = useWorkspace()
  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US'

  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    const startDayOfWeek = firstDayOfMonth.getDay()
    const diffToStart =
      (startDayOfWeek < settings.week_start ? 7 : 0) + startDayOfWeek - settings.week_start

    const daysInMonth = lastDayOfMonth.getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: Array<{
      date: Date
      dayOfMonth: number
      isCurrentMonth: boolean
      isToday: boolean
      events: CalendarEvent[]
    }> = []

    for (let i = diffToStart - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({
        date,
        dayOfMonth: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: isToday(date),
        events: events.filter((e) => isSameDay(e.startTime, date)),
      })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: isToday(date),
        events: events.filter((e) => isSameDay(e.startTime, date)),
      })
    }

    const remainingCells = 42 - days.length
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: isToday(date),
        events: events.filter((e) => isSameDay(e.startTime, date)),
      })
    }

    return days
  }, [selectedDate, events, settings.week_start])

  const dayLabels =
    settings.week_start === 1
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="scrollbar-dark flex-1 overflow-y-auto p-4">
      {/* Day labels */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayLabels.map((label, index) => (
          <div key={index} className="py-2 text-center text-xs font-medium text-muted-foreground">
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
              'min-h-[100px] cursor-pointer rounded-lg border p-2 transition-all duration-150',
              'hover:border-primary/50',
              day.isCurrentMonth ? 'border-border bg-muted' : 'border-border bg-background',
              isSameDay(day.date, selectedDate) && 'ring-2 ring-primary',
            )}
          >
            {/* Day number */}
            <div
              className={cn(
                'mb-1 text-sm font-medium',
                day.isToday
                  ? 'flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white'
                  : day.isCurrentMonth
                    ? 'text-foreground'
                    : 'text-muted-foreground',
              )}
            >
              {day.dayOfMonth}
            </div>

            {/* Events for this day */}
            <div className="space-y-1">
              {day.events.slice(0, 3).map((event) => (
                <MonthEventCard
                  key={event.id}
                  event={event}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    onEventClick(event)
                  }}
                  locale={locale}
                />
              ))}
              {day.events.length > 3 && (
                <div className="pl-1 text-[10px] text-muted-foreground">
                  +{day.events.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * AGENDA VIEW COMPONENT
 * Shows events in a chronological list
 */
interface AgendaViewProps {
  events: CalendarEvent[]
  users: User[]
  onEventClick: (event: CalendarEvent) => void
}

const AgendaView: React.FC<AgendaViewProps> = ({ events, onEventClick }) => {
  const { settings } = useWorkspace()
  const { t } = useTranslation()
  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US'

  const groupedEvents = useMemo(() => {
    const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    const groups: Array<{
      date: Date
      dateLabel: string
      isToday: boolean
      events: CalendarEvent[]
    }> = []

    sortedEvents.forEach((event) => {
      const existingGroup = groups.find((g) => isSameDay(g.date, event.startTime))
      if (existingGroup) {
        existingGroup.events.push(event)
      } else {
        const isEventToday = isToday(event.startTime)
        groups.push({
          date: event.startTime,
          dateLabel: isEventToday
            ? t('common.today')
            : event.startTime.toLocaleDateString(locale, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }),
          isToday: isEventToday,
          events: [event],
        })
      }
    })

    return groups
  }, [events, locale, t])

  return (
    <div className="scrollbar-dark flex-1 overflow-y-auto p-4">
      {groupedEvents.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
          <CalendarIcon className="mb-4 h-12 w-12 opacity-50" />
          <p className="text-lg">No upcoming events</p>
          <p className="text-sm">Your scheduled events will appear here</p>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-6">
          {groupedEvents.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date header */}
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 flex-col items-center justify-center rounded-lg text-xs',
                    group.isToday ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <span className="text-[10px] uppercase">
                    {group.date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="font-bold">{group.date.getDate()}</span>
                </div>
                <h3
                  className={cn(
                    'text-lg font-medium',
                    group.isToday ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {group.dateLabel}
                </h3>
              </div>

              {/* Events for this date */}
              <div className="ml-12 space-y-2">
                {group.events.map((event) => {
                  const categoryConfig = getCategoryConfig(event.category)
                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-muted p-3 transition-all duration-150 hover:border-primary/50"
                    >
                      {/* Time */}
                      <div className="w-20 flex-shrink-0 text-right">
                        <div className="text-sm font-medium text-foreground">
                          {event.startTime.toLocaleTimeString(locale, {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.endTime.toLocaleTimeString(locale, {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </div>
                      </div>

                      {/* Category indicator */}
                      <div
                        className="h-10 w-1 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: categoryConfig.color }}
                      />

                      {/* Event details */}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-foreground">{event.title}</div>
                        {event.description && (
                          <div className="truncate text-sm text-muted-foreground">
                            {event.description}
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="flex flex-shrink-0 items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}

                      {/* Category badge */}
                      <span
                        className="flex-shrink-0 rounded px-2 py-1 text-xs"
                        style={{
                          backgroundColor: categoryConfig.bgColor,
                          color: categoryConfig.color,
                        }}
                      >
                        {t(categoryConfig.label)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Main CalendarView Component
 * Renders the appropriate view based on the current view mode
 */
interface CalendarViewProps {
  selectedDate: Date
  selectedEndDate?: Date | null
  view: ViewType
  events: CalendarEvent[]
  users: User[]
  onDateChange: (date: Date) => void
  onViewChange: (view: ViewType) => void
  onEventClick: (event: CalendarEvent) => void
  onNext: () => void
  onPrevious: () => void
  onToday: () => void
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
  const { settings } = useWorkspace()
  const { t } = useTranslation()
  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US'

  const weekDays = useMemo(() => {
    if (selectedEndDate && view === 'week') {
      const days = []
      const current = new Date(selectedDate)
      while (current <= selectedEndDate) {
        days.push({
          date: new Date(current),
          name: current.toLocaleDateString(locale, { weekday: 'short' }),
          dayOfMonth: current.getDate(),
          isToday: isToday(current),
          isWeekend: current.getDay() === 0 || current.getDay() === 6,
        })
        current.setDate(current.getDate() + 1)
      }
      return days
    }
    const weekStart = getStartOfWeek(selectedDate, settings.week_start)
    return generateWeekDays(weekStart, locale)
  }, [selectedDate, selectedEndDate, view, settings.week_start, locale])

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
          year: 'numeric',
        })

      case 'week': {
        const start = weekDays[0].date
        const end = weekDays[weekDays.length - 1].date
        if (start.getMonth() === end.getMonth()) {
          return `${start.toLocaleDateString(locale, { month: 'long' })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`
        } else if (start.getFullYear() === end.getFullYear()) {
          return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`
        } else {
          return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`
        }
      }

      case 'month':
        return formatMonthYear(selectedDate, locale)

      case 'agenda':
        return t('scheduler.upcoming_events')

      default:
        return ''
    }
  }

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
        )

      case 'week':
        return (
          <WeekView
            selectedDate={selectedDate}
            selectedEndDate={selectedEndDate}
            events={events}
            users={users}
            onEventClick={onEventClick}
          />
        )

      case 'month':
        return (
          <MonthView
            selectedDate={selectedDate}
            events={events}
            users={users}
            onEventClick={onEventClick}
            onDateChange={onDateChange}
          />
        )

      case 'agenda':
        return <AgendaView events={events} users={users} onEventClick={onEventClick} />

      default:
        return null
    }
  }

  /**
   * Render the appropriate header based on view mode
   */
  const renderHeader = () => {
    if (view === 'month') {
      return null
    }

    if (view === 'agenda') {
      return null
    }

    if (view === 'day') {
      // Day view shows single day header
      return (
        <div
          className="scrollbar-dark flex overflow-y-scroll border-b border-border"
          style={{ scrollbarColor: 'transparent transparent' }}
        >
          <div className="w-16 flex-shrink-0 border-r border-border" />
          <div className="flex-1 px-2 py-3 text-center">
            <div
              className={cn(
                'text-xs uppercase tracking-wider',
                isToday(selectedDate) ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {selectedDate.toLocaleDateString(locale, { weekday: 'long' })}
            </div>
            <div
              className={cn(
                'mt-1 text-lg font-semibold',
                isToday(selectedDate)
                  ? 'mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white'
                  : 'text-foreground',
              )}
            >
              {selectedDate.getDate()}
            </div>
          </div>
        </div>
      )
    }

    // Week view - show dynamic days
    return (
      <div
        className="scrollbar-dark flex overflow-y-scroll border-b border-border"
        style={{ scrollbarColor: 'transparent transparent' }}
      >
        <div className="w-16 flex-shrink-0 border-r border-border bg-sidebar">
          <div className="h-4 border-b border-border" />
        </div>
        <div
          className="grid flex-1 divide-x divide-border"
          style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(0, 1fr))` }}
        >
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                'border-r border-border px-2 py-3 text-center last:border-r-0',
                day.isWeekend && 'bg-muted/50 dark:bg-[#0F1115]',
              )}
            >
              <div
                className={cn(
                  'text-xs uppercase tracking-wider',
                  day.isToday ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {day.name}
              </div>
              <div
                className={cn(
                  'mt-1 text-lg font-semibold',
                  day.isToday
                    ? 'mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white'
                    : 'text-foreground',
                )}
              >
                {day.dayOfMonth}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        {/* Left side - Navigation and date display */}
        <div className="flex items-center gap-4">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevious}
              className="rounded-md p-2 transition-colors hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={onToday}
              className="rounded-md px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
            >
              {t('common.today')}
            </button>
            <button onClick={onNext} className="rounded-md p-2 transition-colors hover:bg-muted">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Date display */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-foreground">{formatDateRange()}</span>
          </div>
        </div>

        {/* Right side - View mode selector */}
        <div className="flex items-center rounded-lg bg-secondary p-1">
          {VIEW_MODES.map((modeId) => (
            <button
              key={modeId}
              onClick={() => onViewChange(modeId)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-all duration-150',
                view === modeId
                  ? 'bg-primary/80 text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {t(`scheduler.views.${modeId}`)}
            </button>
          ))}
        </div>
      </div>

      {/* View-specific header (day/week column headers) */}
      {renderHeader()}

      {/* Main content - renders the active view */}
      {renderView()}
    </div>
  )
}

export default CalendarView
