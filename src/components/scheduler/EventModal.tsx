import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useWorkspaceTeams, useWorkspaceUsers } from '@/hooks/queries/useWorkspaceData';
import type { CalendarEvent } from '@/types';

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose, onEdit, onDelete }) => {
  const { settings, workspaceId } = useWorkspace();
  const { t } = useTranslation();
  
  // Use data hooks instead of direct Supabase calls
  const { data: dbTeams = [] } = useWorkspaceTeams(workspaceId);
  const { data: dbUsers = [] } = useWorkspaceUsers(workspaceId);

  const locale = settings.language === 'sv' ? 'sv-SE' : 'en-US';
  
  if (!event) return null;

  // Find team and assignee names from cached data
  const eventTeam = dbTeams.find(t => t.id === event.teamId);
  const eventAssignee = dbUsers.find(u => u.id === event.assigneeId);

  const categoryConfig = {
    meeting: { label: 'Meeting', color: 'bg-violet-500' },
    task: { label: 'Task', color: 'bg-blue-500' },
    reminder: { label: 'Reminder', color: 'bg-amber-500' },
    planning: { label: 'Planning', color: 'bg-emerald-500' },
    exam: { label: 'Exam', color: 'bg-red-500' },
    personal: { label: 'Personal', color: 'bg-pink-500' },
    other: { label: 'Other', color: 'bg-gray-500' },
  }[event.category] || { label: 'Other', color: 'bg-gray-500' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl border border-border w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${categoryConfig.color}`} />
            <h2 className="text-foreground text-lg font-semibold">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-foreground">
                {event.startTime.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-muted-foreground text-sm">
                {event.startTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} -
                {event.endTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          {event.location && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-foreground">{event.location}</p>
            </div>
          )}
          {event.description && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          )}
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className={`px-2 py-1 rounded text-xs text-foreground ${categoryConfig.color}`}>
              {categoryConfig.label}
            </span>
          </div>
          {eventTeam && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-foreground text-sm pt-0.5">
                {eventTeam.name}
              </div>
            </div>
          )}
          {eventAssignee && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div className="text-foreground text-sm pt-0.5">
                {t('scheduler.assigned_to', { defaultValue: 'Tilldelad' })}: <span className="font-medium text-foreground">{eventAssignee.full_name || eventAssignee.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-sidebar">
          <button
            onClick={() => onDelete?.(event.id)}
            className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors text-sm"
          >
            {t('common.delete')}
          </button>
          <button
            onClick={() => onEdit?.(event)}
            className="px-4 py-2 bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white rounded-md transition-colors text-sm"
          >
            {t('common.edit')}
          </button>
        </div>
      </div>
    </div>
  );
};
