import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { noteService } from '@/services/noteService'
import type { Json } from '@/types/database'


export function useNoteTeams(workspaceId?: string, includeAllWorkspaces = false) {
  const scope = includeAllWorkspaces ? 'all' : workspaceId || null
  const effectiveWorkspaceId = includeAllWorkspaces ? undefined : workspaceId


  return useQuery({
    queryKey: queryKeys.noteTeams(scope),
    queryFn: () => noteService.getNoteTeams(effectiveWorkspaceId),
    enabled: includeAllWorkspaces || !!workspaceId,
  })
}

export function useTeamNotes(teamId: string | null) {
  const queryKey = useMemo(() => queryKeys.teamNotes(teamId), [teamId])


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
