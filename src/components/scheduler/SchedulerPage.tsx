/**
 * =============================================================================
 * SCHEDULER PAGE COMPONENT
 * =============================================================================
 * This is the main scheduling system page that combines the sidebar,
 * mini calendar, and main calendar view. It provides an IDE-style layout
 * with a collapsible left sidebar and a comprehensive calendar interface.
 * =============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { LogOut, Settings, ChevronDown, Lock } from 'lucide-react';
import { MiniCalendar } from './MiniCalendar';
import { CalendarView } from './CalendarView';
import { useCalendar } from '@/hooks/useCalendar';
import { SettingsPage } from '@/components/settings/SettingsPage';
import type { CalendarEvent } from '@/types';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
// Nya Moduler
import { WorkNotesPage } from '../notes/WorkNotesPage';
import { MedicationPage } from '../assistance/MedicationPage';
import { DirectoryPage } from '../directory/DirectoryPage';
import { MessagesPage } from '../ui/MessagesPage';
import { TimeManagerPage } from '../time/TimeManagerPage';

/**
 * Props for the SchedulerPage component
 */
interface SchedulerPageProps {
  /** Current user's name */
  userName: string;
  /** Callback when user logs out */
  onLogout: () => void;
}

/**
 * Event Detail Modal Component
 * Shows detailed information about a selected event
 */
interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

// Mock components are replaced with Supabase async components

const EventModal: React.FC<EventModalProps> = ({ event, onClose, onEdit, onDelete }) => {
  if (!event) return null;

  const [eventTeam, setEventTeam] = useState<any | null>(null);
  const [eventAssignee, setEventAssignee] = useState<any | null>(null);

  React.useEffect(() => {
    async function loadEntityDetails() {
      if (!event) return;
      const { data: teamsData } = await supabase.from('teams').select('*').eq('id', event.teamId);
      if (teamsData && teamsData.length > 0) setEventTeam(teamsData[0]);

      const { data: usersData } = await supabase.from('users').select('*').eq('id', event.assigneeId);
      if (usersData && usersData.length > 0) setEventAssignee(usersData[0]);
    }
    loadEntityDetails();
  }, [event]);

  const categoryConfig = {
    meeting: { label: 'Meeting', color: 'bg-violet-500' },
    task: { label: 'Task', color: 'bg-blue-500' },
    reminder: { label: 'Reminder', color: 'bg-amber-500' },
    planning: { label: 'Planning', color: 'bg-emerald-500' },
    exam: { label: 'Exam', color: 'bg-red-500' },
    personal: { label: 'Personal', color: 'bg-pink-500' },
    other: { label: 'Other', color: 'bg-gray-500' },
  }[event.category];

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
          {/* Time */}
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-foreground">
                {event.startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-muted-foreground text-sm">
                {event.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - 
                {event.endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-foreground">{event.location}</p>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          )}

          {/* Category */}
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className={`px-2 py-1 rounded text-xs text-foreground ${categoryConfig.color}`}>
              {categoryConfig.label}
            </span>
          </div>

          {/* Team Marker */}
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

          {/* Assignee Marker */}
          {eventAssignee && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div className="text-foreground text-sm pt-0.5">
                Tilldelad: <span className="font-medium text-foreground">{eventAssignee.name}</span>
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
            Delete
          </button>
          <button
            onClick={() => onEdit?.(event)}
            className="px-4 py-2 bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white rounded-md transition-colors text-sm"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Main SchedulerPage Component
 * Combines sidebar, mini calendar, and main calendar view
 */
export type DevRole = 'platform_admin' | 'admin' | 'assistant';

export const SchedulerPage: React.FC<SchedulerPageProps> = ({ userName, onLogout }) => {
  const [activeSection, setActiveSection] = useState('schedule');
  const [breadcrumbNode, setBreadcrumbNode] = useState<ReactNode>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { modules, isLoading } = useWorkspace();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Hardcoded for security until real role logic is integrated
  const activeRole = 'admin' as any as DevRole;
  
  // Nollställ breadcrumb när vi byter huvudsektion
  React.useEffect(() => {
    setBreadcrumbNode(null);
  }, [activeSection]);

  const { workspaceId } = useWorkspace();
  const { user } = useAuth();
  const [dbTeams, setDbTeams] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);

  React.useEffect(() => {
    async function getWorkspaceEntities() {
      if (!workspaceId) return;
      const { data: teamsList } = await supabase.from('teams').select('*').eq('workspace_id', workspaceId);
      if (teamsList) setDbTeams(teamsList);
      const { data: usersList } = await supabase.from('users').select('*').eq('workspace_id', workspaceId);
      if (usersList) setDbUsers(usersList);
    }
    getWorkspaceEntities();

    // Auto-update system för schema-filter
    const channel = supabase.channel('scheduler-entities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => { getWorkspaceEntities(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => { getWorkspaceEntities(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);
  
  // Calendar state from custom hook
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

  // Handle Role Change effect
  React.useEffect(() => {
    if (activeRole === 'assistant') {
      // Set to first available team if unselected
      if (selectedTeamId === 'all') {
         // In a real app we'd filter by checking team_members, but we just pick first team for demo
        const firstAvailableTeam = dbTeams[0];
        if (firstAvailableTeam) {
          setSelectedTeamId(firstAvailableTeam.id);
        }
      }
      
      // Default to their own shifts mostly, or leave all, but make sure they don't see unauthorized 'all'
      // If we want to default an assistant to "Only my shifts", we can do it here:
      if (selectedAssigneeId !== 'all' && selectedAssigneeId !== user?.id) {
        setSelectedAssigneeId(user?.id || 'all');
      }
    }
  }, [activeRole, selectedTeamId, setSelectedTeamId, selectedAssigneeId, setSelectedAssigneeId, dbTeams, user]);

  /**
   * Handle event click - open event detail modal
   */
  const handleEventClick = (event: CalendarEvent) => {
    selectEvent(event);
  };

  /**
   * Handle event deletion
   */
  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId);
    selectEvent(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background animate-in fade-in duration-500">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-current border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-medium tracking-wide">Laddar arbetsyta...</span>
          </div>
        </div>
      );
    }

    if (!modules.assistance && activeSection !== 'settings') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 bg-background">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-6 border border-border shadow-2xl rotate-12 transition-transform hover:rotate-0 duration-300">
            <Lock className="w-10 h-10 text-primary -rotate-12 transition-transform hover:rotate-0 duration-300" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Assistansmodul krävs</h2>
          <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
            Hela plattformen är nu strikt kopplad till Assistansmodulen. Din organisation har inte denna modul aktiverad, vilket innebär att arbetsytan är låst.
          </p>
          {(user?.role === 'admin' || user?.role === 'platform_admin') ? (
            <button 
              onClick={() => setActiveSection('settings')}
              className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-violet-500/20"
            >
              Gå till Inställningar
            </button>
          ) : (
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Kontakta administratör för aktivering
            </div>
          )}
        </div>
      );
    }

    switch (activeSection) {
      case 'work-notes':
        return <div className="flex-1 min-w-0 overflow-y-auto"><WorkNotesPage setBreadcrumbNode={setBreadcrumbNode} /></div>;
      case 'inbox':
        return <div className="flex-1 min-w-0 overflow-y-auto"><MessagesPage setBreadcrumbNode={setBreadcrumbNode} /></div>;
      case 'medication':
        return <div className="flex-1 min-w-0 overflow-y-auto"><MedicationPage /></div>;
      case 'directory':
        return <div className="flex-1 min-w-0 overflow-y-auto"><DirectoryPage setBreadcrumbNode={setBreadcrumbNode} /></div>;
      case 'settings':
        return <div className="flex-1 min-w-0 overflow-y-auto"><SettingsPage /></div>;
      case 'time':
      case 'timereports':
        return <div className="flex-1 min-w-0 overflow-y-auto"><TimeManagerPage setBreadcrumbNode={setBreadcrumbNode} /></div>;
      case 'calendar':
      case 'schedule':
      default:
        return (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Mini Calendar and Filters */}
            <div className="w-72 bg-sidebar border-r border-border overflow-y-auto scrollbar-dark p-4">
              {/* Mini Calendar */}
              <MiniCalendar
                selectedDate={selectedDate}
                selectedEndDate={selectedEndDate}
                onSelectDate={setSelectedDate}
                datesWithEvents={filteredEvents.map(e => e.startTime)}
              />

              {/* Team Filter */}
              <div className="mt-6 border-b border-border pb-6">
                <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-3">
                  Aktivt Schema
                </h3>
                <div className="space-y-2">
                  <select 
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-sm rounded-lg p-2 focus:ring-1 focus:ring-primary outline-none"
                  >
                    {activeRole === 'admin' && (
                      <option value="all">Alla Team (Översikt)</option>
                    )}
                    {dbTeams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Personal / Assignee Filter */}
              <div className="mt-6 border-b border-border pb-6">
                <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-3">
                  Personal / Assistenter
                </h3>
                <div className="space-y-2">
                  <select 
                    value={selectedAssigneeId}
                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-sm rounded-lg p-2 focus:ring-1 focus:ring-primary outline-none"
                  >
                    {activeRole === 'assistant' ? (
                      <>
                        <option value="all">Hela Teamets pass</option>
                        <option value={user?.id || 'all'}>Bara mina pass</option>
                      </>
                    ) : (
                      <>
                        <option value="all">Alla assistenter</option>
                        {dbUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.full_name || u.email || 'Okänd Agent'}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>



              {/* Upcoming Events List */}
              <div className="mt-6">
                <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-3">
                  Upcoming
                </h3>
                <div className="space-y-2">
                  {filteredEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="p-3 bg-secondary hover:bg-muted rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="text-foreground text-sm font-medium truncate">{event.title}</div>
                      <div className="text-muted-foreground text-xs mt-1">
                        {event.startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' · '}
                        {event.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Calendar View */}
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
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-sidebar border-b border-border flex items-center justify-between px-4">
          {/* Breadcrumb / Current Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbNode ? breadcrumbNode : (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="text-foreground capitalize font-medium">{activeSection.replace('-', ' ')}</span>
              </div>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3 relative" ref={profileRef}>
            <div 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-3 py-1 cursor-pointer hover:bg-secondary rounded-md transition-colors"
            >
              <div className="text-right hidden md:block">
                <div className="text-foreground text-sm font-medium leading-tight">{userName}</div>
                <div className="text-primary text-[10px] font-bold uppercase tracking-wider">{user?.role === 'platform_admin' ? 'dev' : user?.role || 'admin'}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-inner">
                <span className="text-foreground text-sm font-bold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute top-12 right-0 w-48 bg-sidebar border border-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {(user?.role === 'admin' || user?.role === 'platform_admin') && (
                  <>
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        setActiveSection('settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Settings className="w-4 h-4" /> Inställningar
                    </button>
                    <div className="my-1 border-t border-border"></div>
                  </>
                )}
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logga ut
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content View Manager */}
        {renderContent()}
      </div>

      {/* Event Detail Modal */}
      <EventModal
        event={selectedEvent}
        onClose={() => selectEvent(null)}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
};

export default SchedulerPage;
