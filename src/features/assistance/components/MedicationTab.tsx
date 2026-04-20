import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MedicationTab: React.FC<{clientId: string}> = ({ clientId }) => {
   const [meds, setMeds] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
     fetchMeds();
   }, [clientId]);

   const fetchMeds = async () => {
      try {
        const { data, error } = await supabase
           .from('client_medications')
           .select('*')
           .eq('client_id', clientId)
           .eq('is_active', true)
           .order('created_at', { ascending: false });
        if (data) setMeds(data);
      } catch (e) {
         console.error(e);
      } finally {
         setIsLoading(false);
      }
   };
   
   return (
       <div className="space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Aktiv Medicinlista</h3>
              <Button size="sm" variant="outline" className="border-border">
                 <Plus className="w-4 h-4 mr-2" /> Lägg till recept
              </Button>
           </div>

           {isLoading ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
           ) : meds.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-sidebar rounded-xl border border-border border-dashed">
                 <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                 Brukaren har ingen aktiv medicin inlagd.
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {meds.map(med => (
                    <div key={med.id} className="bg-sidebar border border-border shadow-sm rounded-xl p-5 flex items-start gap-4">
                       <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center shrink-0">
                          <Pill className="w-6 h-6" />
                       </div>
                       <div>
                          <h4 className="font-bold text-foreground text-lg">{med.name}</h4>
                          <div className="text-sm text-muted-foreground mt-1">Dos: <span className="font-medium text-foreground">{med.dosage}</span></div>
                          <div className="text-sm text-muted-foreground">Tid: <span className="font-medium text-foreground">{med.time_to_take}</span></div>
                       </div>
                    </div>
                 ))}
              </div>
           )}
       </div>
   );
};
