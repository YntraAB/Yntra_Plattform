import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useWorkspaceTeams, useWorkspaceUsers } from '@/hooks/queries/useWorkspaceData';
import { getCategoryConfig } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, AlignLeft, Tag, Users, User, Trash2, Edit2 } from 'lucide-react';

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose, onEdit, onDelete }) => {
  const { settings, workspaceId } = useWorkspace();
  const { t } = useTranslation();

  const { data: dbTeams = [] } = useWorkspaceTeams(workspaceId);
  const { data: dbUsers = [] } = useWorkspaceUsers(workspaceId);

  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US';

  if (!event) return null;

  const eventTeam = dbTeams.find(t => t.id === event.teamId);
  const eventAssignee = dbUsers.find(u => u.id === event.assigneeId);
  const category = getCategoryConfig(event.category);

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border bg-card shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: category.color }} />
            <DialogTitle className="text-lg font-semibold text-foreground">
              {event.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Time & Date */}
          <div className="flex items-start gap-4">
            <div className="mt-1 p-2 bg-muted/50 rounded-lg">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {event.startTime.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {event.startTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - {' '}
                {event.endTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-muted/50 rounded-lg">
                <AlignLeft className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                {event.description}
              </p>
            </div>
          )}

          {/* Category */}
          <div className="flex items-start gap-4">
            <div className="mt-1 p-2 bg-muted/50 rounded-lg">
              <Tag className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="pt-1">
              <span 
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide shadow-sm"
                style={{ backgroundColor: category.bgColor, color: category.color }}
              >
                {category.label}
              </span>
            </div>
          </div>

          {/* Team */}
          {eventTeam && (
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-muted/50 rounded-lg">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="pt-1.5 text-sm text-foreground font-medium">
                {eventTeam.name}
              </div>
            </div>
          )}

          {/* Assistant */}
          {eventAssignee && (
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-muted/50 rounded-lg">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="pt-1.5 text-sm text-muted-foreground">
                {t('scheduler.assigned_to', { defaultValue: 'Tilldelad' })}: {' '}
                <span className="font-semibold text-foreground">
                  {eventAssignee.full_name || eventAssignee.name}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 gap-3">
          <Button
            variant="ghost"
            onClick={() => onDelete?.(event.id)}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-9"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('common.delete')}
          </Button>
          <Button
            onClick={() => onEdit?.(event)}
            className="bg-primary hover:bg-primary/90 text-white h-9 shadow-lg shadow-primary/20"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {t('common.edit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
