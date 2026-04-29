import React, { useMemo, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { cn, generateTimeSlots, isToday } from '@/lib/utils'
import type { CalendarEvent, User } from '@/types'
import { EventCard } from './EventCard'

interface DayViewProps {
  selectedDate: Date
  events: CalendarEvent[]
  users: User[]
  onEventClick: (event: CalendarEvent) => void
  editMode?: boolean
  onResize?: (event: CalendarEvent, updates: Partial<CalendarEvent>) => void
  hourHeight: number
}

export const DayView: React.FC<DayViewProps> = React.memo(({
  selectedDate,
  events,
  users,
  onEventClick,
  editMode,
  onResize,
  hourHeight
}) => {
  const { settings } = useWorkspace()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${selectedDate.toISOString()}`,
    data: { type: 'column', date: selectedDate }
  })

  const startHour = settings.business_hours?.start ?? 0
  const endHour = settings.business_hours?.end ?? 23
  const timeSlots = useMemo(() => generateTimeSlots(startHour, endHour), [startHour, endHour])
  const HOUR_HEIGHT = hourHeight
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
        <div ref={setNodeRef} className={cn("relative flex-1", editMode && isOver && "bg-primary/5")}>
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

          {/* Hour grid lines with 15-min sub-lines */}
          {timeSlots.map((_, index) => (
            <div
              key={index}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="border-b border-border relative group"
            >
              {/* Sub-hour lines (15, 30, 45 mins) */}
              <div className="absolute top-[25%] left-0 right-0 border-b border-border/10 dark:border-white/[0.03] pointer-events-none" />
              <div className="absolute top-[50%] left-0 right-0 border-b border-border/20 dark:border-white/[0.05] border-dashed pointer-events-none" />
              <div className="absolute top-[75%] left-0 right-0 border-b border-border/10 dark:border-white/[0.03] pointer-events-none" />
            </div>
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
                editMode={editMode}
                onResize={onResize}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

DayView.displayName = 'DayView'
