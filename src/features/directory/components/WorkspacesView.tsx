import React from 'react'
import { Building2, Users, User, ChevronRight, Trash2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { WorkspaceItem } from '../hooks/useDirectoryData'

interface WorkspacesViewProps {
  workspaces: WorkspaceItem[]
  userRole: string
  onSelectWorkspace: (id: string) => void
  onOpenHub: () => void
  setDbWorkspaces: React.Dispatch<React.SetStateAction<WorkspaceItem[]>>
}

export const WorkspacesView: React.FC<WorkspacesViewProps> = ({
  workspaces,
  userRole,
  onSelectWorkspace,
  onOpenHub,
  setDbWorkspaces,
}) => {
  const { t } = useTranslation()

  return (
    <div className="relative flex h-full flex-1 flex-col bg-background">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-8">
        <h2 className="flex items-center gap-2 text-base font-medium text-foreground">
          <Building2 className="h-4 w-4 text-primary" /> {t('directory.levels.workspaces')}
        </h2>
        {userRole === 'platform_admin' && (
          <Button
            size="sm"
            className="h-8 bg-primary text-xs text-white hover:bg-primary/80 dark:bg-[#0F1115] dark:hover:bg-[#1A1D24]"
            onClick={onOpenHub}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> {t('directory.workspaces.create_button')}
          </Button>
        )}
      </div>
      <div className="scrollbar-dark w-full flex-1 overflow-y-auto">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            onClick={() => onSelectWorkspace(ws.id)}
            className="group flex cursor-pointer items-center border-b border-border px-8 py-3 transition-colors hover:bg-muted"
          >
            <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-secondary text-primary transition-colors">
              <Building2 className="h-5 w-5" />
            </div>

            <div className="w-64 shrink-0 pr-4 text-[15px] font-medium text-foreground md:w-80">
              {ws.name}
              <div className="mt-0.5 text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
                {ws.type}
              </div>
            </div>

            <div className="min-w-0 flex-1 pr-4"></div>

            <div className="mr-4 flex w-48 shrink-0 items-center justify-end gap-6 text-[13px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> {ws.teamsCount}{' '}
                {t('directory.workspaces.teams_count')}
              </div>
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {ws.membersCount}{' '}
                {t('directory.workspaces.users_count')}
              </div>
            </div>

            <div className="flex w-12 shrink-0 items-center justify-end gap-2 text-muted-foreground transition-colors group-hover:text-foreground">
              {userRole === 'platform_admin' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(t('directory.workspaces.delete_confirm'))) {
                      supabase.rpc('delete_workspace', { target_workspace_id: ws.id }).then(() => {
                        setDbWorkspaces((prev) => prev.filter((w) => w.id !== ws.id))
                      })
                    }
                  }}
                  className="mr-2 transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
