import React from 'react'
import { Users, User, HeartPulse, ChevronRight, Trash2, Plus, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import type { TeamItem } from '../hooks/useDirectoryData'

interface TeamsViewProps {
  teams: TeamItem[]
  userRole: string
  onSelectTeam: (id: string) => void
  onOpenRoleManager: () => void
  onOpenTeamManager: () => void
  onOpenClientManager: () => void
  onOpenAdminInvite: () => void
  onPrefetchTeam: (id: string) => void
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  teams,
  userRole,
  onSelectTeam,
  onOpenRoleManager,
  onOpenTeamManager,
  onOpenAdminInvite,
  onPrefetchTeam,
}) => {
  const { t } = useTranslation()

  return (
    <div className="relative flex h-full flex-1 flex-col bg-background">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-8">
        <h2 className="flex items-center gap-2 text-base font-medium text-foreground">
          <Users className="h-4 w-4 text-primary" /> {t('directory.teams.title')}
        </h2>
        <div className="flex items-center gap-2">
          {(userRole === 'admin' || userRole === 'platform_admin') && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-border bg-transparent text-xs text-foreground hover:bg-secondary"
                onClick={onOpenRoleManager}
              >
                {t('directory.teams.manage_roles')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-border bg-transparent text-xs text-foreground hover:bg-secondary"
                onClick={onOpenAdminInvite}
              >
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-primary" />{' '}
                {t('directory.teams.add_admin_button')}
              </Button>
              <Button
                size="sm"
                className="h-8 bg-primary text-xs text-white hover:bg-primary/80 dark:bg-[#0F1115] dark:hover:bg-[#1A1D24]"
                onClick={onOpenTeamManager}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> {t('directory.teams.create_button')}
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="scrollbar-dark w-full flex-1 overflow-y-auto">
        {(userRole === 'admin' || userRole === 'platform_admin') && (
          <div
            onClick={() => onSelectTeam('all_members')}
            onMouseEnter={() => onPrefetchTeam('all_members')}
            className="group flex cursor-pointer items-center border-b border-border bg-primary/5 px-8 py-3 transition-colors hover:bg-muted"
          >
            <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-primary/20 text-primary transition-colors">
              <Users className="h-5 w-5" />
            </div>

            <div className="w-64 shrink-0 pr-4 text-[15px] font-medium text-foreground md:w-80">
              {t('directory.levels.all_members')}
              <div className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                {t('directory.teams.all_members_subtitle')}
              </div>
            </div>

            <div className="min-w-0 flex-1 pr-4"></div>

            <div className="flex w-12 shrink-0 items-center justify-end text-muted-foreground transition-colors group-hover:text-foreground">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        )}
        {teams.map((team) => (
          <div
            key={team.id}
            onClick={() => onSelectTeam(team.id)}
            onMouseEnter={() => onPrefetchTeam(team.id)}
            className="group flex cursor-pointer items-center border-b border-border px-8 py-3 transition-colors hover:bg-muted"
          >
            <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-secondary font-bold text-primary transition-colors">
              {team.name.charAt(0)}
            </div>

            <div className="w-64 shrink-0 pr-4 text-[15px] font-medium text-foreground md:w-80">
              {team.name}
              <div className="mt-0.5 text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
                {t('directory.teams.led_by')}{' '}
                <span className="text-muted-foreground">{team.leader}</span>
              </div>
            </div>

            <div className="min-w-0 flex-1 pr-4"></div>

            <div className="flex w-48 shrink-0 items-center justify-end gap-3">
              <Badge
                variant="secondary"
                className="border border-border bg-secondary py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                <User className="mr-1 h-3 w-3" /> {team.membersCount}{' '}
                {t('directory.teams.assistants_count')}
              </Badge>
              <Badge
                variant="secondary"
                className="border border-violet-500/20 bg-violet-500/10 py-0.5 text-[10px] font-medium text-violet-400"
              >
                <HeartPulse className="mr-1 h-3 w-3" /> {team.patientsCount}{' '}
                {t('directory.teams.patients_count')}
              </Badge>
            </div>

            <div className="flex w-16 shrink-0 items-center justify-end gap-2 text-muted-foreground transition-colors group-hover:text-foreground">
              {(userRole === 'admin' || userRole === 'platform_admin') && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (confirm(t('directory.teams.delete_confirm', { name: team.name }))) {
                      const { error } = await supabase.from('teams').delete().eq('id', team.id)
                      if (error) alert(t('directory.members.delete_error') + ' ' + error.message)
                    }
                  }}
                  className="transition-colors hover:text-red-500"
                  title={t('directory.teams.delete_tooltip')}
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
