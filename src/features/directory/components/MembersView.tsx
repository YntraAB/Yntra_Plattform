import React from 'react';
import { User, ChevronRight, Trash2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import type { MemberItem, WorkspaceRole } from '../hooks/useDirectoryData';

interface MembersViewProps {
  members: MemberItem[];
  userRole: string;
  selectedTeam: string | null;
  dbWorkspaceRoles: WorkspaceRole[];
  onSelectMember: (member: MemberItem) => void;
  onOpenInviteManager: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  userRole,
  selectedTeam,
  dbWorkspaceRoles,
  onSelectMember,
  onOpenInviteManager
}) => {
  const { t } = useTranslation();

  const getRoleName = (role: string) => {
    if (role === 'platform_admin') return t('directory.roles.platform_admin');
    if (role === 'admin') return t('directory.roles.admin');
    if (role === 'assistant') return t('directory.roles.assistant');
    if (role === 'user') return t('directory.roles.user');
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : t('directory.roles.unknown');
  };

  const groupedMembers = members.reduce((acc, member) => {
    const roleGroup = getRoleName(member.role);
    if (!acc[roleGroup]) acc[roleGroup] = [];
    acc[roleGroup].push(member);
    return acc;
  }, {} as Record<string, MemberItem[]>);

  const sortedRoles = Object.keys(groupedMembers).sort((a, b) => {
    if (a === t('directory.roles.platform_admin')) return -1;
    if (a === t('directory.roles.admin') && b !== t('directory.roles.platform_admin')) return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
        <div className="h-16 px-8 flex items-center justify-between border-b border-border bg-sidebar sticky top-0 z-10">
          <h2 className="text-foreground font-medium text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> {selectedTeam === 'all_members' ? t('directory.members.org_title') : t('directory.members.team_title')}
          </h2>
          {selectedTeam !== 'all_members' && (userRole === 'platform_admin' || userRole === 'admin') && (
            <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-muted hover:text-foreground h-8 text-xs" onClick={onOpenInviteManager}>
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
              {groupedMembers[roleGroup].map((member) => {
                const displayName = member.name === member.email ? t('directory.members.name_unspecified') : member.name;
                const displayInitial = (displayName !== t('directory.members.name_unspecified') ? displayName.charAt(0) : member.email.charAt(0)).toUpperCase();

                return (
                  <div
                    key={member.id}
                    onClick={() => onSelectMember(member)}
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
                          <Select
                            value={member.roleId || 'none'}
                            onValueChange={async (value) => {
                              const newRoleId = value === 'none' ? null : value;
                              const { error } = await supabase.from('team_members').update({ role_id: newRoleId }).eq('user_id', member.id).eq('team_id', selectedTeam);
                              if (error) alert(t('directory.members.update_role_error') + " " + error.message);
                            }}
                          >
                            <SelectTrigger className="w-full h-8 text-xs bg-muted/50 border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t('directory.members.default_assistant_role')}</SelectItem>
                              {dbWorkspaceRoles.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
