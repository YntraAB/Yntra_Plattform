import React from 'react';
import { useTimeManager } from './hooks/useTimeManager';
import { PlatformOverview } from './components/PlatformOverview';
import { TeamOverview } from './components/TeamOverview';
import { AssistantTeams } from './components/AssistantTeams';
import { ShiftSystem } from './components/ShiftSystem';

export const TimeManagerPage: React.FC = () => {
  const {
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
  } = useTimeManager();

  return (
    <div className="h-full flex flex-col bg-background relative">
      <div className="flex-1 flex flex-col w-full h-full">
        {currentLevel === 'platform_overview' && (
          <PlatformOverview
            dbWorkspaces={dbWorkspaces}
            shifts={shifts}
          />
        )}
        {currentLevel === 'team_overview' && (
          <TeamOverview
            dbUsers={dbUsers}
            shifts={shifts}
            loading={loading}
            openEmployeeShifts={openEmployeeShifts}
          />
        )}
        {currentLevel === 'assistant_teams' && (
          <AssistantTeams
            dbTeams={dbTeams}
            shifts={shifts}
            activeRole={activeRole}
            workspaceId={workspaceId}
            openTeamShifts={openTeamShifts}
          />
        )}
        {currentLevel === 'shift_list' && (
          <ShiftSystem
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

export default TimeManagerPage;
