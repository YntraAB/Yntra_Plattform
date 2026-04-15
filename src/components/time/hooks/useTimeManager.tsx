import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import type { TimeReportUI, DevRole, NavLevel } from '../types';

export const useTimeManager = (setBreadcrumbNode?: (node: React.ReactNode) => void) => {
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

  const fetchData = useCallback(async () => {
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
  }, [workspaceId, activeRole, user?.id]);

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('timemanager-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_reports' }, () => { fetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => { fetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces' }, () => { fetchData(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

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

  useEffect(() => {
    async function checkPerms() {
      if (!user) return;
      if (activeRole === 'admin' || activeRole === 'platform_admin') {
        setHasApprovePermission(true);
        return;
      }

      const { data: memberships } = await supabase.from('team_members').select('role_id').eq('user_id', user.id);
      if (memberships) {
        const roleIds = memberships.map(m => m.role_id).filter(Boolean);
        if (roleIds.length > 0) {
          const { data: roles } = await supabase.from('workspace_roles').select('permissions').in('id', roleIds);
          if (roles?.some(r => (r.permissions as any)?.can_approve_time_reports)) {
            setHasApprovePermission(true);
            return;
          }
        }
      }
      setHasApprovePermission(false);
    }
    checkPerms();
  }, [activeRole, user]);

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
    fetchData();
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
    fetchData();
  };

  return {
    workspaceId,
    activeRole,
    shifts,
    dbTeams,
    dbWorkspaces,
    dbUsers,
    loading,
    currentLevel,
    selectedContext,
    filterType,
    searchQuery,
    currentPage,
    selectedShifts,
    listMode,
    isDeleteAlertOpen,
    hasApprovePermission,
    setListMode,
    setFilterType,
    setSearchQuery,
    setCurrentPage,
    setSelectedShifts,
    setIsDeleteAlertOpen,
    openEmployeeShifts,
    openTeamShifts,
    handleApprove,
    handleDelete
  };
};
