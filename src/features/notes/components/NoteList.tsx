import React from 'react'
import { Search, FileText, ChevronLeft, PenSquare, Trash2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import type { Note, NoteTeam } from '../types'

interface NoteListProps {
  selectedTeam: NoteTeam | null
  notes: Note[]
  noteSearchQuery: string
  setNoteSearchQuery: (query: string) => void
  setSelectedTeamId: (id: string | null) => void
  setActiveNoteId: (id: string | null) => void
  startComposing: () => void
  handleEditNote: (e: React.MouseEvent, id: string) => void
  handleDeleteNote: (e: React.MouseEvent, id: string) => void
  currentUser: string | undefined
  userRole: string
}

export const NoteList: React.FC<NoteListProps> = ({
  selectedTeam,
  notes,
  noteSearchQuery,
  setNoteSearchQuery,
  setSelectedTeamId,
  setActiveNoteId,
  startComposing,
  handleEditNote,
  handleDeleteNote,
  currentUser,
  userRole,
}) => {
  const { t } = useTranslation()

  if (!selectedTeam) return null

  let filteredNotes = notes.filter((n) => n.teamId === selectedTeam.id)
  if (noteSearchQuery) {
    filteredNotes = filteredNotes.filter(
      (n) =>
        n.subject.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(noteSearchQuery.toLowerCase()),
    )
  }

  return (
    <div className="relative flex h-full flex-1 flex-col bg-background">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedTeamId(null)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-medium text-foreground">
            {selectedTeam.displayName || selectedTeam.name} {t('notes.list.title_suffix')}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('notes.list.search_placeholder')}
              value={noteSearchQuery}
              onChange={(e) => setNoteSearchQuery(e.target.value)}
              className="h-8 rounded-full border-none bg-muted pl-9 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="scrollbar-dark w-full flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <FileText className="mb-4 h-12 w-12 opacity-20" />
            <p className="text-sm">{t('notes.list.empty_state')}</p>
          </div>
        ) : (
          <div className="flex w-full flex-col text-sm">
            {filteredNotes.map((note) => {
              const canEdit = note.authorId === currentUser
              const canDelete = canEdit || userRole === 'admin' || userRole === 'platform_admin'

              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className="group flex cursor-pointer items-center border-b border-border px-8 py-4 transition-colors hover:bg-muted"
                >
                  <div className={`w-40 shrink-0 truncate pr-4 font-medium text-foreground`}>
                    {note.author}
                  </div>

                  <div className="flex min-w-0 flex-1 items-center truncate pr-4">
                    <span className="mr-2 font-medium text-foreground">{note.subject}</span>
                    <span className="truncate text-muted-foreground">- {note.content}</span>
                  </div>

                  <div className="flex w-48 shrink-0 items-center justify-end">
                    <div className="mr-4 hidden items-center gap-3 text-muted-foreground group-hover:flex">
                      {canEdit && (
                        <PenSquare
                          className="h-[18px] w-[18px] transition-colors hover:text-foreground"
                          onClick={(e) => handleEditNote(e, note.id)}
                        />
                      )}
                      {canDelete && (
                        <Trash2
                          className="h-[18px] w-[18px] transition-colors hover:text-rose-400"
                          onClick={(e) => handleDeleteNote(e, note.id)}
                        />
                      )}
                    </div>
                    <span className="text-sm tracking-wide text-muted-foreground transition-colors group-hover:text-foreground">
                      {note.date === t('notes.list.today') ? note.timestamp : note.date}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="absolute bottom-8 right-8">
        <Button
          onClick={startComposing}
          className="flex h-12 items-center gap-2 rounded-full bg-white pl-5 pr-6 font-medium text-black shadow-xl shadow-black/50 transition-transform hover:scale-105 hover:bg-neutral-200"
        >
          <Plus className="h-5 w-5" /> {t('notes.list.new_note_button')}
        </Button>
      </div>
    </div>
  )
}
