import React from 'react';
import { Building2, CheckCircle2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from './EmptyState';
import type { TimeReportUI } from '../types';

interface PlatformOverviewProps {
  dbWorkspaces: any[];
  shifts: TimeReportUI[];
}

export const PlatformOverview: React.FC<PlatformOverviewProps> = ({ dbWorkspaces, shifts }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-background relative animate-in fade-in slide-in-from-bottom-2 duration-400">
      <div className="h-16 px-8 flex items-center justify-between border-b border-border/50 shrink-0">
        <h2 className="text-foreground font-semibold text-base flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          Organisationer
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto w-full scrollbar-none">
        {dbWorkspaces.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Inga organisationer"
            description="Det finns inga registrerade organisationer i systemet just nu."
          />
        ) : (
          dbWorkspaces.map((ws) => {
            const wsShifts = shifts.filter(s => s.workspaceId === ws.id);
            const totalHours = wsShifts.reduce((acc, s) => acc + s.duration, 0);
            const pendingAttest = wsShifts.filter(s => s.status === 'pending_attest').length;

            return (
              <div
                key={ws.id}
                onClick={() => { }}
                className="group flex items-center px-8 py-4 border-b border-border/40 hover:bg-muted/50 cursor-pointer transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-lg bg-secondary/80 flex items-center justify-center text-primary font-bold mr-5 shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>

                <div className="w-64 md:w-80 shrink-0 pr-4">
                  <div className="text-foreground font-semibold text-[15px] group-hover:text-primary transition-colors">{ws.name}</div>
                  <div className="text-[11px] text-muted-foreground/80 font-medium uppercase tracking-widest mt-0.5">
                    {ws.type || 'Företag'}
                  </div>
                </div>

                <div className="flex-1 min-w-0 pr-4"></div>

                <div className="w-32 shrink-0 pr-4 flex flex-col items-end justify-center">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-foreground">{totalHours}</span>
                    <span className="text-[11px] text-muted-foreground font-medium uppercase">h</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-tighter">Totalt klara</span>
                </div>

                <div className="w-40 shrink-0 pr-4 flex items-center justify-end">
                  {pendingAttest > 0 ? (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-2.5 py-1 text-[10px] font-bold">
                      {pendingAttest} OATTESTERAT
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ALLT KLART
                    </Badge>
                  )}
                </div>

                <div className="w-8 shrink-0 flex items-center justify-end text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-1 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
