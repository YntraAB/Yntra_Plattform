import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assistanceService, type JournalNote } from '@/services/assistanceService'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

export const JournalTab: React.FC<{ clientId: string }> = ({ clientId }) => {
  const { t } = useTranslation()
  const [newNote, setNewNote] = useState('')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch notes using TanStack Query
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['journals', clientId],
    queryFn: () => assistanceService.getJournalNotes(clientId),
  })

  // Mutation with optimistic updates
  const mutation = useMutation({
    mutationFn: (content: string) =>
      assistanceService.createJournalNote({
        client_id: clientId,
        author_id: user?.id,
        content,
      }),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['journals', clientId] })
      const previousNotes = queryClient.getQueryData<JournalNote[]>(['journals', clientId])
      const optimisticNote: JournalNote = {
        id: 'temp-' + Date.now(),
        client_id: clientId,
        author_id: user?.id,
        content,
        created_at: new Date().toISOString(),
        author: { full_name: user?.full_name || 'You' },
      }

      queryClient.setQueryData<JournalNote[]>(['journals', clientId], (old) => [
        optimisticNote,
        ...(old || []),
      ])

      return { previousNotes }
    },
    onError: (_err, _content, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(['journals', clientId], context.previousNotes)
      }
      toast.error(t('assistance.journal.save_error'))
    },
    onSuccess: () => {
      toast.success(t('assistance.journal.save_success'))
      setNewNote('')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['journals', clientId] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || mutation.isPending) return
    mutation.mutate(newNote)
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <h3 className="relative mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Send className="h-4 w-4 text-primary" />
          {t('assistance.journal.write_new_note')}
        </h3>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="relative mb-4 min-h-[120px] w-full resize-none rounded-xl border border-border bg-background/50 p-4 text-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10"
          placeholder={t('assistance.journal.placeholder')}
        />
        <div className="relative flex justify-end">
          <Button
            type="submit"
            disabled={mutation.isPending || !newNote.trim()}
            className="rounded-full bg-primary px-6 font-medium text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {t('assistance.journal.save_note')}
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          {t('assistance.journal.previous_notes')}
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
            {notes.length}
          </span>
        </h3>
        {isLoading && notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            <p className="mt-4 text-sm text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center transition-all hover:bg-muted/50">
            <p className="text-sm font-medium text-muted-foreground">{t('assistance.journal.no_notes')}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 p-1">
                      <div className="h-full w-full rounded-full bg-primary/20" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-foreground">
                        {note.author?.full_name || t('assistance.journal.unknown_author')}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-tighter text-muted-foreground">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-3 top-0 h-full w-1 rounded-full bg-primary/10 transition-all group-hover:bg-primary/30" />
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {note.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
