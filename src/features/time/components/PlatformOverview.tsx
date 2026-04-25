import React from 'react'
import { Building2, CheckCircle2, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from './EmptyState'
import type { TimeReportUI } from '../types'

interface Workspace {
  id: string
  name: string
  type?: string
}

interface PlatformOverviewProps {
  dbWorkspaces: Workspace[]
  shifts: TimeReportUI[]
}

export const PlatformOverview: React.FC<PlatformOverviewProps> = ({ dbWorkspaces, shifts }) => {
  return (
    <div className="duration-400 relative flex h-full flex-1 flex-col bg-background animate-in fade-in slide-in-from-bottom-2">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 px-8">
        <h2 className="flex items-center gap-2.5 text-base font-semibold text-foreground">
          <div className="rounded-md bg-primary/10 p-1.5">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          Organisationer
        </h2>
      </div>
      <div className="scrollbar-none w-full flex-1 overflow-y-auto">
        {dbWorkspaces.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Inga organisationer"
            description="Det finns inga registrerade organisationer i systemet just nu."
          />
        ) : (
          dbWorkspaces.map((ws) => {
            const wsShifts = shifts.filter((s) => s.workspaceId === ws.id)
            const totalHours = wsShifts.reduce((acc, s) => acc + s.duration, 0)
            const pendingAttest = wsShifts.filter((s) => s.status === 'pending_attest').length

            return (
              <div
                key={ws.id}
                onClick={() => {}}
                className="group flex cursor-pointer items-center border-b border-border/40 px-8 py-4 transition-all duration-200 hover:bg-muted/50"
              >
                <div className="mr-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary/80 font-bold text-primary transition-colors group-hover:bg-primary/10">
                  <Building2 className="h-5 w-5" />
                </div>

                <div className="w-64 shrink-0 pr-4 md:w-80">
                  <div className="text-[15px] font-semibold text-foreground transition-colors group-hover:text-primary">
                    {ws.name}
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/80">
                    {ws.type || 'Företag'}
                  </div>
                </div>

                <div className="min-w-0 flex-1 pr-4"></div>

                <div className="flex w-32 shrink-0 flex-col items-end justify-center pr-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-foreground">{totalHours}</span>
                    <span className="text-[11px] font-medium uppercase text-muted-foreground">
                      h
                    </span>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-tighter text-muted-foreground/60">
                    Totalt klara
                  </span>
                </div>

                <div className="flex w-40 shrink-0 items-center justify-end pr-4">
                  {pendingAttest > 0 ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-400"
                    >
                      {pendingAttest} OATTESTERAT
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1.5 border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> ALLT KLART
                    </Badge>
                  )}
                </div>

                <div className="flex w-8 shrink-0 items-center justify-end text-muted-foreground/30 transition-all group-hover:translate-x-1 group-hover:text-foreground">
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
