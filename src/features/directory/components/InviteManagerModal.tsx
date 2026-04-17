import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface InviteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeam: string | null;
  selectedWorkspace: string | null;
  workspaceId: string | null;
}

export const InviteManagerModal: React.FC<InviteManagerModalProps> = ({
  isOpen,
  onClose,
  selectedTeam,
  selectedWorkspace,
  workspaceId
}) => {
  const { t } = useTranslation();
  const [inviteTab, setInviteTab] = useState<'existing' | 'new'>('existing');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedExistingUserId, setSelectedExistingUserId] = useState('');
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchWorkspaceUsers = async () => {
        const targetWS = selectedWorkspace || workspaceId;
        const { data: usersData } = await supabase.from('users').select('*').eq('workspace_id', targetWS);
        const { data: teamMembersData } = await supabase.from('team_members').select('user_id').eq('team_id', selectedTeam);

        const existingMemberIds = (teamMembersData || []).map(tm => tm.user_id);
        const availableUsers = (usersData || []).filter(u => !existingMemberIds.includes(u.id));
        setWorkspaceUsers(availableUsers);
      };
      fetchWorkspaceUsers();
    }
  }, [isOpen, selectedWorkspace, workspaceId, selectedTeam]);

  if (!isOpen) return null;

  const handleInviteExisting = async () => {
    const { error } = await supabase.from('team_members').insert([{ team_id: selectedTeam, user_id: selectedExistingUserId }]);
    if (error) alert(t('directory.members.delete_error') + " " + error.message);
    else {
      alert(t('directory.invite.existing_success'));
      onClose();
      setSelectedExistingUserId('');
    }
  };

  const handleInviteNew = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.functions.invoke('invite_user', {
      body: { email: inviteEmail, role: 'assistant', workspaceId: selectedWorkspace || workspaceId, teamId: selectedTeam }
    });
    setIsLoading(false);
    if (error) alert(t('directory.members.delete_error') + " " + error.message);
    else if (data && data.success === false) alert(t('directory.members.delete_error') + " " + data.error);
    else {
      alert(t('directory.invite.new_success'));
      onClose();
      setInviteEmail('');
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-sidebar border border-border rounded-xl w-[450px] p-0 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 pb-2 border-b border-border">
          <h3 className="text-foreground text-lg font-medium mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> {t('directory.invite.title')}
          </h3>

          <div className="flex bg-muted rounded-lg p-1 mb-4">
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${inviteTab === 'existing' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setInviteTab('existing')}
            >
              {t('directory.invite.tab_existing')}
            </button>
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${inviteTab === 'new' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setInviteTab('new')}
            >
              {t('directory.invite.tab_new')}
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 max-h-[350px] overflow-y-auto scrollbar-dark">
          {inviteTab === 'existing' ? (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">{t('directory.invite.existing_desc')}</p>
              <div className="space-y-2">
                {workspaceUsers.length === 0 ? (
                  <div className="text-sm text-center py-4 text-muted-foreground">{t('directory.invite.no_users')}</div>
                ) : (
                  workspaceUsers.map(u => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedExistingUserId(u.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedExistingUserId === u.id ? 'bg-primary/10 border-primary/50' : 'bg-muted border-border hover:border-border'}`}
                    >
                      <div>
                        <div className="text-foreground text-sm font-medium">{u.full_name || t('directory.invite.anonymous')}</div>
                        <div className="text-muted-foreground text-xs">{u.email}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedExistingUserId === u.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                        {selectedExistingUserId === u.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground mb-1">{t('directory.invite.new_desc')}</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">{t('directory.invite.email_label')}</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder={t('directory.invite.email_placeholder')} />
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border bg-background flex justify-end gap-3">
          <Button variant="ghost" onClick={() => { onClose(); setSelectedExistingUserId(''); }} className="text-muted-foreground hover:text-foreground text-xs h-9">{t('directory.hub.cancel')}</Button>
          {inviteTab === 'existing' ? (
            <Button
              onClick={handleInviteExisting}
              disabled={!selectedExistingUserId}
              className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white text-xs h-9"
            >
              {t('directory.invite.title')}
            </Button>
          ) : (
            <Button
              onClick={handleInviteNew}
              disabled={isLoading || !inviteEmail}
              className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white text-xs h-9"
            >
              {isLoading ? t('directory.invite.sending') : t('directory.invite.send_button')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
