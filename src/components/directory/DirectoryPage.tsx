import React, { useState } from 'react';
import {
  Building2,
  Users,
  HeartPulse,
  User,
  MapPin,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  ChevronRight,
  Settings,
  Plus,
  Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';

type DirectoryLevel = 'workspaces' | 'teams' | 'members';

interface DirectoryPageProps {
  setBreadcrumbNode: (node: React.ReactNode) => void;
}

import { useAuth } from '@/hooks/useAuth';

export const DirectoryPage: React.FC<DirectoryPageProps> = ({ setBreadcrumbNode }) => {
  const { t } = useTranslation();
  const { workspaceId, setAdminWorkspace } = useWorkspace();
  const { user } = useAuth();

  const userRole = (user as any)?.role as 'platform_admin' | 'admin' | 'assistant' || 'admin';

  const [currentLevel, setCurrentLevel] = useState<DirectoryLevel>('teams');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  const [dbWorkspaces, setDbWorkspaces] = useState<any[]>([]);
  const [dbTeams, setDbTeams] = useState<any[]>([]);
  const [dbMembers, setDbMembers] = useState<any[]>([]);
  const [dbWorkspaceRoles, setDbWorkspaceRoles] = useState<any[]>([]);

  // Yntra Dev Hub State
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [hubWsName, setHubWsName] = useState('');
  const [hubAdminEmail, setHubAdminEmail] = useState('');
  const [isHubLoading, setIsHubLoading] = useState(false);

  // Role Manager State
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null); // null = list view, 'new' = creating, or role_object = editing
  const [roleForm, setRoleForm] = useState({
    name: '',
    can_manage_schedule: false,
    can_manage_notes: false,
    can_approve_time_reports: false
  });

  // Team Manager State
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  // Member Invite State
  const [isInviteManagerOpen, setIsInviteManagerOpen] = useState(false);
  const [inviteTab, setInviteTab] = useState<'existing' | 'new'>('existing');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedExistingUserId, setSelectedExistingUserId] = useState('');
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);

  React.useEffect(() => {
    if (userRole === 'platform_admin' && !selectedWorkspace && currentLevel === 'teams') {
      setCurrentLevel('workspaces');
    }
  }, [userRole, selectedWorkspace, currentLevel]);

  React.useEffect(() => {
    if (isInviteManagerOpen) {
      const fetchWorkspaceUsers = async () => {
        const targetWS = selectedWorkspace || workspaceId;
        const { data: usersData } = await supabase.from('users').select('*').eq('workspace_id', targetWS);
        const { data: teamMembersData } = await supabase.from('team_members').select('user_id').eq('team_id', selectedTeam);

        const existingMemberIds = (teamMembersData || []).map(tm => tm.user_id);
        const availableUsers = (usersData || []).filter(u => !existingMemberIds.includes(u.id));
        setWorkspaceUsers(availableUsers);
      };
      fetchWorkspaceUsers();
    }
  }, [isInviteManagerOpen, selectedWorkspace, workspaceId, selectedTeam]);

  React.useEffect(() => {
    async function loadDirectory() {
      // Load Workspaces for Platform Admin
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

      // Load Teams and Roles
      const filterWs = selectedWorkspace || workspaceId;
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

        setDbMembers([...mappedUsers]);
      }
    }
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
  }, [selectedWorkspace, workspaceId, selectedTeam]);

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

  const handleBreadcrumbClick = React.useCallback((level: DirectoryLevel) => {
    if (level === 'workspaces') {
      setSelectedWorkspace(null);
      setSelectedTeam(null);
      setCurrentLevel('workspaces');
    } else if (level === 'teams') {
      setSelectedTeam(null);
      setCurrentLevel('teams');
    }
  }, []);

  React.useEffect(() => {
    const ws = dbWorkspaces.find(w => w.id === selectedWorkspace);
    const tm = selectedTeam === 'all_members' ? { name: t('directory.levels.all_members') } : dbTeams.find(t => t.id === selectedTeam);

    const bNode = (
      <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
        {/* Root Node is always "Teams" */}
        <button
          onClick={() => handleBreadcrumbClick(userRole === 'platform_admin' ? 'workspaces' : 'teams')}
          className={`hover:text-foreground transition-colors flex items-center ${currentLevel === 'workspaces' || (currentLevel === 'teams' && userRole !== 'platform_admin')
            ? 'text-foreground font-medium'
            : ''
            }`}
        >
          {t('directory.levels.teams')}
        </button>
        {/* Separator if we are deeper than root */}
        {((userRole === 'platform_admin' && currentLevel !== 'workspaces') || (userRole !== 'platform_admin' && currentLevel === 'members')) && (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-1" />
        )}

        {/* Workspace Name (Only shown if user is a platform admin and drilled down past workspaces) */}
        {userRole === 'platform_admin' && ws && (
          <>
            <button
              onClick={() => handleBreadcrumbClick('teams')}
              className={`hover:text-foreground transition-colors flex items-center ${currentLevel === 'teams' ? 'text-foreground font-medium' : ''}`}
            >
              {ws.name}
            </button>
            {(selectedTeam || currentLevel === 'members') && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-1" />}
          </>
        )}

        {/* Current Team */}
        {tm && (
          <span className="text-foreground font-medium flex items-center">
            {tm.name}
          </span>
        )}
      </div>
    );
    setBreadcrumbNode(bNode);
  }, [userRole, currentLevel, selectedWorkspace, selectedTeam, setBreadcrumbNode, handleBreadcrumbClick]);

  const renderWorkspaces = () => (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      <div className="h-16 px-8 flex items-center justify-between border-b border-border shrink-0">
        <h2 className="text-foreground font-medium text-base flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> {t('directory.levels.workspaces')}
        </h2>
        {userRole === 'platform_admin' && (
          <Button size="sm" className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white h-8 text-xs" onClick={() => setIsHubOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('directory.workspaces.create_button')}
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
        {dbWorkspaces.map(ws => (
          <div
            key={ws.id}
            onClick={() => handleSelectWorkspace(ws.id)}
            className="group flex items-center px-8 py-3 border-b border-border hover:bg-muted cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center text-primary mr-4 shrink-0 transition-colors">
              <Building2 className="w-5 h-5" />
            </div>

            <div className="w-64 md:w-80 shrink-0 pr-4 text-foreground font-medium text-[15px]">
              {ws.name}
              <div className="text-[11px] text-muted-foreground font-normal uppercase tracking-wider mt-0.5">
                {ws.type}
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-4"></div>

            <div className="w-48 shrink-0 flex items-center justify-end gap-6 text-[13px] text-muted-foreground mr-4">
              <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {ws.teamsCount} {t('directory.workspaces.teams_count')}</div>
              <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {ws.membersCount} {t('directory.workspaces.users_count')}</div>
            </div>

            <div className="w-12 shrink-0 flex items-center justify-end text-muted-foreground gap-2 group-hover:text-foreground transition-colors">
              {userRole === 'platform_admin' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t('directory.workspaces.delete_confirm'))) {
                      supabase.rpc('delete_workspace', { target_workspace_id: ws.id }).then(() => {
                        setDbWorkspaces(prev => prev.filter(w => w.id !== ws.id));
                      });
                    }
                  }}
                  className="hover:text-red-500 transition-colors mr-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTeams = () => {
    const teams = userRole === 'platform_admin'
      ? dbTeams.filter(t => t.workspaceId === selectedWorkspace)
      : dbTeams;

    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <div className="h-16 px-8 flex items-center justify-between border-b border-border shrink-0">
          <h2 className="text-foreground font-medium text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> {t('directory.teams.title')}
          </h2>
          <div className="flex items-center gap-2">
            {(userRole === 'admin' || userRole === 'platform_admin') && (
              <>
                <Button size="sm" variant="outline" className="border-border text-foreground bg-transparent h-8 text-xs hover:bg-secondary" onClick={() => setIsRoleManagerOpen(true)}>
                  {t('directory.teams.manage_roles')}
                </Button>
                <Button size="sm" className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white h-8 text-xs" onClick={() => setIsTeamManagerOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('directory.teams.create_button')}
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
          {(userRole === 'admin' || userRole === 'platform_admin') && (
            <div
              onClick={() => handleSelectTeam('all_members')}
              className="group flex items-center px-8 py-3 border-b border-border hover:bg-muted cursor-pointer transition-colors bg-primary/5"
            >
              <div className="w-10 h-10 rounded-[8px] bg-primary/20 flex items-center justify-center text-primary mr-4 shrink-0 transition-colors">
                <Users className="w-5 h-5" />
              </div>

              <div className="w-64 md:w-80 shrink-0 pr-4 text-foreground font-medium text-[15px]">
                {t('directory.levels.all_members')}
                <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
                  {t('directory.teams.all_members_subtitle')}
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-4"></div>

              <div className="w-12 shrink-0 flex items-center justify-end text-muted-foreground group-hover:text-foreground transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          )}
          {teams.map(team => (
            <div
              key={team.id}
              onClick={() => handleSelectTeam(team.id)}
              className="group flex items-center px-8 py-3 border-b border-border hover:bg-muted cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center text-primary font-bold mr-4 shrink-0 transition-colors">
                {team.name.charAt(0)}
              </div>

              <div className="w-64 md:w-80 shrink-0 pr-4 text-foreground font-medium text-[15px]">
                {team.name}
                <div className="text-[11px] text-muted-foreground font-normal uppercase tracking-wider mt-0.5">
                  {t('directory.teams.led_by')} <span className="text-muted-foreground">{team.leader}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-4"></div>

              <div className="w-48 shrink-0 flex items-center justify-end gap-3">
                <Badge variant="secondary" className="bg-secondary text-muted-foreground border border-border text-[10px] font-medium py-0.5">
                  <User className="w-3 h-3 mr-1" /> {team.membersCount} {t('directory.teams.assistants_count')}
                </Badge>
                <Badge variant="secondary" className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-medium py-0.5">
                  <HeartPulse className="w-3 h-3 mr-1" /> {team.patientsCount} {t('directory.teams.patients_count')}
                </Badge>
              </div>

              <div className="w-16 shrink-0 flex items-center justify-end text-muted-foreground gap-2 group-hover:text-foreground transition-colors">
                {(userRole === 'admin' || userRole === 'platform_admin') && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm(t('directory.teams.delete_confirm', { name: team.name }))) {
                        const { error } = await supabase.from('teams').delete().eq('id', team.id);
                        if (error) alert(t('directory.members.delete_error') + " " + error.message);
                      }
                    }}
                    className="hover:text-red-500 transition-colors"
                    title={t('directory.teams.delete_tooltip')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMembers = () => {
    const teamMembers = dbMembers.filter(p => p.teamId === selectedTeam);

    const getRoleName = (role: string) => {
      if (role === 'platform_admin') return t('directory.roles.platform_admin');
      if (role === 'admin') return t('directory.roles.admin');
      if (role === 'assistant') return t('directory.roles.assistant');
      if (role === 'user') return t('directory.roles.user');
      return role ? role.charAt(0).toUpperCase() + role.slice(1) : t('directory.roles.unknown');
    };

    const groupedMembers = teamMembers.reduce((acc, member) => {
      const roleGroup = getRoleName(member.role);
      if (!acc[roleGroup]) acc[roleGroup] = [];
      acc[roleGroup].push(member);
      return acc;
    }, {} as Record<string, typeof teamMembers>);

    const sortedRoles = Object.keys(groupedMembers).sort((a, b) => {
      if (a === t('directory.roles.platform_admin')) return -1;
      if (a === t('directory.roles.admin') && b !== t('directory.roles.platform_admin')) return -1;
      return a.localeCompare(b);
    });

    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <div className="flex-1 overflow-y-auto w-full scrollbar-dark">

          {/* PERSONAL SECTION */}
          <div className="h-16 px-8 flex items-center justify-between border-b border-border bg-sidebar sticky top-0 z-10">
            <h2 className="text-foreground font-medium text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> {selectedTeam === 'all_members' ? t('directory.members.org_title') : t('directory.members.team_title')}
            </h2>
            {selectedTeam !== 'all_members' && (userRole === 'platform_admin' || userRole === 'admin') && (
              <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-muted hover:text-foreground h-8 text-xs" onClick={() => setIsInviteManagerOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('directory.members.invite_button')}
              </Button>
            )}
          </div>

          <div className="pb-8">
            {sortedRoles.map((roleGroup) => (
              <div key={roleGroup}>
                <div className="px-8 py-2 bg-muted/40 border-b border-border flex items-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-16 z-0 backdrop-blur-md">
                  {roleGroup} ({groupedMembers[roleGroup].length})
                </div>
                {groupedMembers[roleGroup].map((member: any) => {
                  const displayName = member.name === member.email ? t('directory.members.name_unspecified') : member.name;
                  const displayInitial = (displayName !== t('directory.members.name_unspecified') ? displayName.charAt(0) : member.email.charAt(0)).toUpperCase();

                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedEntity(member)}
                      className="group flex items-center px-8 py-3 border-b border-border hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Avatar className="w-10 h-10 border border-border mr-4 shrink-0">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-muted text-primary font-bold text-xs">{displayInitial}</AvatarFallback>
                      </Avatar>

                      <div className="w-64 md:w-80 shrink-0 pr-4 text-foreground font-medium text-[14px]">
                        {displayName}
                        <div className="text-[12px] text-muted-foreground font-normal overflow-hidden text-ellipsis mt-0.5">
                          {member.email}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 pr-4 flex items-center justify-end">
                        {selectedTeam !== 'all_members' && (userRole === 'admin' || userRole === 'platform_admin') ? (
                          <div className="w-48" onClick={e => e.stopPropagation()}>
                            <select
                              className="w-full bg-muted border border-border text-foreground rounded-md px-2 py-1 text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                              value={member.roleId || ''}
                              onChange={async (e) => {
                                const newRoleId = e.target.value === '' ? null : e.target.value;
                                const { error } = await supabase.from('team_members').update({ role_id: newRoleId }).eq('user_id', member.id).eq('team_id', selectedTeam);
                                if (error) alert(t('directory.members.update_role_error') + " " + error.message);
                              }}
                            >
                              <option value="">{t('directory.members.default_assistant_role')}</option>
                              {dbWorkspaceRoles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        ) : null}
                      </div>

                      <div className="w-16 shrink-0 flex items-center justify-end text-muted-foreground gap-2 group-hover:text-foreground transition-colors">
                        {(userRole === 'admin' || userRole === 'platform_admin') && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (selectedTeam !== 'all_members') {
                                if (confirm(t('directory.members.delete_team_confirm', { name: member.name }))) {
                                  const { error } = await supabase.from('team_members').delete().eq('user_id', member.id).eq('team_id', selectedTeam);
                                  if (error) alert(t('directory.members.delete_error') + " " + error.message);
                                }
                              } else {
                                if (confirm(t('directory.members.delete_org_confirm', { name: member.name }))) {
                                  const { error } = await supabase.from('users').update({ workspace_id: null }).eq('id', member.id);
                                  if (error) alert(t('directory.members.delete_error') + " " + error.message);
                                  else {
                                    await supabase.from('team_members').delete().eq('user_id', member.id);
                                  }
                                }
                              }
                            }}
                            className="hover:text-red-500 transition-colors"
                            title={selectedTeam !== 'all_members' ? t('directory.members.delete_team_tooltip') : t('directory.members.delete_org_tooltip')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDetailSheet = () => {
    if (!selectedEntity) return null;
    const isPatient = selectedEntity.role === 'Patient';

    let headerGradient = 'from-primary/20';
    if (isPatient) headerGradient = 'from-violet-500/20';

    return (
      <Sheet open={!!selectedEntity} onOpenChange={(open) => !open && setSelectedEntity(null)}>
        <SheetContent className="bg-sidebar border-l-border text-foreground sm:max-w-md w-full p-0 overflow-y-auto scrollbar-dark flex flex-col h-full">

          <div className="p-6 border-b border-border bg-card relative">
            <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${headerGradient} to-transparent pointer-events-none`} />

            <SheetHeader className="relative z-10 pt-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 border-4 border-border shadow-md mb-3">
                  <AvatarImage src={selectedEntity.avatar} />
                  <AvatarFallback className="text-xl">{selectedEntity.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <SheetTitle className="text-xl text-foreground">{selectedEntity.name}</SheetTitle>

                {isPatient ? (
                  <SheetDescription className="text-muted-foreground mt-1 flex items-center gap-1.5 justify-center text-xs">
                    <User className="w-3 h-3" /> {selectedEntity.ssn}
                  </SheetDescription>
                ) : (
                  <Badge variant="outline" className="mt-2 text-primary border-primary/30 bg-primary/10 text-[10px] capitalize">
                    {selectedEntity.role === 'platform_admin' ? t('directory.roles.platform_admin') : selectedEntity.role}
                  </Badge>
                )}
              </div>
            </SheetHeader>

            {isPatient && (
              <div className="flex gap-2 justify-center mt-4">
                <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">
                  {t('settings.font_scale')}: {selectedEntity.careLevel}
                </Badge>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6 flex-1">

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('directory.detail.info_title')}</h4>
              <div className="bg-background rounded-lg p-3 space-y-2 border border-border">
                <div className="flex items-center gap-3 text-xs">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground">{selectedEntity.phone || t('directory.detail.phone_unspecified')}</span>
                </div>
                {!isPatient && selectedEntity.email && (
                  <div className="flex items-center gap-3 text-xs border-t border-border pt-2 mt-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-foreground">{selectedEntity.email}</span>
                  </div>
                )}
                {isPatient && selectedEntity.address && (
                  <div className="flex items-center gap-3 text-xs border-t border-border pt-2 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-foreground">{selectedEntity.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts */}
            {selectedEntity.alerts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-rose-500/80 uppercase tracking-wider">{t('directory.detail.warnings_title')}</h4>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                  {selectedEntity.alerts.map((alert: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-rose-400 text-xs font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {alert}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {isPatient && selectedEntity.notes && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('directory.detail.care_plan_title')}</h4>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {selectedEntity.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-border bg-muted/30 flex gap-2">
            {isPatient && (
              <Button size="sm" className="flex-1 bg-violet-600 hover:bg-violet-700 text-foreground h-9 text-xs">
                <FileText className="w-3.5 h-3.5 mr-2" />
                {t('directory.detail.journal_button')}
              </Button>
            )}
            {(userRole === 'platform_admin' || userRole === 'admin') && (
              <Button size="sm" variant="outline" className={`flex-1 bg-transparent border-border text-foreground hover:bg-muted h-9 text-xs ${!isPatient && "w-full"}`}>
                {t('directory.detail.edit_button', { type: isPatient ? t('directory.detail.patient') : t('directory.detail.staff') })}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Dev Hub Sheet - Skapa Bolag & Admin */}
      {isHubOpen && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-sidebar border border-border rounded-xl w-[400px] p-6 shadow-2xl">
            <h3 className="text-foreground text-lg font-medium mb-4">{t('directory.hub.title')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">{t('directory.hub.ws_name_label')}</label>
                <input value={hubWsName} onChange={(e) => setHubWsName(e.target.value)} className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder={t('directory.hub.ws_name_placeholder')} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">{t('directory.hub.admin_email_label')}</label>
                <input type="email" value={hubAdminEmail} onChange={(e) => setHubAdminEmail(e.target.value)} className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder={t('directory.hub.admin_email_placeholder')} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsHubOpen(false)} className="text-muted-foreground hover:text-foreground">{t('directory.hub.cancel')}</Button>
              <Button
                onClick={async () => {
                  setIsHubLoading(true);
                  const { data, error } = await supabase.functions.invoke('invite_user', {
                    body: { newWorkspaceName: hubWsName, email: hubAdminEmail, role: 'admin' }
                  });
                  setIsHubLoading(false);
                  if (error) alert(t('directory.members.delete_error') + " " + error.message);
                  else if (data && data.success === false) alert(t('directory.members.delete_error') + " " + data.error);
                  else { alert(t('directory.hub.success')); setIsHubOpen(false); setHubWsName(''); setHubAdminEmail(''); }
                }}
                disabled={isHubLoading || !hubWsName || !hubAdminEmail}
                className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white"
              >
                {isHubLoading ? t('directory.hub.creating') : t('directory.hub.create_invite')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Role Manager Sheet - Hantera och Skapa RBAC-roller */}
      {isRoleManagerOpen && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-sidebar border border-border rounded-xl w-[700px] shadow-2xl flex overflow-hidden min-h-[500px]">
            {/* Left side: List of Roles */}
            <div className="w-1/3 border-r border-border bg-muted/20 flex flex-col">
              <div className="p-4 border-b border-border">
                <h3 className="text-foreground font-medium flex items-center gap-2 text-sm"><Settings className="w-4 h-4" /> {t('directory.role_manager.title')}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {/* Default Assistant Role (Read Only) */}
                <div
                  className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${editingRole === null ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'}`}
                  onClick={() => { setEditingRole(null); setRoleForm({ name: '', can_manage_schedule: false, can_manage_notes: false, can_approve_time_reports: false }); }}
                >
                  <div className="text-sm font-medium text-foreground">{t('directory.members.default_assistant_role')}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t('directory.role_manager.locked_role_desc')}</div>
                </div>

                {dbWorkspaceRoles.map(role => (
                  <div
                    key={role.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${editingRole?.id === role.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'}`}
                    onClick={() => {
                      setEditingRole(role);
                      setRoleForm({
                        name: role.name,
                        can_manage_schedule: role.permissions?.can_manage_schedule || false,
                        can_manage_notes: role.permissions?.can_manage_notes || false,
                        can_approve_time_reports: role.permissions?.can_approve_time_reports || false
                      });
                    }}
                  >
                    <div className="text-sm font-medium text-foreground">{role.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t('directory.role_manager.custom_role_desc')}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full text-xs h-8"
                  onClick={() => {
                    setEditingRole('new');
                    setRoleForm({ name: '', can_manage_schedule: false, can_manage_notes: false, can_approve_time_reports: false });
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> {t('directory.role_manager.create_new_button')}
                </Button>
              </div>
            </div>

            {/* Right side: Editor */}
            <div className="flex-1 flex flex-col bg-background">
              {(editingRole === 'new' || (editingRole && editingRole.id)) ? (
                <>
                  <div className="p-6 border-b border-border">
                    <h3 className="text-lg font-medium text-foreground">{editingRole === 'new' ? t('directory.role_manager.create_title') : t('directory.role_manager.edit_title')}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{t('directory.role_manager.config_desc')}</p>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">{t('directory.role_manager.role_name_label')}</label>
                      <input
                        value={roleForm.name}
                        onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                        className="w-full bg-muted border border-border text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder={t('directory.role_manager.role_name_placeholder')}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block border-b border-border pb-2">{t('directory.role_manager.permissions_label')}</label>

                      <div className="flex items-start gap-3 bg-muted/40 p-4 rounded-lg border border-border">
                        <input
                          type="checkbox"
                          id="p_sched"
                          checked={roleForm.can_manage_schedule}
                          onChange={(e) => setRoleForm({ ...roleForm, can_manage_schedule: e.target.checked })}
                          className="w-5 h-5 cursor-pointer mt-0.5 accent-primary"
                        />
                        <label htmlFor="p_sched" className="cursor-pointer">
                          <div className="text-sm font-medium text-foreground">{t('directory.role_manager.perm_schedule_title')}</div>
                          <div className="text-xs text-muted-foreground mt-1">{t('directory.role_manager.perm_schedule_desc')}</div>
                        </label>
                      </div>

                      <div className="flex items-start gap-3 bg-muted/40 p-4 rounded-lg border border-border">
                        <input
                          type="checkbox"
                          id="p_notes"
                          checked={roleForm.can_manage_notes}
                          onChange={(e) => setRoleForm({ ...roleForm, can_manage_notes: e.target.checked })}
                          className="w-5 h-5 cursor-pointer mt-0.5 accent-primary"
                        />
                        <label htmlFor="p_notes" className="cursor-pointer">
                          <div className="text-sm font-medium text-foreground">{t('directory.role_manager.perm_notes_title')}</div>
                          <div className="text-xs text-muted-foreground mt-1">{t('directory.role_manager.perm_notes_desc')}</div>
                        </label>
                      </div>

                      <div className="flex items-start gap-3 bg-muted/40 p-4 rounded-lg border border-border">
                        <input
                          type="checkbox"
                          id="p_time"
                          checked={roleForm.can_approve_time_reports}
                          onChange={(e) => setRoleForm({ ...roleForm, can_approve_time_reports: e.target.checked })}
                          className="w-5 h-5 cursor-pointer mt-0.5 accent-primary"
                        />
                        <label htmlFor="p_time" className="cursor-pointer">
                          <div className="text-sm font-medium text-foreground">{t('directory.role_manager.perm_time_title')}</div>
                          <div className="text-xs text-muted-foreground mt-1">{t('directory.role_manager.perm_time_desc')}</div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-border flex justify-end gap-3 bg-sidebar">
                    <Button variant="ghost" onClick={() => setIsRoleManagerOpen(false)} className="text-muted-foreground hover:text-foreground">{t('directory.role_manager.close')}</Button>
                    {editingRole !== 'new' && (
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          if (confirm(t('directory.role_manager.delete_confirm'))) {
                            await supabase.from('workspace_roles').delete().eq('id', editingRole.id);
                            setEditingRole(null);
                          }
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        {t('directory.role_manager.delete_button')}
                      </Button>
                    )}
                    <Button
                      onClick={async () => {
                        const targetWS = selectedWorkspace || workspaceId;
                        const payload = {
                          workspace_id: targetWS,
                          name: roleForm.name,
                          permissions: {
                            can_manage_schedule: roleForm.can_manage_schedule,
                            can_manage_notes: roleForm.can_manage_notes,
                            can_approve_time_reports: roleForm.can_approve_time_reports
                          }
                        };

                        let error;
                        if (editingRole === 'new') {
                          const res = await supabase.from('workspace_roles').insert([payload]);
                          error = res.error;
                        } else {
                          const res = await supabase.from('workspace_roles').update(payload).eq('id', editingRole.id);
                          error = res.error;
                        }

                        if (error) alert(t('directory.members.delete_error') + " " + error.message);
                        else {
                          alert(editingRole === 'new' ? t('directory.role_manager.create_success') : t('directory.role_manager.update_success'));
                          setEditingRole(null);
                        }
                      }}
                      disabled={!roleForm.name}
                      className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white"
                    >
                      {editingRole === 'new' ? t('directory.role_manager.save_new') : t('directory.role_manager.save_changes')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col">
                  <Settings className="w-12 h-12 mb-4 opacity-20" />
                  <p>{t('directory.role_manager.empty_state')}</p>
                  <Button variant="ghost" className="mt-6" onClick={() => setIsRoleManagerOpen(false)}>{t('directory.role_manager.close_manager')}</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Skapa Team Sheet */}
      {isTeamManagerOpen && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-sidebar border border-border rounded-xl w-[400px] p-6 shadow-2xl">
            <h3 className="text-foreground text-lg font-medium mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> {t('directory.create_team.submit')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">{t('directory.create_team.name_label')}</label>
                <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder={t('directory.create_team.name_placeholder')} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsTeamManagerOpen(false)} className="text-muted-foreground hover:text-foreground">{t('directory.hub.cancel')}</Button>
              <Button
                onClick={async () => {
                  const targetWS = selectedWorkspace || workspaceId;
                  const { error } = await supabase.from('teams').insert([{ workspace_id: targetWS, name: newTeamName }]);
                  if (error) alert(t('directory.members.delete_error') + " " + error.message);
                  else {
                    alert(t('directory.create_team.success'));
                    setIsTeamManagerOpen(false);
                    setNewTeamName('');
                  }
                }}
                disabled={!newTeamName}
                className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white"
              >
                {t('directory.create_team.submit')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bjud in Personal / Hantera Team Medlemmar */}
      {isInviteManagerOpen && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-sidebar border border-border rounded-xl w-[450px] p-0 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 pb-2 border-b border-border">
              <h3 className="text-foreground text-lg font-medium mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> {t('directory.invite.title')}
              </h3>

              <div className="flex bg-muted rounded-lg p-1 mb-4">
                <button
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${inviteTab === 'existing' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setInviteTab('existing')}
                >
                  {t('directory.invite.tab_existing')}
                </button>
                <button
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${inviteTab === 'new' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setInviteTab('new')}
                >
                  {t('directory.invite.tab_new')}
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 max-h-[350px] overflow-y-auto scrollbar-dark">
              {inviteTab === 'existing' ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">{t('directory.invite.existing_desc')}</p>
                  <div className="space-y-2">
                    {workspaceUsers.length === 0 ? (
                      <div className="text-sm text-center py-4 text-muted-foreground">{t('directory.invite.no_users')}</div>
                    ) : (
                      workspaceUsers.map(u => (
                        <div
                          key={u.id}
                          onClick={() => setSelectedExistingUserId(u.id)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedExistingUserId === u.id ? 'bg-primary/10 border-primary/50' : 'bg-muted border-border hover:border-border'}`}
                        >
                          <div>
                            <div className="text-foreground text-sm font-medium">{u.full_name || t('directory.invite.anonymous')}</div>
                            <div className="text-muted-foreground text-xs">{u.email}</div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedExistingUserId === u.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                            {selectedExistingUserId === u.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('directory.invite.new_desc')}</p>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">{t('directory.invite.email_label')}</label>
                    <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder={t('directory.invite.email_placeholder')} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-border bg-background flex justify-end gap-3">
              <Button variant="ghost" onClick={() => { setIsInviteManagerOpen(false); setSelectedExistingUserId(''); }} className="text-muted-foreground hover:text-foreground text-xs h-9">{t('directory.hub.cancel')}</Button>
              {inviteTab === 'existing' ? (
                <Button
                  onClick={async () => {
                    const { error } = await supabase.from('team_members').insert([{ team_id: selectedTeam, user_id: selectedExistingUserId }]);
                    if (error) alert(t('directory.members.delete_error') + " " + error.message);
                    else {
                      alert(t('directory.invite.existing_success'));
                      setIsInviteManagerOpen(false);
                      setSelectedExistingUserId('');
                      // TODO: Hårdkodad trefres för att ladda om datan behövs egentligen, men i en produktionsapp lyssnar vi t.ex via realtime.
                    }
                  }}
                  disabled={!selectedExistingUserId}
                  className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white text-xs h-9"
                >
                  {t('directory.invite.title')}
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    setIsHubLoading(true);
                    const { data, error } = await supabase.functions.invoke('invite_user', {
                      body: { email: inviteEmail, role: 'assistant', workspaceId: selectedWorkspace || workspaceId, teamId: selectedTeam }
                    });
                    setIsHubLoading(false);
                    if (error) alert(t('directory.members.delete_error') + " " + error.message);
                    else if (data && data.success === false) alert(t('directory.members.delete_error') + " " + data.error);
                    else { alert(t('directory.invite.new_success')); setIsInviteManagerOpen(false); setInviteEmail(''); }
                  }}
                  disabled={isHubLoading || !inviteEmail}
                  className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white text-xs h-9"
                >
                  {isHubLoading ? t('directory.invite.sending') : t('directory.invite.send_button')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col w-full h-full">
        {currentLevel === 'workspaces' && renderWorkspaces()}
        {currentLevel === 'teams' && renderTeams()}
        {currentLevel === 'members' && renderMembers()}
      </div>

      {renderDetailSheet()}
    </div>
  );
};
