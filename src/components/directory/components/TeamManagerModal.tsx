import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface TeamManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | null;
  selectedWorkspace: string | null;
}

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  selectedWorkspace
}) => {
  const { t } = useTranslation();
  const [newTeamName, setNewTeamName] = useState('');

  if (!isOpen) return null;

  const handleCreateTeam = async () => {
    const targetWS = selectedWorkspace || workspaceId;
    const { error } = await supabase.from('teams').insert([{ workspace_id: targetWS, name: newTeamName }]);
    if (error) alert(t('directory.members.delete_error') + " " + error.message);
    else {
      alert(t('directory.create_team.success'));
      onClose();
      setNewTeamName('');
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-sidebar border border-border rounded-xl w-[400px] p-6 shadow-2xl">
        <h3 className="text-foreground text-lg font-medium mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> {t('directory.create_team.submit')}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('directory.create_team.name_label')}</label>
            <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder={t('directory.create_team.name_placeholder')} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">{t('directory.hub.cancel')}</Button>
          <Button
            onClick={handleCreateTeam}
            disabled={!newTeamName}
            className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white"
          >
            {t('directory.create_team.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
};
