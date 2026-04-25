import React, { useState } from 'react';

import { useDirectoryData, type MemberItem } from '../hooks/useDirectoryData';
import { WorkspacesView } from './WorkspacesView';
import { TeamsView } from './TeamsView';
import { MembersView } from './MembersView';
import { MemberDetailSheet } from './MemberDetailSheet';
import { DevHubModal } from './DevHubModal';
import { RoleManagerModal } from './RoleManagerModal';
import { TeamManagerModal } from './TeamManagerModal';
import { InviteManagerModal } from './InviteManagerModal';
import { ClientManagerModal } from './ClientManagerModal';
import { EditMemberModal } from './EditMemberModal';
import { useBreadcrumbContext } from '@/contexts/BreadcrumbContext';
import { useEffect } from 'react';

export const DirectoryPage: React.FC = () => {
  const {
    userRole,
    currentLevel,
    selectedWorkspace,
    selectedTeam,
    selectedEntity,
    setSelectedEntity,
    dbWorkspaces,
    setDbWorkspaces,
    dbTeams,
    dbMembers,
    dbWorkspaceRoles,
    handleSelectWorkspace,
    handleSelectTeam,
    loadDirectory,
    workspaceId
  } = useDirectoryData();

  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [isInviteManagerOpen, setIsInviteManagerOpen] = useState(false);
  const [isClientManagerOpen, setIsClientManagerOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<MemberItem | null>(null);

  const { setDynamicBreadcrumbs } = useBreadcrumbContext();

  useEffect(() => {
    const breadcrumbs = [];
    if (currentLevel === 'teams' || currentLevel === 'members') {
      const workspace = dbWorkspaces.find(w => w.id === selectedWorkspace);
      if (workspace) {
        breadcrumbs.push({ label: workspace.name, onClick: () => { setSelectedEntity(null); handleSelectWorkspace(workspace.id); } });
      }
    }
    if (currentLevel === 'members') {
      const team = dbTeams.find(t => t.id === selectedTeam);
      if (team) {
        breadcrumbs.push({ label: team.name, onClick: () => { setSelectedEntity(null); handleSelectTeam(team.id); } });
      }
    }
    if (selectedEntity) {
      breadcrumbs.push({ label: (selectedEntity as MemberItem).name || (selectedEntity as MemberItem).email });
    }
    setDynamicBreadcrumbs(breadcrumbs);
  }, [currentLevel, selectedWorkspace, selectedTeam, selectedEntity, dbWorkspaces, dbTeams, setDynamicBreadcrumbs, handleSelectWorkspace, handleSelectTeam, setSelectedEntity]);

  useEffect(() => {
    return () => setDynamicBreadcrumbs([]);
  }, [setDynamicBreadcrumbs]);

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Views */}
      <div className="flex-1 flex flex-col w-full h-full">
        {currentLevel === 'workspaces' && (
          <WorkspacesView
            workspaces={dbWorkspaces}
            userRole={userRole}
            onSelectWorkspace={handleSelectWorkspace}
            onOpenHub={() => setIsHubOpen(true)}
            setDbWorkspaces={setDbWorkspaces}
          />
        )}
        {currentLevel === 'teams' && (
          <TeamsView
            teams={userRole === 'platform_admin' ? dbTeams.filter(t => t.workspaceId === selectedWorkspace) : dbTeams}
            userRole={userRole}
            onSelectTeam={handleSelectTeam}
            onOpenRoleManager={() => setIsRoleManagerOpen(true)}
            onOpenTeamManager={() => setIsTeamManagerOpen(true)}
            onOpenClientManager={() => setIsClientManagerOpen(true)}
          />
        )}
        {currentLevel === 'members' && (
          <MembersView
            members={dbMembers.filter(p => p.teamId === selectedTeam)}
            userRole={userRole}
            selectedTeam={selectedTeam}
            dbWorkspaceRoles={dbWorkspaceRoles}
            onSelectMember={setSelectedEntity}
            onOpenInviteManager={() => setIsInviteManagerOpen(true)}
          />
        )}
      </div>

      {/* Sheets & Modals */}
      <MemberDetailSheet
        member={currentLevel === 'members' ? (selectedEntity as MemberItem | null) : null}
        onClose={() => setSelectedEntity(null)}
        userRole={userRole}
        onEdit={(m) => {
          setMemberToEdit(m);
          setIsEditMemberOpen(true);
        }}
      />

      <DevHubModal
        isOpen={isHubOpen}
        onClose={() => setIsHubOpen(false)}
      />

      <RoleManagerModal
        isOpen={isRoleManagerOpen}
        onClose={() => setIsRoleManagerOpen(false)}
        workspaceRoles={dbWorkspaceRoles}
        workspaceId={workspaceId}
        selectedWorkspace={selectedWorkspace}
      />

      <TeamManagerModal
        isOpen={isTeamManagerOpen}
        onClose={() => setIsTeamManagerOpen(false)}
        workspaceId={workspaceId}
        selectedWorkspace={selectedWorkspace}
      />

      <InviteManagerModal
        isOpen={isInviteManagerOpen}
        onClose={() => setIsInviteManagerOpen(false)}
        selectedTeam={selectedTeam}
        selectedWorkspace={selectedWorkspace}
        workspaceId={workspaceId}
      />

      <ClientManagerModal
        isOpen={isClientManagerOpen}
        onClose={() => setIsClientManagerOpen(false)}
        workspaceId={workspaceId}
        teams={dbTeams}
      />

      <EditMemberModal
        isOpen={isEditMemberOpen}
        onClose={() => {
          setIsEditMemberOpen(false);
          setMemberToEdit(null);
        }}
        member={memberToEdit}
        onSave={() => {
          loadDirectory();
        }}
      />
    </div>
  );
};
