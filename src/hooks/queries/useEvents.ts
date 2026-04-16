import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CalendarEvent } from '@/types';
import { useEffect } from 'react';

export function useEvents(workspaceId: string | null, userId: string | null) {
  const queryClient = useQueryClient();

  const queryKey = ['events', workspaceId];

  // Configure realtime subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase.channel('calendar-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase.from('events').select('*').eq('workspace_id', workspaceId);

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
        category: (event.metadata as any)?.category || 'other',
        description: (event.metadata as any)?.description || '',
        location: (event.metadata as any)?.location || '',
        teamId: event.team_id,
        assigneeId: event.assignee_id
      })) as CalendarEvent[];
    },
    enabled: !!workspaceId,
  });

  const addEvent = useMutation({
    mutationFn: async (event: Omit<CalendarEvent, 'id'>) => {
      if (!workspaceId || !userId) throw new Error('Missing context');

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
          location: event.location || ''
        }
      };

      const { data, error } = await supabase.from('events').insert(dbPayload).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const updateEvent = useMutation({
    mutationFn: async ({ eventId, updates }: { eventId: string, updates: Partial<CalendarEvent> }) => {
      const dbPayload: any = {};
      if (updates.title) dbPayload.title = updates.title;
      if (updates.startTime) dbPayload.start_time = updates.startTime.toISOString();
      if (updates.endTime) dbPayload.end_time = updates.endTime.toISOString();
      if (updates.teamId !== undefined) dbPayload.team_id = updates.teamId || null;
      if (updates.assigneeId !== undefined) dbPayload.assignee_id = updates.assigneeId || null;

      const { error } = await supabase.from('events').update(dbPayload).eq('id', eventId);
      if (error) throw new Error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw new Error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    ...query,
    events: query.data || [],
    addEvent: addEvent.mutateAsync,
    updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => updateEvent.mutateAsync({ eventId, updates }),
    deleteEvent: deleteEvent.mutateAsync,
  };
}
