import React from 'react'
import { useTranslation } from 'react-i18next'
import { User, ChevronRight } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { EmptyState } from './EmptyState'
import type { TimeReportUI } from '../types'

interface TeamUser {
  id: string
  full_name: string | null
  email?: string
  role?: string
}

interface TeamOverviewProps {
  dbUsers: TeamUser[]
  shifts: TimeReportUI[]
  loading: boolean
  openEmployeeShifts: (id: string) => void
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({
  dbUsers,
  shifts,
  loading,
  openEmployeeShifts,
}) => {
  const { t } = useTranslation()

  return (
    <div className="duration-400 relative flex h-full flex-1 flex-col bg-background animate-in fade-in slide-in-from-bottom-2">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 px-8">
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-foreground">
          <div className="rounded-md bg-primary/10 p-1.5">
            <User className="h-4 w-4 text-primary" />
          </div>
          {t('timereports.team_members')}
        </h2>
      </div>
      <div className="scrollbar-none w-full flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex w-full flex-col">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex w-full animate-pulse items-center border-b border-border/40 px-8 py-4"
              >
                <div className="mr-5 h-11 w-11 shrink-0 rounded-lg bg-muted" />
                <div className="w-64 shrink-0 pr-4 md:w-80">
                  <div className="mb-2 h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted/60" />
                </div>
                <div className="min-w-0 flex-1 pr-4" />
                <div className="flex w-32 shrink-0 flex-col items-end justify-center pr-4">
                  <div className="mb-1 h-5 w-12 rounded bg-muted" />
                  <div className="h-2 w-16 rounded bg-muted/60" />
                </div>
                <div className="flex w-40 shrink-0 items-center justify-end pr-4">
                  <div className="h-6 w-24 rounded-full bg-muted" />
                </div>
                <div className="flex w-8 shrink-0 items-center justify-end">
                  <div className="h-5 w-5 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : dbUsers.length === 0 ? (
          <EmptyState
            icon={User}
            title={t('timereports.no_members')}
            description={t('timereports.no_members_desc')}
          />
        ) : (
          dbUsers
            .map((u) => {
              const eSh = shifts.filter((s) => s.employeeId === u.id)
              const statusStr =
                eSh.length === 0
                  ? 'not_submitted'
                  : eSh.some((s) => s.status === 'pending_attest')
                    ? 'pending_attest'
                    : 'approved'
              return {
                id: u.id,
                name: u.full_name || u.email || t('common.unknown_agent'),
                role: u.role === 'admin' ? t('directory.roles.admin') : t('directory.roles.assistant'),
                totalHours: eSh.reduce((a, b) => a + b.duration, 0),
                status: statusStr,
              }
            })
            .map((emp) => (
              <div
                key={emp.id}
                onClick={() => openEmployeeShifts(emp.id)}
                className="group flex cursor-pointer items-center border-b border-border/40 px-8 py-4 transition-all duration-200 hover:bg-muted/50"
              >
                <div className="mr-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary/80 font-bold text-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                  {emp.name.charAt(0)}
                </div>

                <div className="w-64 shrink-0 pr-4 md:w-80">
                  <div className="text-[15px] font-semibold text-foreground transition-colors group-hover:text-primary">
                    {emp.name}
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/80">
                    {emp.role}
                  </div>
                </div>

                <div className="min-w-0 flex-1 pr-4"></div>

                <div className="flex w-32 shrink-0 flex-col items-end justify-center pr-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-foreground">{emp.totalHours}</span>
                    <span className="text-[11px] font-medium uppercase text-muted-foreground">
                      {t('timereports.hours_abbr')}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-tighter text-muted-foreground/60">
                    {t('timereports.reported')}
                  </span>
                </div>

                <div className="flex w-40 shrink-0 items-center justify-end pr-4">
                  <StatusBadge status={emp.status} />
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
