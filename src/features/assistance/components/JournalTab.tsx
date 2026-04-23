import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export const JournalTab: React.FC<{clientId: string}> = ({ clientId }) => {
   const [notes, setNotes] = useState<any[]>([]);
   const [newNote, setNewNote] = useState('');
   const [isLoading, setIsLoading] = useState(true);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const { user } = useAuth();
   
   useEffect(() => {
     fetchNotes();
   }, [clientId]);

   const fetchNotes = async () => {
      try {
        const { data, error } = await supabase
           .from('client_journals')
           .select('*, author:users(full_name)')
           .eq('client_id', clientId)
           .order('created_at', { ascending: false });
        if (data) setNotes(data);
      } catch (e) {
         console.error(e);
      } finally {
         setIsLoading(false);
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newNote.trim()) return;
      setIsSubmitting(true);
      try {
         await supabase.from('client_journals').insert({
            client_id: clientId,
            author_id: user?.id,
            type: 'daily',
            content: newNote
         });
         setNewNote('');
         fetchNotes();
      } finally {
         setIsSubmitting(false);
      }
   };
   
   return (
       <div className="space-y-6">
           <form onSubmit={handleSubmit} className="bg-sidebar border border-border rounded-xl p-4">
              <h3 className="font-medium text-sm mb-3">Skriv ny daganteckning</h3>
              <textarea 
                 value={newNote}
                 onChange={e => setNewNote(e.target.value)}
                 className="w-full bg-background border border-border rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-primary mb-3"
                 placeholder="Beskriv hur dagen varit..."
              />
              <div className="flex justify-end">
                 <Button type="submit" disabled={isSubmitting || !newNote.trim()} className="bg-primary hover:bg-primary/90 text-white">
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Spara anteckning
                 </Button>
              </div>
           </form>

           <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b border-border pb-2">Tidigare anteckningar</h3>
              {isLoading ? (
                 <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : notes.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground bg-sidebar rounded-xl border border-border border-dashed">Inga anteckningar hittades</div>
              ) : (
                 notes.map(note => (
                    <div key={note.id} className="bg-sidebar border border-border rounded-xl p-4">
                       <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm text-primary">{note.author?.full_name || 'Okänd'}</span>
                          <span className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleString()}</span>
                       </div>
                       <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                    </div>
                 ))
              )}
           </div>
       </div>
   );
};
