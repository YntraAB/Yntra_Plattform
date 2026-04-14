import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface UnreadNotesMap {
  total: number;
  byTeam: Record<string, number>;
}

export function useUnreadNotes() {
  const { user } = useAuth();
  const [unread, setUnread] = useState<UnreadNotesMap>({ total: 0, byTeam: {} });
  
  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    
    const fetchUnread = async () => {
       // 1. Hämta info om när användaren senast läste anteckningar per team
       const { data: teamMembersData } = await supabase
         .from('team_members')
         .select('team_id, notes_last_read_at')
         .eq('user_id', user.id);
         
       if (!teamMembersData || teamMembersData.length === 0) return;
       
       const teamIds = teamMembersData.map(tm => tm.team_id);
       
       // 2. Hämta id, team_id, skapandedatum för alla loggböcker skapade av ANDRA i teamet
       const { data: notes } = await supabase
         .from('work_notes')
         .select('id, team_id, created_at, author_id')
         .in('team_id', teamIds)
         .neq('author_id', user.id);
         
       if (!notes) return;
       
       let total = 0;
       const byTeam: Record<string, number> = {};
       
       // 3. Kryss-validera "Har denna anteckning blivit skapad *efter* andvändarens read_at-stämpel i teamet?"
       notes.forEach(note => {
          const tm = teamMembersData.find(t => t.team_id === note.team_id);
          const lastRead = tm?.notes_last_read_at ? new Date(tm.notes_last_read_at).getTime() : 0;
          const noteCreated = new Date(note.created_at).getTime();
          
          if (noteCreated > lastRead) {
             total++;
             byTeam[note.team_id] = (byTeam[note.team_id] || 0) + 1;
          }
       });
       
       if (isMounted) setUnread({ total, byTeam });
    };
    
    fetchUnread();
    
    // Blixtsnabb realtidslyssnare – uppdaterar sidomenyn och korten omedelbart 
    // när en ny anteckning dumpas ner ELLER när du klickar på ett team och stämpeln uppdateras.
    const channelSuffix = Math.random().toString(36).substring(7);
    const channel = supabase.channel(`unread_notes_${user.id}_${channelSuffix}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_notes' }, () => { fetchUnread(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `user_id=eq.${user.id}` }, () => { fetchUnread(); })
      .subscribe();
      
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    }
  }, [user]);

  return unread;
}
