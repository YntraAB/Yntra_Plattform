import React from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useWorkspaceTeams } from '@/hooks/queries/useWorkspaceData'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, FilterX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const TeamSwitcher: React.FC = () => {
  const { t } = useTranslation()
  const { workspaceId, selectedTeamId, setSelectedTeamId } = useWorkspace()
  const { data: teams = [], isLoading } = useWorkspaceTeams(workspaceId)

  if (isLoading) {
    return <div className="h-9 w-full animate-pulse rounded-md bg-secondary/50" />
  }

  return (
    <div className="mb-4 px-3">
      <div className="mb-1.5 flex items-center gap-2 px-1">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t('common.active_team') || 'Aktivt Team'}
        </span>
      </div>
      <Select
        value={selectedTeamId || 'all'}
        onValueChange={(val) => setSelectedTeamId(val === 'all' ? null : val)}
      >
        <SelectTrigger className="h-9 w-full border-border/50 bg-background/50 transition-colors hover:bg-secondary/50">
          <SelectValue placeholder={t('common.all_teams') || 'Alla team'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <FilterX className="h-4 w-4 text-muted-foreground" />
              <span>{t('common.all_teams') || 'Alla team'}</span>
            </div>
          </SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              <div className="flex w-full items-center justify-between gap-2">
                <span>{team.name}</span>
                {team.is_active === false && (
                  <Badge variant="outline" className="h-3 px-1 text-[8px]">
                    Inaktiv
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
