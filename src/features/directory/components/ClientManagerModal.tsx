import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspaceUsers } from '@/hooks/queries/useWorkspaceData';

interface ClientManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | null;
  teams: { id: string, name: string }[];
}

export const ClientManagerModal: React.FC<ClientManagerModalProps> = ({ isOpen, onClose, workspaceId, teams }) => {
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
      
      toast.success('Brukare tillagd!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte lägga till brukare');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-sidebar border border-border shadow-2xl rounded-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4">
        <div className="h-14 px-6 border-b border-border flex items-center justify-between">
          <h2 className="text-foreground font-medium flex items-center gap-2">
             <UserPlus className="w-5 h-5 text-primary" /> Lägg till Brukare
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Förnamn *</label>
                  <input required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
               </div>
               <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Efternamn *</label>
                  <input required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
               </div>
            </div>
            <div>
               <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Personnummer</label>
               <input value={personalNumber} onChange={e => setPersonalNumber(e.target.value)} placeholder="ÅÅÅÅMMDD-XXXX" className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
            </div>
            <div>
               <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Koppla till Team/Arbetslag *</label>
               <select required value={teamId} onChange={e => setTeamId(e.target.value)} className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm focus:ring-1 focus:ring-primary outline-none">
                  <option value="">-- Välj Team --</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
               </select>
               <p className="text-[11px] text-muted-foreground mt-1">Obligatoriskt. Knyter brukaren till rätt arbetsgrupp.</p>
            </div>
            <div>
               <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Kommunikationsnivå</label>
               <select value={messageSetting} onChange={e => {
                  setMessageSetting(e.target.value);
                  if (e.target.value === 'admin_only') {
                     setHasContactPerson(false);
                     setContactPersonEmail('');
                  }
               }} className="w-full bg-background border border-border rounded-lg h-9 px-3 text-sm focus:ring-1 focus:ring-primary outline-none">
                  <option value="admin_only">Endast Administrativ Kontakt</option>
                  <option value="contact_person">Via Kontaktperson (+ Admins)</option>
                  <option value="open">Öppen Kommunikation (Teamet + Brukaren)</option>
               </select>
               <p className="text-[11px] text-muted-foreground mt-1">Styr vilka som kan skicka meddelanden till/från brukaren.</p>
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
                  Lägg även till en specifik kontaktperson (Frivilligt)
                </label>
              </div>
            )}

            {(messageSetting === 'contact_person' || (messageSetting === 'open' && hasContactPerson)) && (
              <div className="relative mt-2 animate-in fade-in slide-in-from-top-1">
                 <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Kontaktpersons E-post</label>
                 <input 
                    value={contactPersonEmail} 
                    onChange={e => { setContactPersonEmail(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="t.ex. anna@exempel.se" 
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
                 <p className="text-[11px] text-muted-foreground mt-1">Sök på namn eller skriv in e-post. Om användaren finns i Yntra kan brukaren kontakta denne direkt.</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="h-9 hover:bg-secondary">Avbryt</Button>
            <Button type="submit" disabled={isSubmitting} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Spara Brukare
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
