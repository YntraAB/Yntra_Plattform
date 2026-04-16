import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MiniCalendar } from './MiniCalendar';
import { CalendarView } from './CalendarView';
import { useCalendar } from '@/hooks/useCalendar';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { EventModal } from './EventModal';
import { useWorkspaceTeams, useWorkspaceUsers } from '@/hooks/queries/useWorkspaceData';
import type { CalendarEvent } from '@/types';

export const CalendarPage: React.FC = () => {
  const { workspaceId, isLoading, settings } = useWorkspace();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isSv = settings.language === 'sv';
  const activeRole = 'admin' as any; // mock role

  const { data: dbTeams = [] } = useWorkspaceTeams(workspaceId || null);
  const { data: dbUsers = [] } = useWorkspaceUsers(workspaceId || null);

  const {
    selectedDate,
    selectedEndDate,
    view,
    filteredEvents,
    selectedEvent,
    setSelectedDate,
    setView,
    selectEvent,
    navigateNext,
    navigatePrevious,
    navigateToToday,
    deleteEvent,
    selectedTeamId,
    setSelectedTeamId,
    selectedAssigneeId,
    setSelectedAssigneeId,
  } = useCalendar();

  useEffect(() => {
    if (activeRole === 'assistant') {
      if (selectedTeamId === 'all') {
        const firstAvailableTeam = dbTeams[0];
        if (firstAvailableTeam) {
          setSelectedTeamId(firstAvailableTeam.id);
        }
      }
      if (selectedAssigneeId !== 'all' && selectedAssigneeId !== user?.id) {
        setSelectedAssigneeId(user?.id || 'all');
      }
    }
  }, [activeRole, selectedTeamId, setSelectedTeamId, selectedAssigneeId, setSelectedAssigneeId, dbTeams, user]);

  const handleEventClick = (event: CalendarEvent) => {
    selectEvent(event);
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId);
    selectEvent(null);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Mini Calendar and Filters */}
      <div className="w-72 bg-sidebar border-r border-border overflow-y-auto scrollbar-dark p-4">
        <MiniCalendar
          selectedDate={selectedDate}
          selectedEndDate={selectedEndDate}
          onSelectDate={setSelectedDate}
          datesWithEvents={filteredEvents.map(e => e.startTime)}
        />

        <div className="mt-6 border-b border-border pb-6">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-3">
            {t('scheduler.active_schedule')}
          </h3>
          <div className="space-y-2">
            {isLoading ? (
              <div className="w-full bg-muted border border-border rounded-lg h-[38px] animate-pulse" />
            ) : (
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full bg-muted border border-border text-foreground text-sm rounded-lg p-2 focus:ring-1 focus:ring-primary outline-none"
              >
                {activeRole === 'admin' && (
                  <option value="all">{t('scheduler.all_teams')}</option>
                )}
                {dbTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="mt-6 border-b border-border pb-6">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-3">
            {t('scheduler.staff_assistants')}
          </h3>
          <div className="space-y-2">
            {isLoading ? (
              <div className="w-full bg-muted border border-border rounded-lg h-[38px] animate-pulse" />
            ) : (
              <select
                value={selectedAssigneeId}
                onChange={(e) => setSelectedAssigneeId(e.target.value)}
                className="w-full bg-muted border border-border text-foreground text-sm rounded-lg p-2 focus:ring-1 focus:ring-primary outline-none"
              >
                {activeRole === 'assistant' ? (
                  <>
                    <option value="all">{t('scheduler.full_team_shifts')}</option>
                    <option value={user?.id || 'all'}>{t('scheduler.only_my_shifts')}</option>
                  </>
                ) : (
                  <>
                    <option value="all">{t('scheduler.all_assistants')}</option>
                    {dbUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name || u.email || 'Okänd Agent'}</option>
                    ))}
                  </>
                )}
              </select>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-3">
            {t('common.upcoming')}
          </h3>
          <div className="space-y-2">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-[68px] w-full bg-muted rounded-lg animate-pulse" />
              ))
            ) : filteredEvents.length === 0 ? (
              <div className="text-sm text-muted-foreground italic p-2 border border-dashed border-border rounded-lg text-center">
                Inga kommande händelser
              </div>
            ) : (
              filteredEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="p-3 bg-secondary hover:bg-muted rounded-lg cursor-pointer transition-colors"
                >
                  <div className="text-foreground text-sm font-medium truncate">{event.title}</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    {event.startTime.toLocaleDateString(isSv ? 'sv-SE' : 'en-US', { month: 'short', day: 'numeric' })}
                    {' · '}
                    {event.startTime.toLocaleTimeString(isSv ? 'sv-SE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <CalendarView
          selectedDate={selectedDate}
          selectedEndDate={selectedEndDate}
          view={view}
          events={filteredEvents}
          onDateChange={setSelectedDate}
          onViewChange={setView}
          onEventClick={handleEventClick}
          onNext={navigateNext}
          onPrevious={navigatePrevious}
          onToday={navigateToToday}
        />
      </div>

      <EventModal
        event={selectedEvent}
        onClose={() => selectEvent(null)}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
};
