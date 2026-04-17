import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from './EmptyState';
import type { TimeReportUI, DevRole } from '../types';

interface AssistantTeamsProps {
  dbTeams: any[];
  shifts: TimeReportUI[];
  activeRole: DevRole;
  workspaceId: string | null;
  openTeamShifts: (name: string) => void;
}

export const AssistantTeams: React.FC<AssistantTeamsProps> = ({ dbTeams, shifts, activeRole, workspaceId, openTeamShifts }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-background relative animate-in fade-in slide-in-from-bottom-2 duration-400">
      <div className="h-16 px-8 flex items-center justify-between border-b border-border/50 shrink-0">
        <h2 className="text-foreground font-semibold text-base flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          Mina Team / Uppdrag
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto w-full scrollbar-none">
        {dbTeams.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Inga team"
            description="Du har inte blivit tilldelad några team eller uppdrag ännu."
          />
        ) : (
          dbTeams.filter(t => activeRole === 'platform_admin' || t.workspace_id === workspaceId).map(team => {
            const tSh = shifts.filter(s => s.teamId === team.id);
            return {
              id: team.id,
              name: team.name,
              totalHours: tSh.reduce((a, b) => a + b.duration, 0),
              status: tSh.some(s => s.status === 'pending_attest') ? 'pending_attest' : 'approved'
            };
          }).map(team => (
            <div
              key={team.id}
              onClick={() => openTeamShifts(team.name)}
              className="group flex items-center px-8 py-4 border-b border-border/40 hover:bg-muted/50 cursor-pointer transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-lg bg-secondary/80 flex items-center justify-center text-primary font-bold mr-5 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                {team.name.charAt(0)}
              </div>

              <div className="w-64 md:w-80 shrink-0 pr-4">
                <div className="text-foreground font-semibold text-[15px] group-hover:text-primary transition-colors">{team.name}</div>
                <div className="text-[11px] text-muted-foreground/80 font-medium uppercase tracking-widest mt-0.5">
                  ID: {team.id.substring(0, 8)}...
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-4"></div>

              <div className="w-32 shrink-0 pr-4 flex flex-col items-end justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-foreground">{team.totalHours}</span>
                  <span className="text-[11px] text-muted-foreground font-medium uppercase">h</span>
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-tighter">Total tid</span>
              </div>

              <div className="w-40 shrink-0 pr-4 flex items-center justify-end">
                <StatusBadge status={team.status} />
              </div>

              <div className="w-8 shrink-0 flex items-center justify-end text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-1 transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
