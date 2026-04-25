import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface JournalNote {
  id: string
  content: string
  created_at: string
  author?: {
    full_name: string | null
  }
}

export const JournalTab: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [notes, setNotes] = useState<JournalNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const fetchNotes = React.useCallback(async () => {
    try {
      const { data } = await supabase
        .from('client_journals')
        .select('*, author:users(full_name)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      if (data) setNotes(data as unknown as JournalNote[])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchNotes()
  }, [clientId, fetchNotes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    setIsSubmitting(true)
    try {
      await supabase.from('client_journals').insert({
        client_id: clientId,
        author_id: user?.id,
        type: 'daily',
        content: newNote,
      })
      setNewNote('')
      fetchNotes()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-sidebar p-4">
        <h3 className="mb-3 text-sm font-medium">Skriv ny daganteckning</h3>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="mb-3 min-h-[100px] w-full rounded-lg border border-border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Beskriv hur dagen varit..."
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || !newNote.trim()}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Spara
            anteckning
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="border-b border-border pb-2 text-lg font-semibold">Tidigare anteckningar</h3>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-sidebar py-8 text-center text-muted-foreground">
            Inga anteckningar hittades
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-xl border border-border bg-sidebar p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-primary">
                  {note.author?.full_name || 'Okänd'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(note.created_at).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
