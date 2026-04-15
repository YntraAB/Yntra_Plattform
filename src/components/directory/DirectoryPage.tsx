import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useDirectoryData } from './hooks/useDirectoryData';
import { WorkspacesView } from './components/WorkspacesView';
import { TeamsView } from './components/TeamsView';
import { MembersView } from './components/MembersView';
import { MemberDetailSheet } from './components/MemberDetailSheet';
import { DevHubModal } from './components/DevHubModal';
import { RoleManagerModal } from './components/RoleManagerModal';
import { TeamManagerModal } from './components/TeamManagerModal';
import { InviteManagerModal } from './components/InviteManagerModal';

interface DirectoryPageProps {
  setBreadcrumbNode: (node: React.ReactNode) => void;
}

export const DirectoryPage: React.FC<DirectoryPageProps> = ({ setBreadcrumbNode }) => {
  const { t } = useTranslation();
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
    handleBreadcrumbClick,
    workspaceId
  } = useDirectoryData();

  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [isInviteManagerOpen, setIsInviteManagerOpen] = useState(false);

  useEffect(() => {
    const ws = dbWorkspaces.find(w => w.id === selectedWorkspace);
    const tm = selectedTeam === 'all_members' ? { name: t('directory.levels.all_members') } : dbTeams.find(t => t.id === selectedTeam);

    const bNode = (
      <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
        <button
          onClick={() => handleBreadcrumbClick(userRole === 'platform_admin' ? 'workspaces' : 'teams')}
          className={`hover:text-foreground transition-colors flex items-center ${currentLevel === 'workspaces' || (currentLevel === 'teams' && userRole !== 'platform_admin')
            ? 'text-foreground font-medium'
            : ''
            }`}
        >
          {t('directory.levels.teams')}
        </button>
        {((userRole === 'platform_admin' && currentLevel !== 'workspaces') || (userRole !== 'platform_admin' && currentLevel === 'members')) && (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-1" />
        )}

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

        {tm && (
          <span className="text-foreground font-medium flex items-center">
            {tm.name}
          </span>
        )}
      </div>
    );
    setBreadcrumbNode(bNode);
  }, [userRole, currentLevel, selectedWorkspace, selectedTeam, setBreadcrumbNode, handleBreadcrumbClick, dbWorkspaces, dbTeams, t]);

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
        member={selectedEntity}
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
