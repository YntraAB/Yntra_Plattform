import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';

export type DirectoryLevel = 'workspaces' | 'teams' | 'members';

export interface WorkspaceItem {
  id: string;
  name: string;
  type: string;
  teamsCount: number;
  membersCount: number;
}

export interface TeamItem {
  id: string;
  name: string;
  workspaceId: string;
  membersCount: number;
  patientsCount: number;
  leader: string;
}

export interface MemberItem {
  id: string;
  name: string;
  email: string;
  ssn: string;
  teamId: string | null;
  phone: string;
  address: string;
  careLevel: string;
  avatar: string;
  alerts: string[];
  notes: string;
  upcomingVisits: any[];
  roleId: string | null;
  role: string;
}

export interface WorkspaceRole {
  id: string;
  name: string;
  workspace_id: string;
  permissions: {
    can_manage_schedule: boolean;
    can_manage_notes: boolean;
    can_approve_time_reports: boolean;
  };
}

export const useDirectoryData = () => {
  const { workspaceId, setAdminWorkspace } = useWorkspace();
  const { user } = useAuth();
  const userRole = (user as any)?.role as 'platform_admin' | 'admin' | 'assistant' || 'admin';

  const [currentLevel, setCurrentLevel] = useState<DirectoryLevel>('teams');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  const [dbWorkspaces, setDbWorkspaces] = useState<WorkspaceItem[]>([]);
  const [dbTeams, setDbTeams] = useState<TeamItem[]>([]);
  const [dbMembers, setDbMembers] = useState<MemberItem[]>([]);
  const [dbWorkspaceRoles, setDbWorkspaceRoles] = useState<WorkspaceRole[]>([]);

  useEffect(() => {
    if (userRole === 'platform_admin' && !selectedWorkspace && currentLevel === 'teams') {
      setCurrentLevel('workspaces');
    }
  }, [userRole, selectedWorkspace, currentLevel]);

  const loadDirectory = useCallback(async () => {
    const filterWs = selectedWorkspace || workspaceId;

    // Load Workspaces for Platform Admin
    if (userRole === 'platform_admin') {
      const { data: wsData } = await supabase.from('workspaces').select('*, teams(count), users(count)');
      if (wsData) {
        setDbWorkspaces(wsData.map(w => ({
          id: w.id,
          name: w.name,
          type: 'Assistance',
          teamsCount: w.teams?.[0]?.count || 0,
          membersCount: w.users?.[0]?.count || 0
        })));
      }
    }

    // Load Teams and Roles
    if (filterWs) {
      const { data: rolesData } = await supabase.from('workspace_roles').select('*').eq('workspace_id', filterWs);
      if (rolesData) setDbWorkspaceRoles(rolesData);

      const { data: teamData } = await supabase.from('teams').select('*').eq('workspace_id', filterWs);
      const { data: allUsers } = await supabase.from('users').select('id, role').eq('workspace_id', filterWs);
      const teamIds = teamData?.map(t => t.id) || [];
      let allMemberships: any[] = [];
      if (teamIds.length > 0) {
        const { data: memberships } = await supabase.from('team_members').select('team_id, user_id, role_id').in('team_id', teamIds);
        allMemberships = memberships || [];
      }

      if (teamData) {
        setDbTeams(teamData.map(t => {
          const teamLinks = allMemberships.filter(tm => tm.team_id === t.id);
          const assistantLinks = teamLinks.filter(tm => {
            const u = allUsers?.find(u => u.id === tm.user_id);
            return u && u.role === 'assistant' && !tm.role_id;
          });

          return {
            id: t.id,
            name: t.name,
            workspaceId: t.workspace_id,
            membersCount: assistantLinks.length,
            patientsCount: 0,
            leader: 'Unknown'
          };
        }));
      }
    }

    // Load Members if in a team
    if (selectedTeam) {
      let memberIds: string[] = [];
      let teamMembersLinkData: any[] = [];
      if (selectedTeam !== 'all_members') {
        const { data: tmData } = await supabase.from('team_members').select('user_id, role_id').eq('team_id', selectedTeam);
        teamMembersLinkData = tmData || [];
        memberIds = teamMembersLinkData.map(tm => tm.user_id);
      }

      const { data: usersData } = await supabase.from('users').select('*').eq('workspace_id', filterWs);

      const actualTeamUsers = selectedTeam === 'all_members'
        ? (usersData || [])
        : (usersData || []).filter(u => memberIds.includes(u.id));

      const mappedUsers = actualTeamUsers.map((u: any) => {
        let customRoleName: string | null = null;
        let customRoleId: string | null = null;
        if (selectedTeam !== 'all_members') {
          const link = teamMembersLinkData.find(tm => tm.user_id === u.id);
          if (link?.role_id) {
            customRoleId = link.role_id;
            const roleDef = dbWorkspaceRoles.find(r => r.id === customRoleId);
            if (roleDef) customRoleName = roleDef.name;
          }
        }

        return {
          id: u.id,
          name: u.full_name || u.email,
          email: u.email,
          ssn: '',
          teamId: selectedTeam,
          phone: u.phone || '',
          address: '',
          careLevel: '',
          avatar: '',
          alerts: [],
          notes: '',
          upcomingVisits: [],
          roleId: customRoleId,
          role: customRoleName || u.role || 'Assistant'
        };
      });

      setDbMembers(mappedUsers);
    }
  }, [selectedWorkspace, workspaceId, selectedTeam, userRole, dbWorkspaceRoles]);

  useEffect(() => {
    loadDirectory();

    const channel = supabase.channel('directory-auto-update')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces' }, () => { loadDirectory(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => { loadDirectory(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => { loadDirectory(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => { loadDirectory(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_roles' }, () => { loadDirectory(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDirectory]);

  const handleSelectWorkspace = (wId: string) => {
    setSelectedWorkspace(wId);
    if (userRole === 'platform_admin' && setAdminWorkspace) {
      setAdminWorkspace(wId);
    }
    setCurrentLevel('teams');
  };

  const handleSelectTeam = (tId: string) => {
    setSelectedTeam(tId);
    setCurrentLevel('members');
  };

  const handleBreadcrumbClick = useCallback((level: DirectoryLevel) => {
    if (level === 'workspaces') {
      setSelectedWorkspace(null);
      setSelectedTeam(null);
      setCurrentLevel('workspaces');
    } else if (level === 'teams') {
      setSelectedTeam(null);
      setCurrentLevel('teams');
    }
  }, []);

  return {
    userRole,
    currentLevel,
    setCurrentLevel,
    selectedWorkspace,
    setSelectedWorkspace,
    selectedTeam,
    setSelectedTeam,
    selectedEntity,
    setSelectedEntity,
    dbWorkspaces,
    setDbWorkspaces,
    dbTeams,
    setDbTeams,
    dbMembers,
    setDbMembers,
    dbWorkspaceRoles,
    setDbWorkspaceRoles,
    handleSelectWorkspace,
    handleSelectTeam,
    handleBreadcrumbClick,
    loadDirectory,
    workspaceId
  };
};
