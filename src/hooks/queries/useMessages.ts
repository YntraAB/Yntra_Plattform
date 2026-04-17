import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, type SendMessagePayload } from '@/services/messageService';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export const useMessages = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase.channel('messages-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  return useQuery({
    queryKey: ['messages', workspaceId],
    queryFn: () => messageService.fetchMessages(workspaceId!),
    enabled: !!workspaceId,
  });
};

export const useMarkMessageAsRead = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messageService.markAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] });
    },
  });
};

export const useSendMessage = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => messageService.sendMessage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] });
    },
  });
};

export const useDeleteMessages = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageIds: string[]) => messageService.deleteMessages(messageIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] });
    },
  });
};
