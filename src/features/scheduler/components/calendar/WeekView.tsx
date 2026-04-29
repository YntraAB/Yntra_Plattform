import React, { useMemo, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import {
  cn,
  generateTimeSlots,
  generateWeekDays,
  getStartOfWeek,
  isToday,
} from '@/lib/utils'
import type { CalendarEvent, User } from '@/types'
import { EventCard } from './EventCard'

interface WeekViewProps {
  selectedDate: Date
  selectedEndDate?: Date | null
  events: CalendarEvent[]
  users: User[]
  onEventClick: (event: CalendarEvent) => void
  editMode?: boolean
  onResize?: (event: CalendarEvent, updates: Partial<CalendarEvent>) => void
  hourHeight: number
}

export const WeekView: React.FC<WeekViewProps> = React.memo(({
  selectedDate,
  selectedEndDate,
  events,
  users,
  onEventClick,
  editMode,
  onResize,
  hourHeight,
}) => {
  const { settings } = useWorkspace()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const startHour = settings.business_hours?.start ?? 0
  const endHour = settings.business_hours?.end ?? 23
  const timeSlots = useMemo(() => generateTimeSlots(startHour, endHour), [startHour, endHour])
  const HOUR_HEIGHT = hourHeight
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

              {/* Hour grid lines with 15-min sub-lines */}
              {timeSlots.map((_, hourIndex) => (
                <div
                  key={hourIndex}
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  className="border-b border-border relative"
                >
                  {/* Sub-hour lines (15, 30, 45 mins) */}
                  <div className="absolute top-[25%] left-0 right-0 border-b border-border/10 dark:border-white/[0.03] pointer-events-none" />
                  <div className="absolute top-[50%] left-0 right-0 border-b border-border/20 dark:border-white/[0.05] border-dashed pointer-events-none" />
                  <div className="absolute top-[75%] left-0 right-0 border-b border-border/10 dark:border-white/[0.03] pointer-events-none" />
                </div>
              ))}

              {/* Events for this day */}
              <DroppableWeekColumn
                date={day.date}
                editMode={editMode || false}
              >
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
                    editMode={editMode}
                    onResize={onResize}
                  />
                ))}
              </DroppableWeekColumn>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

const DroppableWeekColumn: React.FC<{ date: Date, editMode: boolean, children: React.ReactNode }> = ({ date, editMode, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${date.toISOString()}`,
    data: { type: 'column', date }
  })

  return (
    <div ref={setNodeRef} className={cn("absolute inset-x-0 bottom-0 top-4", editMode && isOver && "bg-primary/5")}>
      {children}
    </div>
  )
}

WeekView.displayName = 'WeekView'
