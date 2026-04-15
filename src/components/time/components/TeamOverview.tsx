import React from 'react';
import { User, Loader2, ChevronRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from './EmptyState';
import type { TimeReportUI } from '../types';

interface TeamOverviewProps {
  dbUsers: any[];
  shifts: TimeReportUI[];
  loading: boolean;
  openEmployeeShifts: (id: string) => void;
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({ dbUsers, shifts, loading, openEmployeeShifts }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-background relative animate-in fade-in slide-in-from-bottom-2 duration-400">
      <div className="h-16 px-8 flex items-center justify-between border-b border-border/50 shrink-0">
        <h2 className="text-foreground font-semibold text-base flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10">
            <User className="w-4 h-4 text-primary" />
          </div>
          Teammedlemmar
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto w-full scrollbar-none">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
          </div>
        ) : dbUsers.length === 0 ? (
          <EmptyState
            icon={User}
            title="Inga teammedlemmar"
            description="Det finns inga anställda registrerade i detta team."
          />
        ) : (
          dbUsers.map(u => {
            const eSh = shifts.filter(s => s.employeeId === u.id);
            const statusStr = eSh.length === 0 ? 'not_submitted' : (eSh.some(s => s.status === 'pending_attest') ? 'pending_attest' : 'approved');
            return {
              id: u.id,
              name: u.full_name || u.email || 'Okänd Agent',
              role: u.role === 'admin' ? 'Administratör' : 'Assistent',
              totalHours: eSh.reduce((a, b) => a + b.duration, 0),
              status: statusStr
            };
          }).map((emp) => (
            <div
              key={emp.id}
              onClick={() => openEmployeeShifts(emp.id)}
              className="group flex items-center px-8 py-4 border-b border-border/40 hover:bg-muted/50 cursor-pointer transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-lg bg-secondary/80 flex items-center justify-center text-foreground font-bold mr-5 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                {emp.name.charAt(0)}
              </div>

              <div className="w-64 md:w-80 shrink-0 pr-4">
                <div className="text-foreground font-semibold text-[15px] group-hover:text-primary transition-colors">{emp.name}</div>
                <div className="text-[11px] text-muted-foreground/80 font-medium uppercase tracking-widest mt-0.5">
                  {emp.role}
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-4"></div>

              <div className="w-32 shrink-0 pr-4 flex flex-col items-end justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-foreground">{emp.totalHours}</span>
                  <span className="text-[11px] text-muted-foreground font-medium uppercase">h</span>
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-tighter">Rapporterat</span>
              </div>

              <div className="w-40 shrink-0 pr-4 flex items-center justify-end">
                <StatusBadge status={emp.status} />
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
