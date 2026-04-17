import React, { useMemo } from 'react';
import {
  Check, ChevronLeft, ChevronRight, Search, Trash2,
  FileCheck, Calendar, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from './StatusBadge';
import { EmptyState } from './EmptyState';
import type { TimeReportUI } from '../types';

interface ShiftSystemProps {
  shifts: TimeReportUI[];
  selectedContext: { type: 'employee' | 'team' | null, id: string | null };
  searchQuery: string;
  filterType: string;
  currentPage: number;
  selectedShifts: string[];
  listMode: 'current' | 'history';
  isDeleteAlertOpen: boolean;
  hasApprovePermission: boolean;
  setListMode: (mode: 'current' | 'history') => void;
  setFilterType: (type: string) => void;
  setSearchQuery: (q: string) => void;
  setCurrentPage: (p: number | ((prev: number) => number)) => void;
  setSelectedShifts: (s: string[] | ((prev: string[]) => string[])) => void;
  setIsDeleteAlertOpen: (open: boolean) => void;
  handleApprove: () => void;
  handleDelete: () => void;
}

export const ShiftSystem: React.FC<ShiftSystemProps> = ({
  shifts, selectedContext, searchQuery, filterType, currentPage, selectedShifts,
  listMode, isDeleteAlertOpen, hasApprovePermission, setListMode, setFilterType,
  setSearchQuery, setCurrentPage, setSelectedShifts, setIsDeleteAlertOpen,
  handleApprove, handleDelete
}) => {
  let contextShifts = shifts;
  if (selectedContext.type === 'employee') {
    contextShifts = shifts.filter(s => s.employeeId === selectedContext.id);
  } else if (selectedContext.type === 'team') {
    contextShifts = shifts.filter(s => s.team === selectedContext.id);
  }

  const filteredShifts = useMemo(() => {
    return contextShifts.filter(s => {
      const searchMatch = s.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.team.toLowerCase().includes(searchQuery.toLowerCase());

      let statusMatch = true;
      if (filterType !== 'all') {
        statusMatch = s.status === filterType;
      }

      return searchMatch && statusMatch;
    });
  }, [contextShifts, searchQuery, filterType]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredShifts.length / itemsPerPage));
  const currentShifts = filteredShifts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isAllSelected = filteredShifts.length > 0 && selectedShifts.length === filteredShifts.length;
  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedShifts([]);
    else setSelectedShifts(filteredShifts.map(s => s.id));
  };

  const toggleSelect = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setSelectedShifts(prev => Array.isArray(prev) ? (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]) : [id]);
  };

  const renderHistory = () => {
    let history = shifts.filter(s => s.status === 'approved').map(s => {
      const d = new Date(s.date);
      const monthStr = d.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
      return {
        id: 'h' + s.id, employeeId: s.employeeId, teamId: s.team, month: monthStr.charAt(0).toUpperCase() + monthStr.slice(1), hours: s.duration, ob: 0, absence: 0, salary: '-'
      };
    });
    if (selectedContext.type === 'employee') {
      history = history.filter(h => h.employeeId === selectedContext.id);
    } else if (selectedContext.type === 'team') {
      history = history.filter(h => h.teamId === selectedContext.id);
    }

    return (
      <div className="flex-1 overflow-y-auto w-full scrollbar-none animate-in fade-in slide-in-from-bottom-2 duration-400">
        {history.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Ingen historik"
            description="Det finns inga tidigare godkända rapporter för detta urval."
          />
        ) : (
          history.map(h => (
            <div key={h.id} className="group flex items-center px-8 py-5 border-b border-border/40 hover:bg-muted/50 transition-all">
              <div className="w-11 h-11 rounded-lg bg-emerald-500/5 flex items-center justify-center text-emerald-500 font-bold mr-5 shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="w-56 shrink-0 pr-4">
                <div className="text-foreground font-semibold text-[15px]">{h.month}</div>
                <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ATTESTERAD
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-4 flex items-center gap-10">
                <div className="flex flex-col gap-1">
                  <div className="text-muted-foreground/50 text-[10px] uppercase font-bold tracking-widest">Arbetstid</div>
                  <div className="text-foreground font-mono font-bold text-[14px]">{h.hours}h</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-muted-foreground/50 text-[10px] uppercase font-bold tracking-widest">OB-Tillägg</div>
                  <div className="text-foreground font-mono font-bold text-[14px]">{h.ob}h</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-rose-400/40 text-[10px] uppercase font-bold tracking-widest">Frånvaro</div>
                  <div className="text-foreground font-mono font-bold text-[14px]">{h.absence > 0 ? `${h.absence}h` : '-'}</div>
                </div>
              </div>

              <div className="w-48 shrink-0 flex flex-col items-end justify-center pr-6">
                <div className="text-muted-foreground/50 text-[10px] uppercase font-bold tracking-widest mb-0.5">Lön före skatt</div>
                <span className="text-[16px] font-bold text-foreground">{h.salary}</span>
              </div>

              <div className="w-8 shrink-0 flex items-center justify-end text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-1 transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative animate-in fade-in duration-300">
      <div className="h-14 px-8 flex items-center border-b border-border/50 shrink-0 gap-8">
        <button
          onClick={() => setListMode('current')}
          className={`h-full border-b-2 text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${listMode === 'current' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground/70'}`}
        >
          Aktuella tidsrapporter
        </button>
        <button
          onClick={() => setListMode('history')}
          className={`h-full border-b-2 text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${listMode === 'history' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground/70'}`}
        >
          Tidigare månader
        </button>
      </div>

      {listMode === 'history' ? (
        renderHistory()
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-16 px-8 flex items-center justify-between border-b border-border/50 shrink-0">
            <div className="flex items-center gap-5">
              <div className="w-8 flex justify-center cursor-pointer group" onClick={toggleSelectAll}>
                <div className={`w-4.5 h-4.5 rounded-[5px] border-2 transition-all ${isAllSelected ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/50'} flex items-center justify-center`}>
                  {isAllSelected && <Check className="w-3.5 h-3.5 text-primary-foreground stroke-[3]" />}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[160px] h-9 bg-muted/30 border-none font-semibold text-xs focus:ring-1 focus:ring-primary/20">
                    <SelectValue placeholder="Filtrera status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla Rapporter</SelectItem>
                    <SelectItem value="pending_attest">Väntar ({filteredShifts.filter(s => s.status === 'pending_attest').length})</SelectItem>
                    <SelectItem value="approved">Godkända ({filteredShifts.filter(s => s.status === 'approved').length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedShifts.length > 0 && (
                <div className="flex items-center gap-2 border-l border-border/50 ml-2 pl-5 animate-in fade-in slide-in-from-left-2 duration-300">
                  {hasApprovePermission && (
                    <Button onClick={handleApprove} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-8 text-xs px-4 shadow-lg shadow-emerald-500/20">
                      <FileCheck className="w-3.5 h-3.5 mr-2" /> Godkänn ({selectedShifts.length})
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    onClick={() => setIsDeleteAlertOpen(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-5">
              <div className="relative w-56 hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  placeholder="Sök rapporter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/40 border-none text-foreground h-9 rounded-lg text-xs font-medium focus-visible:ring-1 focus-visible:ring-primary/30"
                />
              </div>
              <div className="flex items-center gap-3 text-muted-foreground/60">
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-[11px] font-bold tracking-widest">{currentPage} / {totalPages}</span>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto w-full scrollbar-none">
            {filteredShifts.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Inga tidsrapporter"
                description="Vi hittade inga tidsrapporter som matchar dina kriterier."
              />
            ) : (
              currentShifts.map((shift) => {
                const isSelected = selectedShifts.includes(shift.id);
                return (
                  <div
                    key={shift.id}
                    className={`group flex items-center px-8 py-3.5 border-b border-border/40 hover:bg-muted/50 transition-all duration-200 ${isSelected ? 'bg-primary/5' : ''}`}
                  >
                    <div className="w-8 shrink-0 flex justify-center p-1 cursor-pointer" onClick={(e) => toggleSelect(shift.id, e)}>
                      <div className={`w-[18px] h-[18px] rounded-[5px] border-2 transition-all ${isSelected ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/40'} flex items-center justify-center`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground stroke-[3]" />}
                      </div>
                    </div>

                    <div className="w-48 md:w-64 shrink-0 truncate pr-4 text-foreground font-semibold ml-3 text-[15px]">
                      <div className="group-hover:text-primary transition-colors">
                        {selectedContext.type === 'team' ? shift.employee : shift.team}
                      </div>
                      <div className="text-[11px] text-muted-foreground/70 font-medium uppercase tracking-widest mt-0.5">
                        {selectedContext.type === 'team' ? shift.role : 'Brukare'}
                      </div>
                    </div>

                    <div className="flex-1 flex items-center min-w-0 pr-4">
                      <div className="text-foreground font-mono font-bold text-[13px] bg-secondary/60 px-2.5 py-1.5 rounded-md border border-border/40">
                        {shift.start} - {shift.end}
                      </div>
                      <div className="ml-5 flex items-baseline gap-1.5">
                        <span className="text-[16px] font-black text-foreground">{shift.duration}</span>
                        <span className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-tighter">h</span>
                      </div>
                    </div>

                    <div className="w-40 shrink-0 pr-4 flex items-center justify-end">
                      <StatusBadge status={shift.status} />
                    </div>

                    <div className="w-[120px] shrink-0 text-right flex items-center justify-end gap-3 text-[14px]">
                      <span className="text-foreground font-bold font-mono text-[13px]">{shift.date}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du helt säker?</AlertDialogTitle>
            <AlertDialogDescription>
              Du håller på att radera {selectedShifts.length} tidsrapporter. Denna åtgärd går inte att ångra och rapporterna kommer att tas bort permanent från systemet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-500 hover:bg-rose-600 text-white font-bold">
              Ja, radera rapporter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
