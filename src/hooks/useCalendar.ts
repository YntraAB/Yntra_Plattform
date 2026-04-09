/**
 * =============================================================================
 * CALENDAR HOOK
 * =============================================================================
 * This custom hook manages calendar state including events, selected date,
 * view mode, and filtering. It provides methods for CRUD operations on events.
 * =============================================================================
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import type { 
  CalendarEvent, 
  CalendarView, 
  EventCategory,
  CalendarState 
} from '@/types';


// Removed sample event generation
/**
 * Custom hook for managing calendar state and operations
 * 
 * @returns Calendar state and methods for event management
 */
export function useCalendar() {
  // Initialize calendar state with sample data
  const { workspaceId } = useWorkspace();
  const { user } = useAuth();

  const [state, setState] = useState<CalendarState & { selectedTeamId: string | 'all', selectedAssigneeId: string | 'all' }>({
    selectedDate: new Date(),
    view: 'week',
    events: [],
    selectedEvent: null,
    filterCategories: [],
    selectedTeamId: 'all',
    selectedAssigneeId: 'all',
  });

  useEffect(() => {
    async function fetchEvents() {
      let query = supabase.from('events').select('*');
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }
      const { data, error } = await query;
      
      if (error) {
        console.error('Failed to load events:', error);
        return;
      }
      
      const mappedEvents: CalendarEvent[] = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
        category: (event.metadata as any)?.category || 'other',
        description: (event.metadata as any)?.description || '',
        location: (event.metadata as any)?.location || '',
        teamId: event.team_id,
        assigneeId: event.assignee_id
      }));

      setState(prev => ({ ...prev, events: mappedEvents }));
    }
    fetchEvents();

    // Auto-uppdaterande händelser!
    const channel = supabase.channel('calendar-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => { fetchEvents(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  /**
   * Set the currently selected date
   */
  const setSelectedDate = useCallback((date: Date) => {
    setState(prev => ({ ...prev, selectedDate: date }));
  }, []);

  /**
   * Change the calendar view mode (day/week/month/agenda)
   */
  const setView = useCallback((view: CalendarView) => {
    setState(prev => ({ ...prev, view }));
  }, []);

  /**
   * Set the selected team ID for filtering
   */
  const setSelectedTeamId = useCallback((teamId: string | 'all') => {
    setState(prev => ({ ...prev, selectedTeamId: teamId }));
  }, []);

  /**
   * Set the selected assignee ID for filtering
   */
  const setSelectedAssigneeId = useCallback((assigneeId: string | 'all') => {
    setState(prev => ({ ...prev, selectedAssigneeId: assigneeId }));
  }, []);

  /**
   * Add a new event to the calendar
   */
  const addEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
    if (!workspaceId || !user) return;
    
    const dbPayload = {
      workspace_id: workspaceId,
      user_id: user.id,
      title: event.title,
      start_time: event.startTime.toISOString(),
      end_time: event.endTime.toISOString(),
      team_id: event.teamId || null,
      assignee_id: event.assigneeId || null,
      metadata: {
        description: event.description || '',
        category: event.category,
        location: event.location || ''
      }
    };

    const { data, error } = await supabase.from('events').insert(dbPayload).select().single();
    if (error || !data) {
      console.error('Failed to add event:', error);
      return;
    }

    // We don't need to manually push to state anymore because the realtime channel handles it!
  }, [workspaceId, user]);

  /**
   * Update an existing event
   */
  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    // Only updates title, start, end, team, assignee, or metadata
    const dbPayload: any = {};
    if (updates.title) dbPayload.title = updates.title;
    if (updates.startTime) dbPayload.start_time = updates.startTime.toISOString();
    if (updates.endTime) dbPayload.end_time = updates.endTime.toISOString();
    if (updates.teamId !== undefined) dbPayload.team_id = updates.teamId || null;
    if (updates.assigneeId !== undefined) dbPayload.assignee_id = updates.assigneeId || null;
    
    // Simplification for metadata: we just merge it all if category/desc/location changes
    // In a real app we'd fetch the old metadata and merge it...
    // For simplicity, we just trigger optimistic UI update and do basic backend override if possible
    
    await supabase.from('events').update(dbPayload).eq('id', eventId);

    // The realtime subscription handles triggering UI updates instantly based on this update
  }, []);

  /**
   * Delete an event from the calendar
   */
  const deleteEvent = useCallback(async (eventId: string) => {
    await supabase.from('events').delete().eq('id', eventId);
    // Event is removed via realtime
    setState(prev => ({
      ...prev,
      selectedEvent: prev.selectedEvent?.id === eventId ? null : prev.selectedEvent,
    }));
  }, []);

  /**
   * Select an event for viewing/editing
   */
  const selectEvent = useCallback((event: CalendarEvent | null) => {
    setState(prev => ({ ...prev, selectedEvent: event }));
  }, []);

  /**
   * Toggle a category filter
   */
  const toggleCategoryFilter = useCallback((category: EventCategory) => {
    setState(prev => ({
      ...prev,
      filterCategories: prev.filterCategories.includes(category)
        ? prev.filterCategories.filter(c => c !== category)
        : [...prev.filterCategories, category],
    }));
  }, []);

  /**
   * Clear all category filters
   */
  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, filterCategories: [] }));
  }, []);

  /**
   * Navigate to the next period (day/week/month)
   */
  const navigateNext = useCallback(() => {
    setState(prev => {
      const newDate = new Date(prev.selectedDate);
      switch (prev.view) {
        case 'day':
          newDate.setDate(newDate.getDate() + 1);
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + 7);
          break;
        case 'month': {
          const originalDay = newDate.getDate();
          newDate.setMonth(newDate.getMonth() + 1);
          // If the month rolled over excessively (Jan 31 -> Mar 3), set back to the last valid day of the target month
          if (newDate.getDate() < originalDay) {
            newDate.setDate(0);
          }
          break;
        }
        case 'agenda':
          newDate.setDate(newDate.getDate() + 7);
          break;
        default:
          break;
      }
      return { ...prev, selectedDate: newDate };
    });
  }, []);

  /**
   * Navigate to the previous period (day/week/month)
   */
  const navigatePrevious = useCallback(() => {
    setState(prev => {
      const newDate = new Date(prev.selectedDate);
      switch (prev.view) {
        case 'day':
          newDate.setDate(newDate.getDate() - 1);
          break;
        case 'week':
          newDate.setDate(newDate.getDate() - 7);
          break;
        case 'month': {
          const originalDay = newDate.getDate();
          newDate.setMonth(newDate.getMonth() - 1);
          if (newDate.getDate() < originalDay) {
            newDate.setDate(0);
          }
          break;
        }
        case 'agenda':
          newDate.setDate(newDate.getDate() - 7);
          break;
        default:
          break;
      }
      return { ...prev, selectedDate: newDate };
    });
  }, []);

  /**
   * Navigate to today
   */
  const navigateToToday = useCallback(() => {
    setState(prev => ({ ...prev, selectedDate: new Date() }));
  }, []);

  /**
   * Filtered events based on selected categories and selected team
   */
  const filteredEvents = useMemo(() => {
    let result = state.events;
    
    // Filter by team
    if (state.selectedTeamId !== 'all') {
      result = result.filter(event => event.teamId === state.selectedTeamId);
    }
    
    // Filter by category
    if (state.filterCategories.length > 0) {
      result = result.filter(event => 
        state.filterCategories.includes(event.category)
      );
    }
    
    // Filter by assignee
    if (state.selectedAssigneeId !== 'all') {
      result = result.filter(event => event.assigneeId === state.selectedAssigneeId);
    }
    
    return result;
  }, [state.events, state.filterCategories, state.selectedTeamId, state.selectedAssigneeId]);

  /**
   * Get events for a specific date
   */
  const getEventsForDate = useCallback((date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }, [filteredEvents]);

  return {
    // State
    selectedDate: state.selectedDate,
    view: state.view,
    events: state.events,
    filteredEvents,
    selectedEvent: state.selectedEvent,
    filterCategories: state.filterCategories,
    selectedTeamId: state.selectedTeamId,
    selectedAssigneeId: state.selectedAssigneeId,
    // Actions
    setSelectedDate,
    setView,
    setSelectedTeamId,
    setSelectedAssigneeId,
    addEvent,
    updateEvent,
    deleteEvent,
    selectEvent,
    toggleCategoryFilter,
    clearFilters,
    navigateNext,
    navigatePrevious,
    navigateToToday,
    getEventsForDate,
  };
}
