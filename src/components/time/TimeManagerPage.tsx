import React, { useState, useEffect, useMemo } from 'react';
import {
  Check, ChevronLeft, ChevronRight, Search, Trash2,
  FileCheck, User, Calendar, Building2, CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';

type DevRole = 'platform_admin' | 'admin' | 'assistant';
type NavLevel = 'platform_overview' | 'team_overview' | 'assistant_teams' | 'shift_list';

interface TimeReportUI {
  id: string;
  employeeId: string;
  employee: string;
  role: string;
  teamId: string | null;
  team: string;
  workspaceId: string;
  date: string;
  start: string;
  end: string;
  duration: number;
  break: number;
  status: string;
  location: string;
  note: string;
}

interface TimeManagerPageProps {
  setBreadcrumbNode?: (node: React.ReactNode) => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending_attest':
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium">Väntar attest</Badge>;
    case 'approved':
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Godkänd</Badge>;
    case 'not_submitted':
      return <Badge variant="secondary" className="text-muted-foreground font-medium">Ej inlämnad</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const EmptyState = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12 animate-in fade-in zoom-in duration-300">
    <Icon className="w-12 h-12 mb-4 opacity-20" />
    <h3 className="text-lg font-medium text-foreground">{title}</h3>
    <p className="text-sm max-w-[250px] text-center mt-1">{description}</p>
  </div>
);

export const TimeManagerPage: React.FC<TimeManagerPageProps> = ({
  setBreadcrumbNode
}) => {
  const { workspaceId } = useWorkspace();
  const { user } = useAuth();

  const activeRole: DevRole = (user as any)?.user_metadata?.role as DevRole || 'admin';
  const [shifts, setShifts] = useState<TimeReportUI[]>([]);

  const [dbTeams, setDbTeams] = useState<any[]>([]);
  const [dbWorkspaces, setDbWorkspaces] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentLevel, setCurrentLevel] = useState<NavLevel>('team_overview');
  const [selectedContext, setSelectedContext] = useState<{ type: 'employee' | 'team' | null, id: string | null }>({ type: null, id: null });

  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [listMode, setListMode] = useState<'current' | 'history'>('current');
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [hasApprovePermission, setHasApprovePermission] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!workspaceId && activeRole !== 'platform_admin') return;

      setLoading(true);
      try {
        let reportsData: any[] = [];
        let teamsData: any[] = [];
        let workspacesData: any[] = [];
        let usersData: any[] = [];

        const promises = [];

        if (activeRole === 'platform_admin') {
          promises.push(supabase.from('workspaces').select('*').then(({ data }) => workspacesData = data || []));
          promises.push(supabase.from('teams').select('*').then(({ data }) => teamsData = data || []));
          promises.push(supabase.from('users').select('*').then(({ data }) => usersData = data || []));
        } else {
          promises.push(supabase.from('teams').select('*').eq('workspace_id', workspaceId).then(({ data }) => teamsData = data || []));
          promises.push(supabase.from('users').select('*').eq('workspace_id', workspaceId).then(({ data }) => usersData = data || []));
        }

        await Promise.all(promises);
        setDbWorkspaces(workspacesData);
        setDbTeams(teamsData);
        setDbUsers(usersData);

        let query = supabase.from('time_reports').select('*, user:users(*)');

        if (activeRole === 'admin') {
          query = query.eq('workspace_id', workspaceId);
        } else if (activeRole === 'assistant') {
          query = query.eq('user_id', user?.id);
        }

        const { data: r, error } = await query;
        if (error) throw error;
        reportsData = r || [];

        const mapped: TimeReportUI[] = reportsData.map(dbShift => {
          const team = teamsData.find(t => t.id === dbShift.team_id);
          const teamName = team?.name || 'Odelat team';
          const uData = Array.isArray(dbShift.user) ? dbShift.user[0] : dbShift.user;
          const employeeName = uData ? (uData.full_name || uData.email || 'Okänd Agent') : 'Okänd Agent';

          return {
            id: dbShift.id,
            employeeId: dbShift.user_id,
            employee: employeeName,
            role: uData?.role === 'admin' ? 'Administratör' : 'Assistent',
            teamId: dbShift.team_id,
            team: teamName,
            workspaceId: dbShift.workspace_id,
            date: new Date(dbShift.date).toLocaleDateString('sv-SE'),
            start: dbShift.start_time || '08:00',
            end: dbShift.end_time || '17:00',
            duration: dbShift.hours || 0,
            break: 0,
            status: dbShift.status,
            location: '',
            note: dbShift.note || ''
          };
        });
        setShifts(mapped);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error('Kunde inte hämta data: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    const channel = supabase.channel('timemanager-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_reports' }, () => { fetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => { fetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces' }, () => { fetchData(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, activeRole, user?.id]);

  useEffect(() => {
    if (activeRole === 'platform_admin') {
      setCurrentLevel('platform_overview');
    } else {
      setCurrentLevel('team_overview');
    }
    setSelectedContext({ type: null, id: null });
  }, [activeRole]);

  useEffect(() => {
    if (setBreadcrumbNode) {
      const parts: React.ReactNode[] = [];
      const renderPart = (label: string, onClick?: () => void, isLast?: boolean) => (
        <React.Fragment key={label}>
          {parts.length > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 mx-1.5" />}
          <button
            onClick={onClick}
            className={`flex items-center text-sm transition-all duration-200 ${isLast ? 'text-foreground font-semibold cursor-default' : 'text-muted-foreground hover:text-foreground cursor-pointer'}`}
            disabled={isLast}
          >
            {label}
          </button>
        </React.Fragment>
      );

      if (activeRole === 'platform_admin') {
        parts.push(renderPart('Organisationer', () => { setCurrentLevel('platform_overview'); }, currentLevel === 'platform_overview'));
      }

      if (currentLevel !== 'platform_overview') {
        parts.push(renderPart('Verksamhetsöversikt', () => { setCurrentLevel('team_overview'); }, currentLevel === 'team_overview'));
      }

      if (currentLevel === 'shift_list') {
        const name = selectedContext.type === 'employee' ?
          (shifts.find(e => e.employeeId === selectedContext.id)?.employee || 'Anställd') :
          (selectedContext.id || 'Brukare');

        parts.push(renderPart(name, () => { setCurrentLevel('shift_list'); }, currentLevel === 'shift_list'));
      }

      setBreadcrumbNode(
        <div className="flex items-center animate-in fade-in slide-in-from-left-4 duration-300">
          {parts}
        </div>
      );
    }
  }, [currentLevel, shifts, selectedContext, setBreadcrumbNode, activeRole]);

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

  const handleApprove = async () => {
    if (selectedShifts.length === 0) return;

    const { error } = await supabase.from('time_reports').update({ status: 'approved' }).in('id', selectedShifts);
    if (error) {
      toast.error("Kunde inte godkänna rapporter: " + error.message);
      return;
    }

    toast.success(`${selectedShifts.length} rapporter har godkänts`);
    setSelectedShifts([]);
  };

  const handleDelete = async () => {
    if (selectedShifts.length === 0) return;

    const { error } = await supabase.from('time_reports').delete().in('id', selectedShifts);
    if (error) {
      toast.error("Kunde inte radera rapporter: " + error.message);
      return;
    }

    toast.success(`${selectedShifts.length} rapporter har raderats`);
    setSelectedShifts([]);
    setIsDeleteAlertOpen(false);
  };

// --- Platform Overview Component ---
interface PlatformOverviewProps {
  dbWorkspaces: any[];
  shifts: TimeReportUI[];
}

const PlatformOverviewView: React.FC<PlatformOverviewProps> = ({ dbWorkspaces, shifts }) => {
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

// --- Team Overview Component ---
interface TeamOverviewProps {
  dbUsers: any[];
  shifts: TimeReportUI[];
  loading: boolean;
  openEmployeeShifts: (id: string) => void;
}

const TeamOverviewView: React.FC<TeamOverviewProps> = ({ dbUsers, shifts, loading, openEmployeeShifts }) => {
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

// --- Assistant Teams Component ---
interface AssistantTeamsProps {
  dbTeams: any[];
  shifts: TimeReportUI[];
  activeRole: DevRole;
  workspaceId: string | null;
  openTeamShifts: (name: string) => void;
}

const AssistantTeamsOverviewView: React.FC<AssistantTeamsProps> = ({ dbTeams, shifts, activeRole, workspaceId, openTeamShifts }) => {
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

// --- Shift System Component (RESOLVES HOOK ERROR) ---
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

const ShiftSystemView: React.FC<ShiftSystemProps> = ({
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
  useEffect(() => {
    async function checkPerms() {
      if (activeRole === 'admin' || activeRole === 'platform_admin') {
        setHasApprovePermission(true);
        return;
      }

      const { data: memberships } = await supabase.from('team_members').select('role_id').eq('user_id', user?.id);
      if (memberships) {
        const roleIds = memberships.map(m => m.role_id).filter(Boolean);
        if (roleIds.length > 0) {
          const { data: roles } = await supabase.from('workspace_roles').select('permissions').in('id', roleIds);
          if (roles?.some(r => r.permissions?.can_approve_time_reports)) {
            setHasApprovePermission(true);
            return;
          }
        }
      }
      setHasApprovePermission(false);
    }
    checkPerms();
  }, [activeRole, user?.id]);

  return (
    <div className="h-full flex flex-col bg-background relative">
      <div className="flex-1 flex flex-col w-full h-full">
        {currentLevel === 'platform_overview' && (
          <PlatformOverviewView
            dbWorkspaces={dbWorkspaces}
            shifts={shifts}
          />
        )}
        {currentLevel === 'team_overview' && (
          <TeamOverviewView
            dbUsers={dbUsers}
            shifts={shifts}
            loading={loading}
            openEmployeeShifts={openEmployeeShifts}
          />
        )}
        {currentLevel === 'assistant_teams' && (
          <AssistantTeamsOverviewView
            dbTeams={dbTeams}
            shifts={shifts}
            activeRole={activeRole}
            workspaceId={workspaceId}
            openTeamShifts={openTeamShifts}
          />
        )}
        {currentLevel === 'shift_list' && (
          <ShiftSystemView
            shifts={shifts}
            selectedContext={selectedContext}
            searchQuery={searchQuery}
            filterType={filterType}
            currentPage={currentPage}
            selectedShifts={selectedShifts}
            listMode={listMode}
            isDeleteAlertOpen={isDeleteAlertOpen}
            hasApprovePermission={hasApprovePermission}
            setListMode={setListMode}
            setFilterType={setFilterType}
            setSearchQuery={setSearchQuery}
            setCurrentPage={setCurrentPage}
            setSelectedShifts={setSelectedShifts}
            setIsDeleteAlertOpen={setIsDeleteAlertOpen}
            handleApprove={handleApprove}
            handleDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};
