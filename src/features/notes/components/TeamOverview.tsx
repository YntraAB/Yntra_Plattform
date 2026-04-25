import React from 'react'
import { Search, Users, FileText, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import type { UnreadNotesMap } from '@/hooks/useUnreadNotes'
import type { NoteTeam } from '../types'

interface TeamOverviewProps {
  teams: NoteTeam[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  unreadNotes: UnreadNotesMap
  handleSelectTeam: (teamId: string) => void
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({
  teams,
  searchQuery,
  setSearchQuery,
  unreadNotes,
  handleSelectTeam,
}) => {
  const { t } = useTranslation()

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
                onClick={() => handleSelectTeam(team.id)}
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
