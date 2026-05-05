/**
 * This is the main calendar/scheduler view component with support for
 * multiple view modes: Day, Week, Month, and Agenda.
 *
 * Each view mode provides a different perspective on the scheduled events,
 * allowing users to choose the most appropriate view for their needs.
 */

import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Pencil
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers'
import {
  formatTimeRange,
  generateWeekDays,
  getStartOfWeek,
  isToday,
  getCategoryConfig,
  formatMonthYear,
} from '@/lib/utils'
import type { CalendarEvent, CalendarView as ViewType, User } from '@/types'
import { DayView } from './calendar/DayView'
import { WeekView } from './calendar/WeekView'
import { MonthView } from './calendar/MonthView'
import { AgendaView } from './calendar/AgendaView'
import { UnscheduledBucket } from './calendar/UnscheduledBucket'

const VIEW_MODES: ViewType[] = ['day', 'week', 'month', 'agenda']

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
  onEventUpdate: (eventId: string, updates: Partial<CalendarEvent>) => void
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
  onEventUpdate,
  onNext,
  onPrevious,
  onToday,
}) => {
  const { settings, preferences } = useWorkspace()
  const [editMode, setEditMode] = React.useState(false)
  const [activeEvent, setActiveEvent] = React.useState<CalendarEvent | null>(null)
  const [currentDragTime, setCurrentDragTime] = React.useState<Date | null>(null)
  const [zoomLevel, setZoomLevel] = React.useState(preferences.calendar_density === 'compact' ? 40 : 60)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Hantera CTRL + Scroll & CTRL + +/- för zoom
  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        setZoomLevel(prev => {
          const delta = e.deltaY > 0 ? -10 : 10
          return Math.max(40, Math.min(160, prev + delta))
        })
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '+' || e.key === '=' || e.key === '-')) {
        e.preventDefault()
        setZoomLevel(prev => {
          const delta = e.key === '-' ? -10 : 10
          return Math.max(40, Math.min(160, prev + delta))
        })
      }
    }

    document.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('wheel', handleWheel)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const { t } = useTranslation()
  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US'
  const startHour = settings.business_hours?.start ?? 0
  const HOUR_HEIGHT = zoomLevel

  const unscheduledEvents = useMemo(() => {
    return events.filter(e => e.isUnscheduled)
  }, [events])

  const gridEvents = useMemo(() => {
    return events.filter(e => !e.isUnscheduled)
  }, [events])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const draggedEvent = active.data.current?.event as CalendarEvent
    setActiveEvent(draggedEvent)
    setCurrentDragTime(draggedEvent.startTime)
  }

  const handleDragMove = (event: any) => {
    const { delta, over, active } = event
    if (!over || !activeEvent) return

    const dropData = over.data.current
    if (dropData?.type === 'column') {
      const dropDate = dropData.date as Date
      let newStartTime = new Date(dropDate)

      if (active.data.current?.isFromBucket) {
        newStartTime.setHours(startHour, 0, 0, 0)
      } else {
        const minutesDelta = (delta.y / HOUR_HEIGHT) * 60
        const snappedMinutesDelta = Math.round(minutesDelta / 15) * 15
        newStartTime = new Date(activeEvent.startTime.getTime() + snappedMinutesDelta * 60 * 1000)
        newStartTime.setFullYear(dropDate.getFullYear(), dropDate.getMonth(), dropDate.getDate())
      }
      setCurrentDragTime(newStartTime)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveEvent(null)
    setCurrentDragTime(null)
    const { active, over } = event

    if (!over) return

    const draggedEvent = active.data.current?.event as CalendarEvent
    const dropData = over.data.current

    if (dropData?.type === 'column') {
      const dropDate = dropData.date as Date
      const { y } = event.delta

      let newStartTime = new Date(dropDate)
      let duration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime()

      if (active.data.current?.isFromBucket) {
        newStartTime.setHours(startHour, 0, 0, 0)
      } else {
        const minutesDelta = (y / HOUR_HEIGHT) * 60
        const snappedMinutesDelta = Math.round(minutesDelta / 15) * 15
        newStartTime = new Date(draggedEvent.startTime.getTime() + snappedMinutesDelta * 60 * 1000)
        newStartTime.setFullYear(dropDate.getFullYear(), dropDate.getMonth(), dropDate.getDate())
      }

      const newEndTime = new Date(newStartTime.getTime() + duration)

      onEventUpdate(draggedEvent.id, {
        startTime: newStartTime,
        endTime: newEndTime,
        isUnscheduled: false
      })
    }
  }

  const handleResize = (event: CalendarEvent, updates: Partial<CalendarEvent>) => {
    onEventUpdate(event.id, updates)
  }

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
            events={gridEvents}
            users={users}
            onEventClick={onEventClick}
            editMode={editMode}
            onResize={handleResize}
            hourHeight={HOUR_HEIGHT}
          />
        )

      case 'week':
        return (
          <WeekView
            selectedDate={selectedDate}
            selectedEndDate={selectedEndDate}
            events={gridEvents}
            users={users}
            onEventClick={onEventClick}
            editMode={editMode}
            onResize={handleResize}
            hourHeight={HOUR_HEIGHT}
          />
        )

      case 'month':
        return (
          <MonthView
            selectedDate={selectedDate}
            events={gridEvents}
            users={users}
            onEventClick={onEventClick}
            onDateChange={onDateChange}
          />
        )

      case 'agenda':
        return <AgendaView events={gridEvents} users={users} onEventClick={onEventClick} />

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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToFirstScrollableAncestor]}
    >
      <div className="flex h-full flex-1 overflow-hidden bg-background">
        <UnscheduledBucket events={unscheduledEvents} editMode={editMode} />

        <div className="flex flex-col flex-1 min-w-0">
          {/* Header Toolbar */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-background/95 backdrop-blur-sm z-50 sticky top-0">
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
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {t('common.today')}
                </button>
                <button onClick={onNext} className="rounded-md p-2 transition-colors hover:bg-muted">
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Date display */}
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">{formatDateRange()}</span>
              </div>
            </div>

            {/* Right side - Edit Mode & View mode selector */}
            <div className="flex items-center gap-4">


              {/* Edit Mode Toggle */}
              <button
                onClick={() => setEditMode(!editMode)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                  editMode
                    ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105"
                    : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Pencil className={cn("h-4 w-4", editMode && "animate-pulse")} />
                {editMode ? t('scheduler.exit_edit_mode') : t('scheduler.edit_mode')}
              </button>

              <div className="flex items-center rounded-lg bg-secondary p-1">
                {VIEW_MODES.map((modeId) => (
                  <button
                    key={modeId}
                    onClick={() => onViewChange(modeId)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150',
                      view === modeId
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {t(`scheduler.views.${modeId}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* View-specific header (day/week column headers) */}
          <div className="sticky top-[61px] z-40 bg-background/95 backdrop-blur-sm">
            {renderHeader()}
          </div>

          {/* Main content - renders the active view */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {renderView()}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeEvent ? (
          <div
            className="rounded-md px-3 py-2 text-xs shadow-2xl brightness-110 pointer-events-none scale-105 transition-transform bg-background/80 backdrop-blur-md border border-primary/50 flex flex-col gap-1"
            style={{
              width: '220px',
              borderLeft: `4px solid ${getCategoryConfig(activeEvent.category).color}`,
            }}
          >
            <div className="font-bold text-foreground flex items-center justify-between">
              <span className="truncate">{activeEvent.title}</span>
              {currentDragTime && (
                <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px]">
                  {currentDragTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {currentDragTime && formatTimeRange(currentDragTime, new Date(currentDragTime.getTime() + (activeEvent.endTime.getTime() - activeEvent.startTime.getTime())), locale)}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default CalendarView
