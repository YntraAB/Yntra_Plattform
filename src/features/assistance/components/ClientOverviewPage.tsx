import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { Loader2, User, FileText, Pill } from 'lucide-react';
import { JournalTab } from './JournalTab';
import { MedicationTab } from './MedicationTab';

export const ClientOverviewPage: React.FC = () => {
  const { activeTeam } = useWorkspace();
  const { t } = useTranslation();
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'journal' | 'medication'>('journal');

  useEffect(() => {
    const fetchClient = async () => {
      if (!activeTeam) {
        setClient(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
         const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('team_id', activeTeam)
            .single();
         
         if (data) setClient(data);
         else setClient(null);
      } catch (e) {
         console.error(e);
      } finally {
         setIsLoading(false);
      }
    };
    fetchClient();
  }, [activeTeam]);

  if (isLoading) {
     return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!client) {
     return (
       <div className="p-8 max-w-4xl mx-auto h-full flex flex-col items-center justify-center text-center">
          <User className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold mb-2">Ingen Brukare Kopplad</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
             Detta team (arbetslag) har ingen brukare associerad till sig. En chef kan lägga till och koppla en brukare till teamet via katalogen (Directory).
          </p>
       </div>
     );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full h-full p-8 max-w-5xl mx-auto">
       <div className="bg-sidebar border border-border shadow-sm rounded-xl mb-6 p-6 flex items-start gap-6">
          <div className="w-20 h-20 rounded-[14px] bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center font-bold text-3xl shadow-inner">
             {client.first_name.charAt(0)}{client.last_name.charAt(0)}
          </div>
          <div>
             <h1 className="text-2xl font-bold">{client.first_name} {client.last_name}</h1>
             <p className="text-muted-foreground mt-1 text-sm font-medium">Personnummer: {client.personal_number || 'Okänt'}</p>
             <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 bg-secondary border border-border rounded-full text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Omvårdnadsnivå: {client.care_level}</span>
             </div>
          </div>
       </div>
       
       <div className="flex gap-2 border-b border-border mb-6">
          <button 
             onClick={() => setActiveTab('journal')}
             className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'journal' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
             <div className="flex gap-2 items-center"><FileText className="w-4 h-4"/> Daganteckningar</div>
          </button>
          <button 
             onClick={() => setActiveTab('medication')}
             className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'medication' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
             <div className="flex gap-2 items-center"><Pill className="w-4 h-4"/> Aktiv Medicinlista</div>
          </button>
       </div>

       {activeTab === 'journal' ? (
          <JournalTab clientId={client.id} />
       ) : (
          <MedicationTab clientId={client.id} />
       )}
    </div>
  );
};
