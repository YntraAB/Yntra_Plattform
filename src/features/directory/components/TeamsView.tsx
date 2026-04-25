import React from 'react';
import { Users, User, HeartPulse, ChevronRight, Trash2, Plus, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { TeamItem } from '../hooks/useDirectoryData';

interface TeamsViewProps {
  teams: TeamItem[];
  userRole: string;
  onSelectTeam: (id: string) => void;
  onOpenRoleManager: () => void;
  onOpenTeamManager: () => void;
  onOpenClientManager: () => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  teams,
  userRole,
  onSelectTeam,
  onOpenRoleManager,
  onOpenTeamManager,
  onOpenClientManager
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      <div className="h-16 px-8 flex items-center justify-between border-b border-border shrink-0">
        <h2 className="text-foreground font-medium text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> {t('directory.teams.title')}
        </h2>
        <div className="flex items-center gap-2">
          {(userRole === 'admin' || userRole === 'platform_admin') && (
            <>
              <Button size="sm" variant="outline" className="border-border text-foreground bg-transparent h-8 text-xs hover:bg-secondary" onClick={onOpenRoleManager}>
                {t('directory.teams.manage_roles')}
              </Button>
              <Button size="sm" className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white h-8 text-xs" onClick={onOpenTeamManager}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('directory.teams.create_button')}
              </Button>
              <Button size="sm" className="bg-secondary text-foreground hover:bg-muted border border-border h-8 text-xs" onClick={onOpenClientManager}>
                <UserPlus className="w-3.5 h-3.5 mr-1.5 text-primary" /> {t('directory.teams.create_client_button')}
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
        {(userRole === 'admin' || userRole === 'platform_admin') && (
          <div
            onClick={() => onSelectTeam('all_members')}
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
            onClick={() => onSelectTeam(team.id)}
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
