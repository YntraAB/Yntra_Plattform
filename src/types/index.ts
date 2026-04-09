/**
 * =============================================================================
 * TYPES DEFINITIONS
 * =============================================================================
 * This file contains all TypeScript type definitions used throughout the
 * Volt Scheduler application. Centralizing types ensures consistency and
 * makes the codebase more maintainable.
 * =============================================================================
 */

/**
 * -----------------------------------------------------------------------------
 * USER AUTHENTICATION TYPES
 * -----------------------------------------------------------------------------
 */

/**
 * Represents a user in the system
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name: string;
  /** URL to user's avatar image */
  avatar?: string;
  /** User's role in the system */
  role: string | 'platform_admin' | 'admin' | 'user' | 'assistant';
  /** User's specific granular permissions from DB */
  permissions?: Record<string, any>;
  /** Link to active workspace */
  workspaceId?: string;
}

/**
 * Login credentials payload
 */
export interface LoginCredentials {
  /** Email or username */
  email: string;
  /** User's password */
  password: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
  /** Current user data (null if not logged in) */
  user: User | null;
  /** Loading state during authentication */
  isLoading: boolean;
  /** Error message if authentication failed */
  error: string | null;
}

/**
 * -----------------------------------------------------------------------------
 * SCHEDULING / CALENDAR TYPES
 * -----------------------------------------------------------------------------
 */

/**
 * Represents a scheduled event/appointment
 */
export interface CalendarEvent {
  /** Unique identifier for the event */
  id: string;
  /** Event title/display name */
  title: string;
  /** Event description/details */
  description?: string;
  /** Start date and time */
  startTime: Date;
  /** End date and time */
  endTime: Date;
  /** Event category/type for color coding */
  category: EventCategory;
  /** Location of the event */
  location?: string;
  /** Whether the event spans multiple days */
  isAllDay?: boolean;
  /** Event color (hex code) - overrides category color */
  color?: string;
  /** Associated user IDs */
  attendees?: string[];
  /** Associated team ID */
  teamId?: string;
  /** Primary assigned user ID */
  assigneeId?: string;
}

/**
 * Event categories for color coding and organization
 */
export type EventCategory = 
  | 'meeting'      // Team meetings, standups
  | 'task'         // Individual tasks
  | 'reminder'     // Reminders and notifications
  | 'planning'     // Planning sessions
  | 'exam'         // Exams and assessments
  | 'personal'     // Personal events
  | 'other';       // Uncategorized events

/**
 * Category configuration with display properties
 */
export interface CategoryConfig {
  /** Category identifier */
  id: EventCategory;
  /** Display label */
  label: string;
  /** Color for events in this category (hex code) */
  color: string;
  /** Background color with opacity */
  bgColor: string;
  /** Icon identifier */
  icon: string;
}

/**
 * View modes for the calendar
 */
export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

/**
 * Calendar state management
 */
export interface CalendarState {
  /** Currently selected date */
  selectedDate: Date;
  /** Current view mode */
  view: CalendarView;
  /** All events in the calendar */
  events: CalendarEvent[];
  /** Currently selected event (for editing/viewing) */
  selectedEvent: CalendarEvent | null;
  /** Filter categories (empty = show all) */
  filterCategories: EventCategory[];
}

/**
 * -----------------------------------------------------------------------------
 * NAVIGATION / UI TYPES
 * -----------------------------------------------------------------------------
 */

/**
 * Sidebar navigation item
 */
export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component identifier */
  icon: string;
  /** Route path (if applicable) */
  path?: string;
  /** Child navigation items */
  children?: NavItem[];
  /** Whether this item is expanded (for collapsible items) */
  isExpanded?: boolean;
  /** Badge count (for notifications) */
  badge?: number;
}

/**
 * Application sections/pages
 */
export type AppSection = 
  | 'dashboard'
  | 'calendar'
  | 'tasks'
  | 'settings'
  | 'profile';

/**
 * -----------------------------------------------------------------------------
 * UTILITY TYPES
 * -----------------------------------------------------------------------------
 */

/**
 * Time slot representation for calendar grid
 */
export interface TimeSlot {
  /** Hour of day (0-23) */
  hour: number;
  /** Display label (e.g., "08:00") */
  label: string;
}

/**
 * Day information for calendar headers
 */
export interface DayInfo {
  /** Date object */
  date: Date;
  /** Day name (e.g., "Mon", "Tuesday") */
  name: string;
  /** Day of month (1-31) */
  dayOfMonth: number;
  /** Whether this is today */
  isToday: boolean;
  /** Whether this is a weekend day */
  isWeekend: boolean;
}

/**
 * Mini calendar day cell
 */
export interface MiniCalendarDay {
  /** Date object */
  date: Date;
  /** Day of month */
  dayOfMonth: number;
  /** Whether this day is in the current month */
  isCurrentMonth: boolean;
  /** Whether this is today */
  isToday: boolean;
  /** Whether this day has events */
  hasEvents: boolean;
}
