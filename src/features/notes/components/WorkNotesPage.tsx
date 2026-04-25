import React, { useMemo, useState } from 'react'
import type { Json } from '@/types/database'
import {
  FileText,
  Search,
  ChevronRight,
  ChevronLeft,
  Users,
  History,
  Trash2,
  Check,
  PenSquare,
  Plus,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadNotes } from '@/hooks/useUnreadNotes'
import { useSearchParams } from 'react-router-dom'
import {
  useCreateNote,
  useDeleteNote,
  useMarkTeamNotesRead,
  useNoteTeams,
  useTeamNotes,
  useUpdateNote,
} from '@/hooks/queries/useNotes'
import { useBreadcrumbContext } from '@/contexts/BreadcrumbContext'

interface EditHistoryEntry {
  editedBy: string
  editedAt: string
  oldSubject?: string
  newSubject?: string
  oldContent?: string
  newContent?: string
  [key: string]: unknown
}

function getDiffSegments(oldStr: string, newStr: string) {
  const oldWords = oldStr.split(/(\s+)/)
  const newWords = newStr.split(/(\s+)/)

  const matrix = Array(oldWords.length + 1)
    .fill(null)
    .map(() => Array(newWords.length + 1).fill(0))

  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1])
      }
    }
  }

  const segments: { type: 'added' | 'removed' | 'unchanged'; text: string }[] = []
  let i = oldWords.length,
    j = newWords.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      segments.unshift({ type: 'unchanged', text: oldWords[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      segments.unshift({ type: 'added', text: newWords[j - 1] })
      j--
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      segments.unshift({ type: 'removed', text: oldWords[i - 1] })
      i--
    }
  }

  return segments
}

export const WorkNotesPage: React.FC = () => {
  const { t } = useTranslation()
  const { workspaceId } = useWorkspace()
  const { user } = useAuth()
  const unreadNotes = useUnreadNotes()
  const [searchParams] = useSearchParams()
  const userRole = (user?.role as 'platform_admin' | 'admin' | 'assistant') || 'admin'
  const notesScope = userRole === 'platform_admin' ? 'all' : workspaceId || null
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(searchParams.get('team'))
  const [activeNoteId, setActiveNoteId] = useState<string | null>(searchParams.get('note'))

  const { data: teams = [] } = useNoteTeams(workspaceId || undefined, userRole === 'platform_admin')
  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) || null,
    [teams, selectedTeamId],
  )
  const { data: teamNotes = [] } = useTeamNotes(selectedTeam?.id || null)
  const createNoteMutation = useCreateNote(notesScope, selectedTeam?.id || null)
  const updateNoteMutation = useUpdateNote(notesScope, selectedTeam?.id || null)
  const deleteNoteMutation = useDeleteNote(notesScope, selectedTeam?.id || null)
  const markTeamNotesReadMutation = useMarkTeamNotesRead()

  React.useEffect(() => {
    const teamId = searchParams.get('team')
    if (teamId) {
      setSelectedTeamId(teamId)
    }
  }, [searchParams])

  const notes = useMemo(() => {
    return teamNotes.map((dbNote) => {
      const createdAt = dbNote.created_at ? new Date(dbNote.created_at) : new Date()
      const authorData = Array.isArray(dbNote.author) ? dbNote.author[0] : dbNote.author
      const authorName =
        authorData?.full_name || authorData?.email || t('notes.general.unknown_agent')

      return {
        id: dbNote.id,
        teamId: dbNote.team_id,
        date: createdAt.toLocaleDateString(),
        timestamp: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        author: authorName,
        authorId: dbNote.author_id || '',
        subject: dbNote.subject,
        content: dbNote.content,
        editHistory: Array.isArray(dbNote.edit_history)
          ? (dbNote.edit_history as unknown as EditHistoryEntry[])
          : [],
      }
    })
  }, [teamNotes, t])

  React.useEffect(() => {
    if (selectedTeamId && !selectedTeam && teams.length > 0) {
      setSelectedTeamId(null)
    }
  }, [selectedTeamId, selectedTeam, teams.length])

  React.useEffect(() => {
    if (activeNoteId && !notes.some((note) => note.id === activeNoteId)) {
      setActiveNoteId(null)
    }
  }, [activeNoteId, notes])

  const currentUser = user?.id
  const { setDynamicBreadcrumbs } = useBreadcrumbContext()
  const [isComposing, setIsComposing] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [noteSearchQuery, setNoteSearchQuery] = useState('')
  const [composeText, setComposeText] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [expandedAudit, setExpandedAudit] = useState(false)

  React.useEffect(() => {
    const breadcrumbs = []
    if (selectedTeam) {
      breadcrumbs.push({
        label: selectedTeam.displayName || selectedTeam.name,
        onClick: () => {
          setActiveNoteId(null)
          setSelectedTeamId(null)
        },
      })
    }
    if (activeNoteId) {
      const note = notes.find((n) => n.id === activeNoteId)
      if (note) {
        breadcrumbs.push({ label: note.subject, onClick: () => {} })
      }
    } else if (isComposing) {
      breadcrumbs.push({ label: t('notes.compose.title') })
    }
    setDynamicBreadcrumbs(breadcrumbs)
  }, [selectedTeam, activeNoteId, isComposing, notes, setDynamicBreadcrumbs, t])

  React.useEffect(() => {
    return () => setDynamicBreadcrumbs([])
  }, [setDynamicBreadcrumbs])

  const activeNote = notes.find((n) => n.id === activeNoteId)

  const handleSaveNote = async () => {
    if (!selectedTeam || !composeSubject || !composeText || !user) return
    const targetWorkspaceId =
      userRole === 'platform_admin' ? selectedTeam.workspace_id : workspaceId
    if (!targetWorkspaceId) return

    if (editingNoteId) {
      const oldNote = notes.find((n) => n.id === editingNoteId)
      if (!oldNote) return

      const now = new Date()
      const timeStr =
        now.getHours().toString().padStart(2, '0') +
        ':' +
        now.getMinutes().toString().padStart(2, '0')

      const changeEntry: EditHistoryEntry = {
        editedBy: user?.name || user?.email || 'Unknown',
        editedAt: timeStr,
      }

      if (oldNote.subject !== composeSubject) {
        changeEntry.oldSubject = oldNote.subject
        changeEntry.newSubject = composeSubject
      }
      if (oldNote.content !== composeText) {
        changeEntry.oldContent = oldNote.content
        changeEntry.newContent = composeText
      }

      const newHistory = [changeEntry, ...oldNote.editHistory]

      await updateNoteMutation.mutateAsync({
        noteId: editingNoteId,
        subject: composeSubject,
        content: composeText,
        edit_history: newHistory as unknown as Json,
      })
    } else {
      await createNoteMutation.mutateAsync({
        workspace_id: targetWorkspaceId,
        team_id: selectedTeam.id,
        author_id: user.id,
        subject: composeSubject,
        content: composeText,
        edit_history: [],
      })
    }

    setIsComposing(false)
    setEditingNoteId(null)
    setComposeSubject('')
    setComposeText('')
  }

  const handleDeleteNote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm(t('notes.list.delete_confirm'))) {
      await deleteNoteMutation.mutateAsync(id)
      if (activeNoteId === id) setActiveNoteId(null)
    }
  }

  const handleEditNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const note = notes.find((n) => n.id === id)
    if (!note) return

    setComposeSubject(note.subject)
    setComposeText(note.content)
    setEditingNoteId(note.id)
    setIsComposing(true)
  }

  const renderTeamOverview = () => {
    let filteredTeams = teams

    if (searchQuery) {
      filteredTeams = filteredTeams.filter((t) =>
        (t.displayName || t.name).toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    return (
      <div className="relative flex h-full flex-1 flex-col bg-background">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-8">
          <h2 className="font-medium text-foreground">{t('notes.teams.title')}</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('notes.teams.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-lg border-none bg-muted pl-9 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="scrollbar-dark w-full flex-1 overflow-y-auto">
          {filteredTeams.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="mb-4 h-12 w-12 opacity-20" />
              <p className="text-sm">{t('notes.teams.empty_state')}</p>
            </div>
          ) : (
            filteredTeams.map((team) => {
              const unreadInTeam = unreadNotes?.byTeam[team.id] || 0
              return (
                <div
                  key={team.id}
                  onClick={async () => {
                    setSelectedTeamId(team.id)
                    setSearchQuery('')
                    if (unreadInTeam > 0 && user) {
                      await markTeamNotesReadMutation.mutateAsync({
                        teamId: team.id,
                        userId: user.id,
                      })
                    }
                  }}
                  className="group flex cursor-pointer items-center border-b border-border px-8 py-3 transition-colors hover:bg-muted"
                >
                  <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-secondary text-primary transition-colors">
                    <FileText className="relative h-5 w-5" />
                    {unreadInTeam > 0 && (
                      <div className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-sidebar bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    )}
                  </div>

                  <div className="w-64 shrink-0 pr-4 text-[15px] font-medium text-foreground md:w-80">
                    {team.displayName || team.name}
                    <div className="mt-0.5 flex items-center gap-2">
                      <div className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
                        {team.notesCount || 0} {t('notes.teams.notes_count')}
                      </div>
                      {unreadInTeam > 0 && (
                        <span className="rounded bg-red-500/10 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-red-500">
                          {unreadInTeam} {t('notes.teams.unread_badge')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center justify-end pr-4">
                    {team.recentNote && (
                      <div className="mr-4 text-right">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t('notes.teams.last_updated')}
                        </div>
                        <div className="mt-0.5 text-[13px] text-muted-foreground">
                          {new Date(team.recentNote).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex w-12 shrink-0 items-center justify-end gap-2 text-muted-foreground transition-colors group-hover:text-foreground">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // NOTE LIST (EDGE-TO-EDGE)
  const renderNoteList = () => {
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
        {/* Header Options */}
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

        {/* List */}
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

        {/* FAB Compose Button */}
        <div className="absolute bottom-8 right-8">
          <Button
            onClick={() => {
              setEditingNoteId(null)
              setComposeSubject('')
              setComposeText('')
              setIsComposing(true)
            }}
            className="flex h-12 items-center gap-2 rounded-full bg-white pl-5 pr-6 font-medium text-black shadow-xl shadow-black/50 transition-transform hover:scale-105 hover:bg-neutral-200"
          >
            <Plus className="h-5 w-5" /> {t('notes.list.new_note_button')}
          </Button>
        </div>
      </div>
    )
  }

  // READ VIEW (WITH AUDIT)
  const renderReadPane = () => {
    if (!activeNote) return null
    return (
      <div className="relative flex h-full flex-1 flex-col bg-background">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-sidebar px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveNoteId(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-medium text-foreground">{t('notes.read.title')}</h2>
          </div>

          <div className="flex items-center gap-2">
            {activeNote.authorId === currentUser && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={(e) => handleEditNote(e, activeNote.id)}
              >
                <PenSquare className="h-4 w-4" />
              </Button>
            )}
            {(activeNote.authorId === currentUser ||
              userRole === 'admin' ||
              userRole === 'platform_admin') && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-rose-400"
                onClick={(e) => handleDeleteNote(e, activeNote.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="scrollbar-dark flex-1 overflow-y-auto px-8 py-10 md:px-24 lg:px-48">
          <div className="mb-8 flex items-center justify-between border-b border-border pb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary font-semibold text-foreground">
                {activeNote.author.charAt(0)}
              </div>
              <div>
                <div className="mb-1 text-sm font-medium text-foreground">
                  {t('notes.read.written_by')} {activeNote.author}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('notes.read.published')} {activeNote.date} {t('notes.read.at_time')}{' '}
                  {activeNote.timestamp}
                </div>
              </div>
            </div>

            {/* Audit knapp */}
            <div className="flex items-center">
              {(userRole === 'admin' || userRole === 'platform_admin') && (
                <button
                  onClick={() => setExpandedAudit(!expandedAudit)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${activeNote.editHistory.length > 0 ? 'text-amber-500 hover:bg-amber-500/10' : 'bg-muted text-muted-foreground hover:text-muted-foreground'}`}
                >
                  <History className="h-3.5 w-3.5" />
                  {t('notes.read.history_button')}
                </button>
              )}
            </div>
          </div>

          {/* Audit Log (Expanderbar) */}
          {expandedAudit &&
            activeNote.editHistory.length > 0 &&
            (userRole === 'admin' || userRole === 'platform_admin') && (
              <div className="mb-10 overflow-hidden rounded-md border border-border bg-background p-0 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-amber-500" /> {t('notes.read.audit_log_title')}
                  </div>
                  <span className="text-[10px] font-normal opacity-70">
                    {activeNote.editHistory.length} {t('notes.read.changes_recorded')}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {activeNote.editHistory.map((h, i) => (
                    <div key={i} className="bg-background p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {h.editedBy.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-xs">
                            <span className="font-semibold text-foreground">{h.editedBy}</span>
                            <span className="ml-2 text-muted-foreground">
                              {activeNote.date} kl {h.editedAt}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-8 space-y-3">
                        {h.oldSubject && (
                          <div className="flex flex-col gap-1 text-[11px]">
                            <span className="font-medium uppercase tracking-tight text-muted-foreground opacity-70">
                              {t('notes.compose.subject_label')}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="max-w-[150px] truncate text-rose-400 line-through opacity-50">
                                {h.oldSubject}
                              </span>
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span className="max-w-[200px] truncate font-medium text-emerald-400">
                                {h.newSubject}
                              </span>
                            </div>
                          </div>
                        )}

                        {h.oldContent && h.newContent && (
                          <div className="flex flex-col gap-1 text-[11px]">
                            <span className="font-medium uppercase tracking-tight text-muted-foreground opacity-70">
                              {t('notes.compose.content_label')}
                            </span>
                            <div className="relative whitespace-pre-wrap rounded border border-border/50 bg-muted/50 p-3 font-mono text-[10px] leading-relaxed">
                              {getDiffSegments(h.oldContent, h.newContent).map((seg, idx) => (
                                <span
                                  key={idx}
                                  className={
                                    seg.type === 'added'
                                      ? 'rounded bg-emerald-500/20 px-0.5 text-emerald-400'
                                      : seg.type === 'removed'
                                        ? 'rounded bg-rose-500/20 px-0.5 text-rose-400 line-through opacity-70'
                                        : ''
                                  }
                                >
                                  {seg.text}
                                </span>
                              ))}
                              <div className="absolute right-2 top-1 text-[8px] font-bold uppercase opacity-20">
                                {t('notes.read.diff_label')}
                              </div>
                            </div>
                          </div>
                        )}

                        {!h.oldSubject && !h.oldContent && (
                          <div className="text-[10px] italic text-muted-foreground">
                            {t('notes.read.metadata_change')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <h3 className="mb-6 text-xl font-medium leading-tight text-foreground">
            {activeNote.subject}
          </h3>

          <div className="whitespace-pre-wrap text-[15px] leading-loose text-muted-foreground">
            {activeNote.content}
          </div>
        </div>
      </div>
    )
  }

  // COMPOSE PANE (CLEAN FULLSCREEN)
  const renderComposePane = () => {
    return (
      <div className="relative flex h-full flex-1 flex-col bg-background">
        <div className="flex h-16 items-center justify-between border-b border-border px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsComposing(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-medium text-foreground">
              {t('notes.compose.title')} {selectedTeam?.displayName || selectedTeam?.name}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsComposing(false)}
            >
              {t('notes.compose.cancel')}
            </Button>
            <Button
              className="rounded-full bg-primary pl-4 pr-5 text-white hover:bg-primary/80 dark:bg-[#0F1115] dark:hover:bg-[#1A1D24]"
              disabled={composeText.trim().length === 0}
              onClick={handleSaveNote}
            >
              <Check className="mr-2 h-4 w-4" />
              {t('notes.compose.save_button')}
            </Button>
          </div>
        </div>

        <div className="scrollbar-dark flex flex-1 flex-col gap-8 overflow-y-auto px-8 py-10 md:px-24 lg:px-48">
          {/* Subject Field */}
          <div className="flex flex-col border-b border-border pb-2 transition-colors">
            <label className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t('notes.compose.subject_label')}
            </label>
            <input
              placeholder={t('notes.compose.subject_placeholder')}
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              className="h-10 w-full border-none bg-transparent px-0 text-lg font-medium text-foreground placeholder:text-[15px] placeholder:font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
              autoFocus
            />
          </div>

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col pb-10">
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              className="min-h-[300px] w-full flex-1 resize-none border-none bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              placeholder={t('notes.compose.content_placeholder')}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-1 flex-col bg-background">
      {isComposing
        ? renderComposePane()
        : activeNoteId
          ? renderReadPane()
          : selectedTeam
            ? renderNoteList()
            : renderTeamOverview()}
    </div>
  )
}
