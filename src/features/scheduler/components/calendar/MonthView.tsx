import React, { useMemo } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { cn, isSameDay, isToday } from '@/lib/utils'
import type { CalendarEvent, User } from '@/types'
import { MonthEventCard } from './MonthEventCard'

interface MonthViewProps {
  selectedDate: Date
  events: CalendarEvent[]
  users: User[]
  onEventClick: (event: CalendarEvent) => void
  onDateChange: (date: Date) => void
}

export const MonthView: React.FC<MonthViewProps> = React.memo(({
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
})

MonthView.displayName = 'MonthView'
