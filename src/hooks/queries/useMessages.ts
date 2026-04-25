import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  messageService,
  type SendMessagePayload,
  type FetchMessagesParams,
} from '@/services/messageService'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'
import type { Message } from '@/types'

export const useMessages = <TData = Message[]>(
  workspaceId: string | undefined,
  options?: { select?: (data: Message[]) => TData },
) => {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.messages(workspaceId)

  useEffect(() => {
    if (!workspaceId) return

    const channelId = `messages-${workspaceId}-${Math.random().toString(36).slice(2, 9)}`
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(queryKey, (old: Message[] = []) => [
              payload.new as Message,
              ...old,
            ])
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
              old.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m)),
            )
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
              old.filter((m) => m.id !== payload.old.id),
            )
          } else {
            queryClient.invalidateQueries({ queryKey })
          }
          queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, queryClient, queryKey])

  return useQuery({
    queryKey,
    queryFn: () => messageService.fetchMessages(workspaceId!),
    enabled: !!workspaceId,
    ...options,
  })
}

export const useMessagesPaginated = <TData = { messages: Message[]; count: number }>(
  params: FetchMessagesParams,
  options?: {
    select?: (data: { messages: Message[]; count: number }) => TData
    enabled?: boolean
  },
) => {
  const queryClient = useQueryClient()
  const { enabled = true } = options || {}
  const { workspaceId, from, to, searchQuery, filterType, userId, teamId } = params

  const queryKey = ['messages', workspaceId, { from, to, searchQuery, filterType, userId, teamId }]

  useEffect(() => {
    if (enabled && workspaceId && to !== undefined && from !== undefined) {
      const pageSize = to - from + 1

      const nextFrom = from + pageSize
      const nextTo = to + pageSize
      queryClient.prefetchQuery({
        queryKey: ['messages', workspaceId, { ...params, from: nextFrom, to: nextTo, searchQuery }],
        queryFn: () =>
          messageService.fetchMessagesPaginated({
            ...params,
            from: nextFrom,
            to: nextTo,
            searchQuery,
          }),
      })

      if (from >= pageSize) {
        const prevFrom = from - pageSize
        const prevTo = to - pageSize
        queryClient.prefetchQuery({
          queryKey: [
            'messages',
            workspaceId,
            { ...params, from: prevFrom, to: prevTo, searchQuery },
          ],
          queryFn: () =>
            messageService.fetchMessagesPaginated({
              ...params,
              from: prevFrom,
              to: prevTo,
              searchQuery,
            }),
        })
      }
    }
  }, [from, to, searchQuery, params, queryClient, workspaceId, enabled])

  useEffect(() => {
    if (!workspaceId || !enabled) return

    const channelId = `messages-paginated-${workspaceId}-${Math.random().toString(36).slice(2, 9)}`
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, queryClient, enabled])

  return useQuery({
    queryKey,
    queryFn: () => messageService.fetchMessagesPaginated(params),
    placeholderData: keepPreviousData,
    ...options,
    enabled: !!workspaceId && enabled,
  })
}

export const useMarkMessageAsRead = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: string) => messageService.markAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] })
    },
    onError: (error: Error) => {
      toast.error(`Kunde inte markera som läst: ${error.message}`)
    },
  })
}

export const useSendMessage = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => messageService.sendMessage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] })
    },
    onError: (error: Error) => {
      toast.error(`Kunde inte skicka meddelande: ${error.message}`)
    },
  })
}

export const useDeleteMessages = (workspaceId: string | undefined) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageIds: string[]) => messageService.deleteMessages(messageIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] })
    },
    onError: (error: Error) => {
      toast.error(`Kunde inte radera meddelanden: ${error.message}`)
    },
  })
}
