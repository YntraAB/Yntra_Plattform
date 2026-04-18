import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useWorkspaceUsers, useWorkspaceTeams, useWorkspaceNotes } from '@/hooks/queries/useWorkspaceData';
import { useMessages } from '@/hooks/queries/useMessages';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Users,
  User,
  Calendar,
  Mail,
  FileText,
  Settings,
  Clock,
  LayoutGrid,
  Globe,
  Palette,
  BellRing
} from 'lucide-react';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { useAuth } from '@/hooks/useAuth';

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();

  const { data: users = [] } = useWorkspaceUsers(workspaceId);
  const { data: teams = [] } = useWorkspaceTeams(workspaceId);
  const { data: notes = [] } = useWorkspaceNotes(workspaceId);
  const { data: rawMessages = [] } = useMessages(workspaceId || undefined);

  const messages = React.useMemo(() => {
    return rawMessages.map((m: any) => {
      const sndrData = Array.isArray(m.sender) ? m.sender[0] : m.sender;
      const senderName = sndrData ? (sndrData.full_name || sndrData.email || t('messages.system')) : t('messages.system');
      const isSent = m.sender_id === user?.id;
      
      return {
        id: m.id,
        subject: m.subject || t('messages.no_header'),
        senderName,
        isSent,
        date: new Date(m.created_at).toLocaleDateString()
      };
    });
  }, [rawMessages, user?.id, t]);

  const navigationItems = [
    { id: 'schedule', label: t('sidebar.schedule'), path: '/schedule', icon: Calendar },
    { id: 'inbox', label: t('sidebar.inbox'), path: '/inbox', icon: Mail },
    { id: 'work-notes', label: t('sidebar.work_notes'), path: '/work-notes', icon: FileText },
    { id: 'directory', label: t('sidebar.teams'), path: '/directory', icon: Users },
    { id: 'time', label: t('sidebar.time_management'), path: '/time', icon: Clock },
    { id: 'settings', label: t('common.settings'), path: '/settings', icon: Settings },
  ];

  const settingsItems = [
    { id: 'set-gen', label: t('settings.localization') || 'Språk & Tidszon', path: '/settings?tab=general', icon: Globe },
    { id: 'set-app', label: t('settings.theme') || 'Tema & Utseende', path: '/settings?tab=general', icon: Palette },
    { id: 'set-mod', label: t('settings.tabs.modules') || 'Moduler & Funktioner', path: '/settings?tab=modules', icon: LayoutGrid },
    { id: 'set-not', label: t('settings.notifications.title') || 'Notiser', path: '/settings?tab=notifications', icon: BellRing },
  ];

  const onSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder={t('common.search') + "..."} 
        className="focus:ring-0 focus-visible:ring-0 shadow-none border-none outline-none"
      />
      <CommandList className="scrollbar-dark">
        <CommandEmpty>{t('messages.empty_state') || 'Hittade ingenting...'}</CommandEmpty>

        <CommandGroup heading={t('sidebar.show') || 'Navigering'}>
          {navigationItems.map((item) => (
            <CommandItem key={item.id} onSelect={() => onSelect(item.path)}>
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('sidebar.inbox') || 'Inkorg'}>
          {messages.map((msg: { id: string; subject: string; isSent: boolean; senderName: string; date: string }) => (
            <CommandItem key={msg.id} onSelect={() => onSelect(`/inbox?messageId=${msg.id}`)}>
              <Mail className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{msg.subject}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[400px]">
                  {msg.isSent ? t('messages.sent') : msg.senderName} • {msg.date}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('sidebar.work_notes') || 'Arbetspassanteckningar'}>
          {notes.map((note) => (
            <CommandItem key={note.id} onSelect={() => onSelect(`/work-notes?team=${note.team_id}&note=${note.id}`)}>
              <FileText className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{note.subject}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[400px]">
                  {note.team?.name} • {note.author?.full_name || note.author?.email}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('common.settings') || 'Inställningar'}>
          {settingsItems.map((item) => (
            <CommandItem key={item.id} onSelect={() => onSelect(item.path)}>
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('directory.levels.teams') || 'Teams'}>
          {teams.map((team) => (
            <CommandItem key={team.id} onSelect={() => onSelect(`/directory?team=${team.id}`)}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              <span>{team.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('directory.roles.assistant') || 'Personal'}>
          {users.map((user) => (
            <CommandItem key={user.id} onSelect={() => onSelect(`/directory?user=${user.id}`)}>
              <User className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>{user.name}</span>
                <span className="text-[10px] text-muted-foreground">{user.email}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
