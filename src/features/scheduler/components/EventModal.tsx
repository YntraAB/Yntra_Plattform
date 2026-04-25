import React from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useWorkspaceTeams, useWorkspaceUsers } from '@/hooks/queries/useWorkspaceData'
import { getCategoryConfig } from '@/lib/utils'
import type { CalendarEvent } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock, AlignLeft, Tag, Users, User, Trash2, Edit2 } from 'lucide-react'

interface EventModalProps {
  event: CalendarEvent | null
  onClose: () => void
  onEdit?: (event: CalendarEvent) => void
  onDelete?: (eventId: string) => void
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose, onEdit, onDelete }) => {
  const { settings, workspaceId } = useWorkspace()
  const { t } = useTranslation()

  const { data: dbTeams = [] } = useWorkspaceTeams(workspaceId)
  const { data: dbUsers = [] } = useWorkspaceUsers(workspaceId)

  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US'

  if (!event) return null

  const eventTeam = dbTeams.find((t) => t.id === event.teamId)
  const eventAssignee = dbUsers.find((u) => u.id === event.assigneeId)
  const category = getCategoryConfig(event.category)

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden border-border bg-card p-0 shadow-2xl sm:max-w-md">
        <DialogHeader className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full shadow-sm"
              style={{ backgroundColor: category.color }}
            />
            <DialogTitle className="text-lg font-semibold text-foreground">
              {event.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 p-6">
          {/* Time & Date */}
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-lg bg-muted/50 p-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {event.startTime.toLocaleDateString(locale, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {event.startTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}{' '}
                - {event.endTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-lg bg-muted/50 p-2">
                <AlignLeft className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
                {event.description}
              </p>
            </div>
          )}

          {/* Category */}
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-lg bg-muted/50 p-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="pt-1">
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide shadow-sm"
                style={{ backgroundColor: category.bgColor, color: category.color }}
              >
                {category.label}
              </span>
            </div>
          </div>

          {/* Team */}
          {eventTeam && (
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-lg bg-muted/50 p-2">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="pt-1.5 text-sm font-medium text-foreground">{eventTeam.name}</div>
            </div>
          )}

          {/* Assistant */}
          {eventAssignee && (
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-lg bg-muted/50 p-2">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="pt-1.5 text-sm text-muted-foreground">
                {t('scheduler.assigned_to', { defaultValue: 'Tilldelad' })}:{' '}
                <span className="font-semibold text-foreground">
                  {eventAssignee.full_name || eventAssignee.name}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onDelete?.(event.id)}
            className="h-9 text-red-500 hover:bg-red-500/10 hover:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
          <Button
            onClick={() => onEdit?.(event)}
            className="h-9 bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            {t('common.edit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
