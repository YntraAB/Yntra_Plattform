/**
 * =============================================================================
 * UTILITY FUNCTIONS
 * =============================================================================
 * This file contains utility functions used throughout the Volt Scheduler
 * application. These include date formatting, class name merging, and
 * other helper functions.
 * =============================================================================
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { EventCategory, CategoryConfig, TimeSlot, DayInfo } from '@/types';

/**
 * -----------------------------------------------------------------------------
 * CLASS NAME UTILITIES
 * -----------------------------------------------------------------------------
 */

/**
 * Merge Tailwind CSS classes with proper precedence
 * Uses clsx for conditional classes and tailwind-merge to resolve conflicts
 * 
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * -----------------------------------------------------------------------------
 * DATE FORMATTING UTILITIES
 * -----------------------------------------------------------------------------
 */

/**
 * Format a date to a localized string
 * 
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }
): string {
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format a date to show month and year (e.g., "February 2025")
 * 
 * @param date - Date to format
 * @returns Formatted month and year string
 */
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'long', 
    year: 'numeric' 
  }).format(date);
}

/**
 * Format time from a Date object (e.g., "09:00")
 * 
 * @param date - Date to extract time from
 * @returns Formatted time string (24-hour format)
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  }).format(date);
}

/**
 * Format time range (e.g., "09:00 - 10:30")
 * 
 * @param startTime - Start date/time
 * @param endTime - End date/time
 * @returns Formatted time range string
 */
export function formatTimeRange(startTime: Date, endTime: Date): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Get short day name (e.g., "Mon", "Tue")
 * 
 * @param date - Date to get day name from
 * @returns Short day name
 */
export function getShortDayName(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
}

/**
 * Get full day name (e.g., "Monday")
 * 
 * @param date - Date to get day name from
 * @returns Full day name
 */
export function getFullDayName(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
}

/**
 * Check if two dates are the same day
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

/**
 * Check if a date is today
 * 
 * @param date - Date to check
 * @returns True if today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * -----------------------------------------------------------------------------
 * CALENDAR GRID UTILITIES
 * -----------------------------------------------------------------------------
 */

/**
 * Generate time slots for the calendar grid
 * Creates slots from 00:00 to 23:00
 * 
 * @returns Array of time slot objects
 */
export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = 0; hour < 24; hour++) {
    slots.push({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
    });
  }
  return slots;
}

/**
 * Generate days for a week view
 * 
 * @param startDate - Start date of the week (typically Sunday or Monday)
 * @returns Array of day info objects
 */
export function generateWeekDays(startDate: Date): DayInfo[] {
  const days: DayInfo[] = [];
  const currentDate = new Date(startDate);
  
  // Adjust to start of week (Monday)
  const dayOfWeek = currentDate.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  currentDate.setDate(currentDate.getDate() - diffToMonday);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + i);
    
    days.push({
      date,
      name: getShortDayName(date),
      dayOfMonth: date.getDate(),
      isToday: isToday(date),
      isWeekend: i === 5 || i === 6, // Saturday (5) or Sunday (6) relative to Monday start
    });
  }
  
  return days;
}

/**
 * Get the start of the week for a given date
 * 
 * @param date - Date to find week start for
 * @returns Date representing start of week (Monday)
 */
export function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const dayOfWeek = result.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  result.setDate(result.getDate() - diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * -----------------------------------------------------------------------------
 * EVENT CATEGORY CONFIGURATION
 * -----------------------------------------------------------------------------
 */

/**
 * Configuration for event categories including colors and labels
 */
export const EVENT_CATEGORIES: Record<EventCategory, CategoryConfig> = {
  meeting: {
    id: 'meeting',
    label: 'Meeting',
    color: '#8B5CF6', // Violet
    bgColor: 'rgba(139, 92, 246, 0.2)',
    icon: 'Users',
  },
  task: {
    id: 'task',
    label: 'Task',
    color: '#3B82F6', // Blue
    bgColor: 'rgba(59, 130, 246, 0.2)',
    icon: 'CheckSquare',
  },
  reminder: {
    id: 'reminder',
    label: 'Reminder',
    color: '#F59E0B', // Amber
    bgColor: 'rgba(245, 158, 11, 0.2)',
    icon: 'Bell',
  },
  planning: {
    id: 'planning',
    label: 'Planning',
    color: '#10B981', // Emerald
    bgColor: 'rgba(16, 185, 129, 0.2)',
    icon: 'Calendar',
  },
  exam: {
    id: 'exam',
    label: 'Exam',
    color: '#EF4444', // Red
    bgColor: 'rgba(239, 68, 68, 0.2)',
    icon: 'FileText',
  },
  personal: {
    id: 'personal',
    label: 'Personal',
    color: '#EC4899', // Pink
    bgColor: 'rgba(236, 72, 153, 0.2)',
    icon: 'User',
  },
  other: {
    id: 'other',
    label: 'Other',
    color: '#6B7280', // Gray
    bgColor: 'rgba(107, 114, 128, 0.2)',
    icon: 'MoreHorizontal',
  },
};

/**
 * Get category configuration by category ID
 * 
 * @param category - Event category
 * @returns Category configuration object
 */
export function getCategoryConfig(category: EventCategory): CategoryConfig {
  return EVENT_CATEGORIES[category];
}

/**
 * -----------------------------------------------------------------------------
 * EVENT POSITIONING UTILITIES
 * -----------------------------------------------------------------------------
 */

/**
 * Calculate the top position for an event in the calendar grid
 * Based on the hour and minute of the start time
 * 
 * @param date - Event start time
 * @param hourHeight - Height of one hour in pixels (default: 60)
 * @returns Top position in pixels
 */
export function calculateEventTop(date: Date, hourHeight: number = 60): number {
  const hour = date.getHours();
  const minute = date.getMinutes();
  return (hour + minute / 60) * hourHeight;
}

/**
 * Calculate the height of an event based on its duration
 * 
 * @param startTime - Event start time
 * @param endTime - Event end time
 * @param hourHeight - Height of one hour in pixels (default: 60)
 * @returns Height in pixels
 */
export function calculateEventHeight(
  startTime: Date, 
  endTime: Date, 
  hourHeight: number = 60
): number {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  return durationHours * hourHeight;
}
