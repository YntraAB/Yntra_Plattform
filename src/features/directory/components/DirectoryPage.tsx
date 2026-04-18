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
    workspaceId
  } = useDirectoryData();

  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [isInviteManagerOpen, setIsInviteManagerOpen] = useState(false);

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
    </div>
  );
};
