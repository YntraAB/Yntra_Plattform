import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface DevHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevHubModal: React.FC<DevHubModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [hubWsName, setHubWsName] = useState('');
  const [hubAdminEmail, setHubAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.functions.invoke('invite_user', {
      body: { newWorkspaceName: hubWsName, email: hubAdminEmail, role: 'admin' }
    });
    setIsLoading(false);
    if (error) alert(t('directory.members.delete_error') + " " + error.message);
    else if (data && data.success === false) alert(t('directory.members.delete_error') + " " + data.error);
    else {
      alert(t('directory.hub.success'));
      onClose();
      setHubWsName('');
      setHubAdminEmail('');
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-sidebar border border-border rounded-xl w-[400px] p-6 shadow-2xl">
        <h3 className="text-foreground text-lg font-medium mb-4">{t('directory.hub.title')}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('directory.hub.ws_name_label')}</label>
            <input value={hubWsName} onChange={(e) => setHubWsName(e.target.value)} className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder={t('directory.hub.ws_name_placeholder')} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('directory.hub.admin_email_label')}</label>
            <input type="email" value={hubAdminEmail} onChange={(e) => setHubAdminEmail(e.target.value)} className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder={t('directory.hub.admin_email_placeholder')} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">{t('directory.hub.cancel')}</Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading || !hubWsName || !hubAdminEmail}
            className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white"
          >
            {isLoading ? t('directory.hub.creating') : t('directory.hub.create_invite')}
          </Button>
        </div>
      </div>
    </div>
  );
};
