import React from 'react';
import { Building2, Users, User, ChevronRight, Trash2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { WorkspaceItem } from '../hooks/useDirectoryData';

interface WorkspacesViewProps {
  workspaces: WorkspaceItem[];
  userRole: string;
  onSelectWorkspace: (id: string) => void;
  onOpenHub: () => void;
  setDbWorkspaces: React.Dispatch<React.SetStateAction<WorkspaceItem[]>>;
}

export const WorkspacesView: React.FC<WorkspacesViewProps> = ({
  workspaces,
  userRole,
  onSelectWorkspace,
  onOpenHub,
  setDbWorkspaces
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      <div className="h-16 px-8 flex items-center justify-between border-b border-border shrink-0">
        <h2 className="text-foreground font-medium text-base flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> {t('directory.levels.workspaces')}
        </h2>
        {userRole === 'platform_admin' && (
          <Button size="sm" className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white h-8 text-xs" onClick={onOpenHub}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('directory.workspaces.create_button')}
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
        {workspaces.map(ws => (
          <div
            key={ws.id}
            onClick={() => onSelectWorkspace(ws.id)}
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
};
