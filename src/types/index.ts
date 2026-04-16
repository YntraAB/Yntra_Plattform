/**
 * This file contains all TypeScript type definitions used throughout the
 * Volt Scheduler application. Centralizing types ensures consistency and
 * makes the codebase more maintainable.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string | 'platform_admin' | 'admin' | 'user' | 'assistant';
  permissions?: Record<string, any>;
  workspaceId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  category: EventCategory;
  location?: string;
  isAllDay?: boolean;
  color?: string;
  attendees?: string[];
  teamId?: string;
  assigneeId?: string;
  waitingTime?: { from: string; to: string };
  activeTimes?: { from: string; to: string }[];
  break?: { from: string; to: string; isPaid: boolean };
}

export type EventCategory =
  | 'assistance_time'
  | 'on_call'
  | 'travel_time'
  | 'introduction'
  | 'meeting'
  | 'administrative_hours'
  | 'training'
  | 'escort_service'
  | 'respite_care'
  | 'unauthorized_absence'
  | 'involuntary_leave'
  | 'other_time'
  | 'customer_staff_note'
  | 'severance_pay'
  | 'other';

export interface CategoryConfig {
  id: EventCategory;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

export interface CalendarState {
  selectedDate: Date;
  view: CalendarView;
  events: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
  filterCategories: EventCategory[];
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: NavItem[];
  isExpanded?: boolean;
  badge?: number;
}

export type AppSection =
  | 'dashboard'
  | 'calendar'
  | 'tasks'
  | 'settings'
  | 'profile';

export interface TimeSlot {
  hour: number;
  label: string;
}

export interface DayInfo {
  date: Date;
  name: string;
  dayOfMonth: number;
  isToday: boolean;
  isWeekend: boolean;
}

export interface MiniCalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
}

export interface WorkspaceModules {
  school: boolean;
  assistance: boolean;
}

export interface WorkspaceSettings {
  timezone: string;
  week_start: number;
  language: string;
  business_hours: {
    start: number;
    end: number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  calendar_density: 'compact' | 'relaxed';
  font_scale: number;
}
