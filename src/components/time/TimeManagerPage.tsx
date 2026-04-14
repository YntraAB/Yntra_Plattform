import React, { useState, useEffect } from 'react';
import { 
  Check, ChevronLeft, ChevronRight, Search, Trash2, 
  FileCheck, User, Calendar, Building2, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';

// No mock arrays anymore, everything is computed dynamically from shifts.

type DevRole = 'platform_admin' | 'admin' | 'assistant';
type NavLevel = 'platform_overview' | 'team_overview' | 'assistant_teams' | 'shift_list';

interface TimeManagerPageProps {
  setBreadcrumbNode?: (node: React.ReactNode) => void;
}

export const TimeManagerPage: React.FC<TimeManagerPageProps> = ({ 
  setBreadcrumbNode 
}) => {
  const { workspaceId } = useWorkspace();
  const { user } = useAuth();
  
  const activeRole: DevRole = (user as any)?.user_metadata?.role as DevRole || 'admin';
  const [shifts, setShifts] = useState<any[]>([]);
  // @ts-ignore
  const [dbTeams, setDbTeams] = useState<any[]>([]);

  const [currentLevel, setCurrentLevel] = useState<NavLevel>('team_overview');
  const [selectedContext, setSelectedContext] = useState<{ type: 'employee' | 'team' | null, id: string | null }>({ type: null, id: null });

  const [filterType, setFilterType] = useState('pending_attest');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [listMode, setListMode] = useState<'current' | 'history'>('current');

  useEffect(() => {
    async function fetchData() {
      if (!workspaceId) return;
      // Fetch teams
      const { data: teamsData } = await supabase.from('teams').select('*').eq('workspace_id', workspaceId);
      const fetchedTeams = teamsData || [];
      setDbTeams(fetchedTeams);

      const { data } = await supabase.from('time_reports').select('*, user:users(*)').eq('workspace_id', workspaceId);
      
      if (data) {
        const mapped = data.map(dbShift => {
          const teamName = fetchedTeams.find(t => t.id === dbShift.team_id)?.name || 'Odelat team';
          const uData = Array.isArray(dbShift.user) ? dbShift.user[0] : dbShift.user;
          const employeeName = uData ? (uData.full_name || uData.email || 'Okänd Agent') : 'Okänd Agent';

          return {
            id: dbShift.id,
            employeeId: dbShift.user_id,
            employee: employeeName,
            role: 'Assistent',
            teamId: dbShift.team_id,
            team: teamName,
            date: new Date(dbShift.date).toLocaleDateString(),
            start: dbShift.hours.toString(), // Mock mapping for now 
            end: dbShift.hours.toString(),
            duration: dbShift.hours,
            break: 0,
            status: dbShift.status,
            location: '',
            note: ''
          };
        });
        setShifts(mapped);
      }
    }
    fetchData();

    // Auto-update system för tidsrapporter
    const channel = supabase.channel('timemanager-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_reports' }, () => { fetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => { fetchData(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  // Initial Level Setup
  useEffect(() => {
    setCurrentLevel('team_overview');
    setSelectedContext({ type: null, id: null });
  }, []);

  // Breadcrumbs Logic
  useEffect(() => {
    if (setBreadcrumbNode) {
      const parts: React.ReactNode[] = [];
      const renderPart = (label: string, onClick?: () => void, isLast?: boolean) => (
        <React.Fragment key={label}>
          {parts.length > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-1" />}
          <button 
            onClick={onClick}
            className={`flex items-center transition-colors ${isLast ? 'text-foreground font-medium cursor-default' : 'hover:text-foreground cursor-pointer text-muted-foreground'}`}
            disabled={isLast}
          >
            {label}
          </button>
        </React.Fragment>
      );

      parts.push(renderPart('Verksamhetsöversikt', () => { setCurrentLevel('team_overview'); }, currentLevel === 'team_overview'));

      if (currentLevel === 'shift_list') {
         const name = selectedContext.type === 'employee' ? 
            (shifts.find(e => e.employeeId === selectedContext.id)?.employee || 'Anställd') :
            (selectedContext.id || 'Brukare');
            
         parts.push(renderPart(name, () => { setCurrentLevel('shift_list'); }, currentLevel === 'shift_list'));
      }

      setBreadcrumbNode(
        <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
          {parts}
        </div>
      );
    }
  }, [currentLevel, shifts, selectedContext, setBreadcrumbNode]);

  // View Handlers
  const openEmployeeShifts = (empId: string) => {
    setSelectedContext({ type: 'employee', id: empId });
    setCurrentLevel('shift_list');
    setFilterType('all');
    setSearchQuery('');
    setListMode('current');
  };

  const openTeamShifts = (teamName: string) => {
    setSelectedContext({ type: 'team', id: teamName });
    setCurrentLevel('shift_list');
    setFilterType('all');
    setSearchQuery('');
    setListMode('current');
  };

  // 1. Platform Overview (List Layout)
  const renderPlatformOverview = () => {
    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <div className="h-16 px-8 flex items-center justify-between border-b border-border shrink-0">
          <h2 className="text-foreground font-medium text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Organisationer
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
           {[{ id: workspaceId, name: 'Nuvarande Organisation', type: 'Assistance', totalHours: shifts.reduce((acc, s) => acc + s.duration, 0), pendingAttest: shifts.filter(s => s.status === 'pending_attest').length }].map((ws) => (
             <div 
                key={ws.id}
                onClick={() => {}}
                className="group flex items-center px-8 py-3 border-b border-border hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center text-primary font-bold mr-4 shrink-0 transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
                
                <div className="w-64 md:w-80 shrink-0 pr-4 text-foreground font-medium text-[15px]">
                  {ws.name}
                  <div className="text-[11px] text-muted-foreground font-normal uppercase tracking-wider mt-0.5">
                    {ws.type}
                  </div>
                </div>

                <div className="flex-1 min-w-0 pr-4"></div>

                <div className="w-32 shrink-0 pr-4 flex flex-col items-end justify-center">
                   <span className="text-[15px] font-bold text-foreground">{ws.totalHours} <span className="text-[11px] text-muted-foreground font-normal">h klara</span></span>
                </div>

                <div className="w-32 shrink-0 pr-4 flex items-center justify-end">
                  {ws.pendingAttest > 0 ? (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-medium">{ws.pendingAttest} oattesterat</span>
                  ) : (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Allt klart</span>
                  )}
                </div>

                <div className="w-12 shrink-0 flex items-center justify-end text-muted-foreground group-hover:text-foreground transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
           ))}
        </div>
      </div>
    );
  };

  // 2. Admin Team Overview (List Layout)
  const renderTeamOverview = () => {
    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <div className="h-16 px-8 flex items-center justify-between border-b border-border shrink-0">
          <h2 className="text-foreground font-medium text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Anställda i teamet
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
           {Array.from(new Set(shifts.map(s => s.employeeId))).map(empId => {
             const eSh = shifts.filter(s => s.employeeId === empId);
             const statusStr = eSh.some(s => s.status === 'pending_attest') ? 'pending' : 'approved';
             return { id: empId, name: eSh[0].employee, role: eSh[0].role, totalHours: eSh.reduce((a, b) => a + b.duration, 0), status: statusStr };
           }).map((emp) => (
              <div 
                key={emp.id}
                onClick={() => openEmployeeShifts(emp.id)}
                className="group flex items-center px-8 py-3 border-b border-border hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center text-foreground font-bold mr-4 shrink-0 transition-colors">
                  {emp.name.charAt(0)}
                </div>
                
                <div className="w-64 md:w-80 shrink-0 pr-4 text-foreground font-medium text-[15px]">
                  {emp.name}
                  <div className="text-[11px] text-muted-foreground font-normal uppercase tracking-wider mt-0.5">
                    {emp.role}
                  </div>
                </div>

                <div className="flex-1 min-w-0 pr-4"></div>

                <div className="w-32 shrink-0 pr-4 flex flex-col items-end justify-center">
                   <span className="text-[15px] font-bold text-foreground">{emp.totalHours} <span className="text-[11px] text-muted-foreground font-normal">h klara</span></span>
                </div>

                <div className="w-32 shrink-0 pr-4 flex items-center justify-end">
                  {emp.status === 'pending' ? (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-medium">Väntar attest</span>
                  ) : emp.status === 'approved' ? (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Allt klart</span>
                  ) : (
                    <span className="bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded text-[10px] font-medium">Ej inlämnad</span>
                  )}
                </div>

                <div className="w-12 shrink-0 flex items-center justify-end text-muted-foreground group-hover:text-foreground transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
           ))}
        </div>
      </div>
    );
  };

  // 3. Assistant Teams (List Layout)
  const renderAssistantTeamsOverview = () => {
    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <div className="h-16 px-8 flex items-center justify-between border-b border-border shrink-0">
          <h2 className="text-foreground font-medium text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Mina Teams / Uppdrag
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
          {Array.from(new Set(shifts.map(s => s.team))).map(teamName => {
            const tSh = shifts.filter(s => s.team === teamName);
            return { id: teamName, name: teamName, totalHours: tSh.reduce((a, b) => a + b.duration, 0), status: tSh.some(s => s.status === 'pending_attest') ? 'pending_assistant' : 'approved' };
          }).map(team => (
            <div 
              key={team.id}
              onClick={() => openTeamShifts(team.name)}
              className="group flex items-center px-8 py-3 border-b border-border hover:bg-muted cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center text-primary font-bold mr-4 shrink-0 transition-colors">
                {team.name.charAt(0)}
              </div>
              
              <div className="w-64 md:w-80 shrink-0 pr-4 text-foreground font-medium text-[15px]">
                {team.name}
                <div className="text-[11px] text-muted-foreground font-normal uppercase tracking-wider mt-0.5">
                  Team ID: {team.id}
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-4"></div>

              <div className="w-32 shrink-0 pr-4 flex flex-col items-end justify-center">
                 <span className="text-[15px] font-bold text-foreground">{team.totalHours} <span className="text-[11px] text-muted-foreground font-normal">h klara</span></span>
              </div>

              <div className="w-32 shrink-0 pr-4 flex items-center justify-end">
                {team.status === 'pending_assistant' ? (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-medium">Agerande krävs</span>
                ) : (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Allt godkänt</span>
                )}
              </div>

              <div className="w-12 shrink-0 flex items-center justify-end text-muted-foreground group-hover:text-foreground transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 4. Shift List
  const renderShiftSystem = () => {
    let contextShifts = shifts;
    if (selectedContext.type === 'employee') {
      contextShifts = shifts.filter(s => s.employeeId === selectedContext.id);
    } else if (selectedContext.type === 'team') {
      contextShifts = shifts.filter(s => s.team === selectedContext.id);
    }

    const filteredShifts = contextShifts.filter(s => {
      const searchMatch = s.employee.toLowerCase().includes(searchQuery.toLowerCase()) || 
       s.team.toLowerCase().includes(searchQuery.toLowerCase());
       
      let match = false;
      if (filterType === 'all') match = true;
      if (filterType === 'pending_attest') match = s.status === 'pending_attest';
      if (filterType === 'approved') match = s.status === 'approved';
      if (filterType === 'not_submitted') match = s.status === 'not_submitted';

      return searchMatch && match;
    });

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
      setSelectedShifts(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const handleApprove = async () => {
      if (selectedShifts.length === 0) return;
      
      const { error } = await supabase.from('time_reports').update({ status: 'approved' }).in('id', selectedShifts);
      if (error) {
         alert("Kunde inte godkänna rapporter: " + error.message);
         return;
      }
      
      setSelectedShifts([]);
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
        <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
          {history.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
               <Calendar className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-sm">Ingen historik hittades</p>
             </div>
          ) : (
             history.map(h => (
               <div key={h.id} className="group flex items-center px-8 py-4 border-b border-border hover:bg-muted cursor-pointer transition-colors">
                 <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center text-primary font-bold mr-4 shrink-0 transition-colors">
                    <FileCheck className="w-5 h-5 opacity-70" />
                 </div>
                 <div className="w-48 shrink-0 pr-4 text-foreground font-medium text-[15px]">
                   {h.month}
                   <div className="text-[11px] text-emerald-400 font-normal uppercase tracking-wider mt-0.5 flex items-center gap-1">
                     <CheckCircle2 className="w-3 h-3" /> Godkänd & Attesterad
                   </div>
                 </div>

                 <div className="flex-1 min-w-0 pr-4 flex items-center gap-6">
                    <div>
                      <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Arbetstid</div>
                      <div className="text-foreground font-mono text-[13px]">{h.hours}h</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">OB-Tillägg</div>
                      <div className="text-foreground font-mono text-[13px]">{h.ob}h</div>
                    </div>
                    <div>
                      <div className="text-rose-400/70 text-[10px] uppercase tracking-wider mb-0.5">Frånvaro</div>
                      <div className="text-foreground font-mono text-[13px]">{h.absence > 0 ? `${h.absence}h` : '-'}</div>
                    </div>
                 </div>

                 <div className="w-48 shrink-0 flex flex-col items-end justify-center pr-4">
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Lön före skatt</div>
                    <span className="text-[15px] font-bold text-foreground">{h.salary}</span>
                 </div>

                 <div className="w-12 shrink-0 flex items-center justify-end text-muted-foreground group-hover:text-foreground transition-colors">
                   <ChevronRight className="w-5 h-5" />
                 </div>
               </div>
             ))
          )}
        </div>
      );
    };

    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        {/* TAB HEADER */}
        <div className="h-14 px-8 flex items-center border-b border-border shrink-0 gap-6">
           <button 
             onClick={() => setListMode('current')}
             className={`h-full border-b-2 text-sm font-medium transition-colors flex items-center ${listMode === 'current' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-muted-foreground'}`}
           >
             Aktuella tidsrapporter
           </button>
           <button 
             onClick={() => setListMode('history')}
             className={`h-full border-b-2 text-sm font-medium transition-colors flex items-center ${listMode === 'history' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-muted-foreground'}`}
           >
             Tidigare månader (Historik)
           </button>
        </div>

        {listMode === 'history' ? (
           renderHistory()
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="h-16 px-8 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-8 flex justify-center cursor-pointer group" onClick={toggleSelectAll}>
              <div className={`w-4 h-4 rounded-[4px] border ${isAllSelected ? 'border-primary bg-primary' : 'border-border'} flex items-center justify-center`}>
                {isAllSelected && <Check className="w-3 h-3 text-foreground" />}
              </div>
            </div>
            
            <div className="relative group">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent text-foreground font-semibold text-sm appearance-none cursor-pointer focus:outline-none pr-4"
              >
                <option value="all" className="bg-card text-foreground">Alla Rapporter</option>
                <option value="pending_attest" className="bg-card text-foreground">Väntar ({filteredShifts.length})</option>
                <option value="approved" className="bg-card text-foreground">Godkända ({filteredShifts.length})</option>
              </select>
            </div>

            {selectedShifts.length > 0 && (
              <div className="flex items-center gap-2 border-l border-border ml-2 pl-4">
                {activeRole !== 'assistant' && (
                  <Button onClick={handleApprove} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-foreground h-7 text-xs px-3">
                    <FileCheck className="w-3.5 h-3.5 mr-1" /> Godkänn ({selectedShifts.length})
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-rose-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
             <div className="relative w-48 hidden sm:block">
               <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
               <Input 
                 placeholder="Sök tidsrapporter..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-8 bg-muted border-none text-foreground h-8 rounded-full text-xs focus-visible:ring-1 focus-visible:ring-primary"
               />
             </div>
             <div className="flex items-center gap-2 text-muted-foreground">
               <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => currentPage > 1 && setCurrentPage(prev => prev - 1)} />
               <span className="text-xs font-medium">{currentPage}/{totalPages}</span>
               <ChevronRight className="w-4 h-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => currentPage < totalPages && setCurrentPage(prev => prev + 1)} />
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
          {filteredShifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
               <Calendar className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-sm">Inga tidsrapporter hittades</p>
            </div>
          ) : (
            currentShifts.map((shift) => {
              const isSelected = selectedShifts.includes(shift.id);
              return (
                <div 
                  key={shift.id}
                  className={`group flex items-center px-6 py-3 border-b border-border hover:bg-muted transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                >
                  <div className="w-8 shrink-0 flex justify-center p-1 cursor-pointer" onClick={(e) => toggleSelect(shift.id, e)}>
                    <div className={`w-[18px] h-[18px] rounded-[4px] border ${isSelected ? 'border-primary bg-primary' : 'border-border group-hover:border-border'} flex items-center justify-center transition-colors`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-foreground" />}
                    </div>
                  </div>
                  
                  <div className="w-40 md:w-56 shrink-0 truncate pr-4 text-foreground font-medium ml-2 text-[15px]">
                    {selectedContext.type === 'team' ? shift.employee : shift.team}
                    <div className="text-[11px] text-muted-foreground font-normal uppercase tracking-wider mt-0.5">
                      {selectedContext.type === 'team' ? shift.role : 'Brukare'}
                    </div>
                  </div>

                  <div className="flex-1 flex items-center min-w-0 pr-4">
                    <div className="text-foreground font-mono text-[13px] bg-secondary px-2 py-1 rounded">
                      {shift.start} - {shift.end}
                    </div>
                    <div className="ml-4 flex items-baseline gap-1.5">
                       <span className="text-[15px] font-bold text-foreground">{shift.duration}</span>
                       <span className="text-[11px] text-muted-foreground">h</span>
                    </div>
                  </div>

                  <div className="w-32 shrink-0 pr-4 flex items-center justify-end">
                    {shift.status === 'pending_attest' && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-medium">Väntar</span>}
                    {shift.status === 'approved' && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-medium">Godkänd</span>}
                  </div>

                  <div className="w-[120px] shrink-0 text-right flex items-center justify-end gap-3 text-[14px]">
                    <span className="text-foreground font-medium">{shift.date}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background relative">
      <div className="flex-1 flex flex-col w-full h-full">
        {currentLevel === 'platform_overview' && renderPlatformOverview()}
        {currentLevel === 'team_overview' && renderTeamOverview()}
        {currentLevel === 'assistant_teams' && renderAssistantTeamsOverview()}
        {currentLevel === 'shift_list' && renderShiftSystem()}
      </div>
    </div>
  );
};
