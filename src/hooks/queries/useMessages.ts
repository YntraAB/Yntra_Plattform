import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, type SendMessagePayload } from '@/services/messageService';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { queryKeys } from '@/lib/query-keys';
import { toast } from 'sonner';

export const useMessages = <TData = any>(
  workspaceId: string | undefined,
  options?: { select?: (data: any) => TData }
) => {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.messages(workspaceId);

  useEffect(() => {
    if (!workspaceId) return;

    const channelId = `messages-${workspaceId}-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase.channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `workspace_id=eq.${workspaceId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          queryClient.setQueryData(queryKey, (old: any[] = []) => [payload.new, ...old]);
        } else if (payload.eventType === 'UPDATE') {
          queryClient.setQueryData(queryKey, (old: any[] = []) =>
            old.map(m => m.id === payload.new.id ? payload.new : m)
          );
        } else if (payload.eventType === 'DELETE') {
          queryClient.setQueryData(queryKey, (old: any[] = []) =>
            old.filter(m => m.id !== payload.old.id)
          );
        } else {
          queryClient.invalidateQueries({ queryKey });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: () => messageService.fetchMessages(workspaceId!),
    enabled: !!workspaceId,
    ...options
  });
};

export const useMarkMessageAsRead = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.messages(workspaceId);

  return useMutation({
    mutationFn: (messageId: string) => messageService.markAsRead(messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousMessages = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.map(m => m.id === messageId ? { ...m, is_read: true } : m)
      );

      return { previousMessages };
    },
    onError: (_err, _messageId, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKey, context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useSendMessage = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.messages(workspaceId);

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => messageService.sendMessage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useDeleteMessages = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.messages(workspaceId);

  return useMutation({
    mutationFn: (messageIds: string[]) => messageService.deleteMessages(messageIds),
    onMutate: async (messageIds) => {
      await queryClient.cancelQueries({ queryKey });
      const previousMessages = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any[] = []) =>
        old.filter(m => !messageIds.includes(m.id))
      );

      return { previousMessages };
    },
    onError: (_err, _messageIds, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKey, context.previousMessages);
        toast.error("Misslyckades att ta bort meddelanden");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
