/**
 * =============================================================================
 * CALENDAR HOOK
 * =============================================================================
 * This custom hook manages calendar state including events, selected date,
 * view mode, and filtering. It provides methods for CRUD operations on events.
 * =============================================================================
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from './queries/useEvents';
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
  const { events: dbEvents, addEvent: dbAddEvent, updateEvent: dbUpdateEvent, deleteEvent: dbDeleteEvent } = useEvents(workspaceId, user?.id || null);

  const [state, setState] = useState<CalendarState & { selectedTeamId: string | 'all', selectedAssigneeId: string | 'all', selectedEndDate?: Date | null }>({
    selectedDate: new Date(),
    selectedEndDate: null,
    view: 'week',
    events: [],
    selectedEvent: null,
    filterCategories: [],
    selectedTeamId: 'all',
    selectedAssigneeId: 'all',
  });

  // Keep state.events in sync with dbEvents
  useEffect(() => {
    setState(prev => ({ ...prev, events: dbEvents }));
  }, [dbEvents]);

  /**
   * Set the currently selected date (or range if shiftClick is true)
   */
  const setSelectedDate = useCallback((date: Date, isShiftClick?: boolean) => {
    setState(prev => {
      let newStart = date;
      let newEnd = null;

      if (isShiftClick && prev.selectedDate) {
        if (date < prev.selectedDate) {
          newStart = date;
          newEnd = prev.selectedDate;
        } else {
          newStart = prev.selectedDate;
          newEnd = date;
        }

        const diffDiff = Math.abs(newEnd.getTime() - newStart.getTime());
        const daysDiff = Math.ceil(diffDiff / (1000 * 60 * 60 * 24));
        if (daysDiff > 14) {
          newEnd = new Date(newStart);
          newEnd.setDate(newStart.getDate() + 14);
        }
      }

      return {
        ...prev,
        selectedDate: newStart,
        selectedEndDate: newEnd,
        view: newEnd ? 'week' : prev.view
      };
    });
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
    try {
      await dbAddEvent(event);
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  }, [dbAddEvent]);

  /**
   * Update an existing event
   */
  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      await dbUpdateEvent(eventId, updates);
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  }, [dbUpdateEvent]);

  /**
   * Delete an event from the calendar
   */
  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      await dbDeleteEvent(eventId);
      setState(prev => ({
        ...prev,
        selectedEvent: prev.selectedEvent?.id === eventId ? null : prev.selectedEvent,
      }));
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  }, [dbDeleteEvent]);

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
    selectedEndDate: state.selectedEndDate,
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
