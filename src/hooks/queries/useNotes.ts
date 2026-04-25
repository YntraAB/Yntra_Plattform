import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import { noteService } from '@/services/noteService'
import type { Json } from '@/types/database'

function useNoteTeamsRealtime(scope: string | null, workspaceId?: string) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => queryKeys.noteTeams(scope), [scope])

  useEffect(() => {
    if (!scope) return

    const channelId = `note-teams-${scope}-${Math.random().toString(36).slice(2, 9)}`
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          ...(workspaceId ? { filter: `workspace_id=eq.${workspaceId}` } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          ...(workspaceId ? { filter: `workspace_id=eq.${workspaceId}` } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [scope, workspaceId, queryClient, queryKey])
}

export function useNoteTeams(workspaceId?: string, includeAllWorkspaces = false) {
  const scope = includeAllWorkspaces ? 'all' : workspaceId || null
  const effectiveWorkspaceId = includeAllWorkspaces ? undefined : workspaceId

  useNoteTeamsRealtime(scope, effectiveWorkspaceId)

  return useQuery({
    queryKey: queryKeys.noteTeams(scope),
    queryFn: () => noteService.getNoteTeams(effectiveWorkspaceId),
    enabled: includeAllWorkspaces || !!workspaceId,
  })
}

export function useTeamNotes(teamId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => queryKeys.teamNotes(teamId), [teamId])

  useEffect(() => {
    if (!teamId) return

    const channelId = `team-notes-${teamId}-${Math.random().toString(36).slice(2, 9)}`
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [teamId, queryClient, queryKey])

  return useQuery({
    queryKey,
    queryFn: () => noteService.getTeamNotes(teamId!),
    enabled: !!teamId,
  })
}

export function useCreateNote(noteScope: string | null, teamId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      workspace_id: string
      team_id: string
      author_id: string
      subject: string
      content: string
      edit_history: Json
    }) => noteService.createNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.noteTeams(noteScope) })
      queryClient.invalidateQueries({ queryKey: queryKeys.teamNotes(teamId) })
    },
  })
}

export function useUpdateNote(noteScope: string | null, teamId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      noteId,
      subject,
      content,
      edit_history,
    }: {
      noteId: string
      subject: string
      content: string
      edit_history: Json
    }) => noteService.updateNote(noteId, { subject, content, edit_history }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.noteTeams(noteScope) })
      queryClient.invalidateQueries({ queryKey: queryKeys.teamNotes(teamId) })
    },
  })
}

export function useDeleteNote(noteScope: string | null, teamId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noteId: string) => noteService.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.noteTeams(noteScope) })
      queryClient.invalidateQueries({ queryKey: queryKeys.teamNotes(teamId) })
    },
  })
}

export function useMarkTeamNotesRead() {
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      noteService.markTeamNotesRead(teamId, userId),
  })
}
