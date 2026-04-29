import React from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, ChevronRight } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { EmptyState } from './EmptyState'
import type { TimeReportUI, DevRole } from '../types'

interface AssistantTeamsProps {
  dbTeams: Team[]
  shifts: TimeReportUI[]
  activeRole: DevRole
  workspaceId: string | null
  openTeamShifts: (name: string) => void
}

interface Team {
  id: string
  name: string
  workspace_id: string
}

export const AssistantTeams: React.FC<AssistantTeamsProps> = ({
  dbTeams,
  shifts,
  activeRole,
  workspaceId,
  openTeamShifts,
}) => {
  const { t } = useTranslation()

  return (
    <div className="duration-400 relative flex h-full flex-1 flex-col bg-background animate-in fade-in slide-in-from-bottom-2">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 px-8">
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-foreground">
          <div className="rounded-md bg-primary/10 p-1.5">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          {t('timereports.my_teams_assignments')}
        </h2>
      </div>
      <div className="scrollbar-none w-full flex-1 overflow-y-auto">
        {dbTeams.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={t('timereports.no_teams')}
            description={t('timereports.no_teams_description')}
          />
        ) : (
          dbTeams
            .filter((t) => activeRole === 'platform_admin' || t.workspace_id === workspaceId)
            .map((team) => {
              const tSh = shifts.filter((s) => s.teamId === team.id)
              return {
                id: team.id,
                name: team.name,
                totalHours: tSh.reduce((a, b) => a + b.duration, 0),
                status: tSh.some((s) => s.status === 'pending_attest')
                  ? 'pending_attest'
                  : 'approved',
              }
            })
            .map((team) => (
              <div
                key={team.id}
                onClick={() => openTeamShifts(team.name)}
                className="group flex cursor-pointer items-center border-b border-border/40 px-8 py-4 transition-all duration-200 hover:bg-muted/50"
              >
                <div className="mr-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary/80 font-bold text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                  {team.name.charAt(0)}
                </div>

                <div className="w-64 shrink-0 pr-4 md:w-80">
                  <div className="text-[15px] font-semibold text-foreground transition-colors group-hover:text-primary">
                    {team.name}
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/80">
                    ID: {team.id.substring(0, 8)}...
                  </div>
                </div>

                <div className="min-w-0 flex-1 pr-4"></div>

                <div className="flex w-32 shrink-0 flex-col items-end justify-center pr-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-foreground">{team.totalHours}</span>
                    <span className="text-[11px] font-medium uppercase text-muted-foreground">
                      {t('timereports.hours_abbr')}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-tighter text-muted-foreground/60">
                    {t('timereports.total_time')}
                  </span>
                </div>

                <div className="flex w-40 shrink-0 items-center justify-end pr-4">
                  <StatusBadge status={team.status} />
                </div>

                <div className="flex w-8 shrink-0 items-center justify-end text-muted-foreground/30 transition-all group-hover:translate-x-1 group-hover:text-foreground">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
