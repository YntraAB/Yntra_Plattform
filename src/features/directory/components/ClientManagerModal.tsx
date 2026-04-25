import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspaceUsers } from '@/hooks/queries/useWorkspaceData';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ClientManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | null;
  teams: { id: string, name: string }[];
}

export const ClientManagerModal: React.FC<ClientManagerModalProps> = ({ isOpen, onClose, workspaceId, teams }) => {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [personalNumber, setPersonalNumber] = useState('');
  const [teamId, setTeamId] = useState('');
  const [messageSetting, setMessageSetting] = useState('contact_person');
  const [contactPersonEmail, setContactPersonEmail] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasContactPerson, setHasContactPerson] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: users = [] } = useWorkspaceUsers(workspaceId || null);

  const filteredUsers = React.useMemo(() => {
    if (!contactPersonEmail) return [];
    const lower = contactPersonEmail.toLowerCase();
    return users.filter(u => u.email.toLowerCase().includes(lower) || u.name.toLowerCase().includes(lower)).slice(0, 5);
  }, [contactPersonEmail, users]);

  const handleSelectUser = (email: string) => {
    setContactPersonEmail(email);
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    setIsSubmitting(true);
    try {
      const finalEmail = (messageSetting === 'contact_person' || (messageSetting === 'open' && hasContactPerson))
        ? contactPersonEmail
        : null;

      const { error } = await supabase.from('clients').insert({
        workspace_id: workspaceId,
        first_name: firstName,
        last_name: lastName,
        personal_number: personalNumber,
        team_id: teamId || null,
        message_settings: {
          allowed_contacts: messageSetting,
          contact_person_email: finalEmail
        }
      });

      if (error) throw error;

      toast.success(t('directory.client_manager.success'));
      onClose();
    } catch (err: any) {
      toast.error(err.message || t('directory.client_manager.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-sidebar border-border">
        <DialogHeader className="h-14 px-6 border-b border-border flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-foreground font-medium flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" /> {t('directory.client_manager.title')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('common.first_name')} *</label>
                <input required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('common.last_name')} *</label>
                <input required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('common.ssn')}</label>
              <input value={personalNumber} onChange={e => setPersonalNumber(e.target.value)} placeholder="ÅÅÅÅMMDD-XXXX" className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('directory.client_manager.team_label')}</label>
              <Select required value={teamId} onValueChange={setTeamId}>
                <SelectTrigger className="w-full bg-background border border-border rounded-lg h-9 text-sm focus:ring-1 focus:ring-primary outline-none shadow-none">
                  <SelectValue placeholder={t('directory.client_manager.team_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">{t('directory.client_manager.team_info')}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('directory.client_manager.comm_level_label')}</label>
              <Select
                value={messageSetting}
                onValueChange={(val) => {
                  setMessageSetting(val);
                  if (val === 'admin_only') {
                    setHasContactPerson(false);
                    setContactPersonEmail('');
                  }
                }}
              >
                <SelectTrigger className="w-full bg-background border border-border rounded-lg h-9 text-sm focus:ring-1 focus:ring-primary outline-none shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_only">{t('directory.client_manager.comm_admin_only')}</SelectItem>
                  <SelectItem value="contact_person">{t('directory.client_manager.comm_contact')}</SelectItem>
                  <SelectItem value="open">{t('directory.client_manager.comm_open')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">{t('directory.client_manager.comm_info')}</p>
            </div>

            {messageSetting === 'open' && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="hasContactPersonCheck"
                  checked={hasContactPerson}
                  onChange={(e) => setHasContactPerson(e.target.checked)}
                  className="rounded border-border w-4 h-4 cursor-pointer"
                />
                <label htmlFor="hasContactPersonCheck" className="text-[13px] text-muted-foreground cursor-pointer">
                  {t('directory.client_manager.contact_person_label')}
                </label>
              </div>
            )}

            {(messageSetting === 'contact_person' || (messageSetting === 'open' && hasContactPerson)) && (
              <div className="relative mt-2 animate-in fade-in slide-in-from-top-1">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('directory.client_manager.contact_email_label')}</label>
                <input
                  value={contactPersonEmail}
                  onChange={e => { setContactPersonEmail(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={t('directory.client_manager.contact_email_placeholder')}
                  className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                />
                {showSuggestions && filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-10 max-h-40 overflow-y-auto">
                    {filteredUsers.map(u => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u.email)}
                        className="px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer flex flex-col"
                      >
                        <span className="font-medium">{u.name}</span>
                        <span className="text-muted-foreground text-xs">{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">{t('directory.client_manager.contact_info')}</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="h-9 hover:bg-secondary">{t('common.cancel')}</Button>
            <Button type="submit" disabled={isSubmitting} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t('directory.client_manager.save_button')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
