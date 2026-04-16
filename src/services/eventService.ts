import { supabase } from '@/lib/supabase';
import type { CalendarEvent } from '@/types';

export const eventService = {
  /**
   * Fetch all events for a specific workspace
   */
  async getWorkspaceEvents(workspaceId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw new Error(error.message);

    return (data || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      startTime: new Date(event.start_time),
      endTime: new Date(event.end_time),
      category: (event.metadata as any)?.category || 'other',
      description: (event.metadata as any)?.description || '',
      location: (event.metadata as any)?.location || '',
      isAllDay: (event.metadata as any)?.isAllDay || false,
      attendees: (event.metadata as any)?.attendees || [],
      teamId: event.team_id,
      assigneeId: event.assignee_id
    }));
  },

  /**
   * Create a new event
   */
  async createEvent(workspaceId: string, userId: string, event: Omit<CalendarEvent, 'id'>) {
    const dbPayload = {
      workspace_id: workspaceId,
      user_id: userId,
      title: event.title,
      start_time: event.startTime.toISOString(),
      end_time: event.endTime.toISOString(),
      team_id: event.teamId || null,
      assignee_id: event.assigneeId || null,
      metadata: {
        description: event.description || '',
        category: event.category,
        location: event.location || '',
        isAllDay: event.isAllDay || false,
        attendees: event.attendees || []
      }
    };

    const { data, error } = await supabase
      .from('events')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, updates: Partial<CalendarEvent>) {
    const dbPayload: any = {};
    if (updates.title) dbPayload.title = updates.title;
    if (updates.startTime) dbPayload.start_time = updates.startTime.toISOString();
    if (updates.endTime) dbPayload.end_time = updates.endTime.toISOString();
    if (updates.teamId !== undefined) dbPayload.team_id = updates.teamId || null;
    if (updates.assigneeId !== undefined) dbPayload.assignee_id = updates.assigneeId || null;

    // Handle metadata updates if needed
    if (
      updates.description !== undefined || 
      updates.category !== undefined || 
      updates.location !== undefined ||
      updates.isAllDay !== undefined ||
      updates.attendees !== undefined
    ) {
      // First get current metadata to merge
      const { data: current } = await supabase.from('events').select('metadata').eq('id', eventId).single();
      const currentMeta = (current?.metadata as any) || {};
      dbPayload.metadata = {
        ...currentMeta,
        description: updates.description ?? currentMeta.description,
        category: updates.category ?? currentMeta.category,
        location: updates.location ?? currentMeta.location,
        isAllDay: updates.isAllDay ?? currentMeta.isAllDay,
        attendees: updates.attendees ?? currentMeta.attendees
      };
    }

    const { error } = await supabase
      .from('events')
      .update(dbPayload)
      .eq('id', eventId);

    if (error) throw new Error(error.message);
  },

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw new Error(error.message);
  }
};
