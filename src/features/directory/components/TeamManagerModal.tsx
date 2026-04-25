import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-sidebar border-border">
        <DialogHeader className="h-14 px-6 border-b border-border flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-foreground font-medium flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> {t('directory.create_team.submit')}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('directory.create_team.name_label')} *</label>
              <input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                placeholder={t('directory.create_team.name_placeholder')}
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="h-9 hover:bg-secondary text-muted-foreground">{t('directory.hub.cancel')}</Button>
            <Button
              onClick={handleCreateTeam}
              disabled={!newTeamName}
              className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t('directory.create_team.submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
