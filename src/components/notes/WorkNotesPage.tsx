import React, { useState } from 'react';
import {
  FileText,
  Search,
  ChevronRight,
  ChevronLeft,
  Users,
  History,
  Trash2,
  Check,
  PenSquare,
  Building2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface Note {
  id: string;
  teamId: string;
  date: string;
  timestamp: string;
  author: string;
  authorId: string;
  subject: string;
  content: string;
  editHistory: { editedBy: string; editedAt: string }[];
}

import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadNotes } from '@/hooks/useUnreadNotes';

export const WorkNotesPage: React.FC<{ setBreadcrumbNode?: (node: React.ReactNode) => void }> = ({ setBreadcrumbNode }) => {
  const { workspaceId, setAdminWorkspace } = useWorkspace();
  const { user } = useAuth();
  const unreadNotes = useUnreadNotes();
  const userRole = (user as any)?.role as 'platform_admin' | 'admin' | 'assistant' || 'admin';

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [dbTeams, setDbTeams] = useState<any[]>([]);
  const [dbWorkspaces, setDbWorkspaces] = useState<any[]>([]);

  const [exploreLevel, setExploreLevel] = useState<'workspaces' | 'teams'>('workspaces');

  // Ladda bolag för platform_admin
  React.useEffect(() => {
    if (userRole === 'platform_admin') {
      supabase.from('workspaces').select('*').then(({ data }) => {
        if (data) setDbWorkspaces(data);
      });
    }
  }, [userRole]);

  React.useEffect(() => {
    if (user && userRole !== 'platform_admin' && exploreLevel === 'workspaces') {
      setExploreLevel('teams');
    }
    if (user && userRole === 'platform_admin' && exploreLevel === 'teams' && !workspaceId && !selectedTeam) {
      setExploreLevel('workspaces');
    }
  }, [user, userRole, exploreLevel, workspaceId, selectedTeam]);

  // Fetch teams map
  React.useEffect(() => {
    async function loadTeams() {
      if (!workspaceId) return;

      const { data: teamData } = await supabase.from('teams').select('*').eq('workspace_id', workspaceId);

      const teamIds = teamData?.map(t => t.id) || [];
      let allNotes: any[] = [];
      if (teamIds.length > 0) {
        // Hämta enbart team_id för att räkna antalet loggböcker blixtsnabbt
        const { data: notes } = await supabase.from('work_notes').select('team_id').in('team_id', teamIds);
        allNotes = notes || [];
      }

      if (teamData) {
        setDbTeams(teamData.map(t => {
          const notesCount = allNotes.filter(n => n.team_id === t.id).length;

          return {
            ...t,
            notesCount: notesCount
          }
        }));
      }
    }
    loadTeams();
  }, [workspaceId]);

  // Fetch real notes
  React.useEffect(() => {
    async function fetchNotes() {
      if (!selectedTeam) return;
      const { data } = await supabase
        .from('work_notes')
        .select(`*, author:users(full_name, email)`)
        .eq('team_id', selectedTeam.id)
        .order('created_at', { ascending: false });

      if (data) {
        const mappedNotes: Note[] = data.map(dbNote => {
          const dateObj = new Date(dbNote.created_at);

          let authorName = 'Okänd Agent';
          if (dbNote.author) {
            const authorData = Array.isArray(dbNote.author) ? dbNote.author[0] : dbNote.author;
            if (authorData) {
              authorName = authorData.full_name || authorData.email || 'Okänd Agent';
            }
          }

          return {
            id: dbNote.id,
            teamId: dbNote.team_id,
            date: dateObj.toLocaleDateString(),
            timestamp: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: authorName,
            authorId: dbNote.author_id,
            subject: dbNote.subject,
            content: dbNote.content,
            editHistory: dbNote.edit_history || []
          };
        });
        setNotes(mappedNotes);
      }
    }
    fetchNotes();
  }, [selectedTeam]);

  // Authorization
  const currentUser = user?.id;

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [composeText, setComposeText] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [expandedAudit, setExpandedAudit] = useState(false);

  // Active note lookup
  const activeNote = notes.find(n => n.id === activeNoteId);

  // --- ACTIONS ---
  const handleSaveNote = async () => {
    if (!selectedTeam || !composeSubject || !composeText || !workspaceId || !user) return;

    if (editingNoteId) {
      // Find old one
      const oldNote = notes.find(n => n.id === editingNoteId);
      if (!oldNote) return;

      const now = new Date();
      const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const newHistory = [{ editedBy: (user as any)?.email || 'Unknown', editedAt: timeStr }, ...oldNote.editHistory];

      await supabase.from('work_notes').update({
        subject: composeSubject,
        content: composeText,
        edit_history: newHistory
      }).eq('id', editingNoteId);

      // Optimistic update
      setNotes(notes.map(n => {
        if (n.id === editingNoteId) {
          return { ...n, subject: composeSubject, content: composeText, editHistory: newHistory };
        }
        return n;
      }));
    } else {
      // Create new
      const { data } = await supabase.from('work_notes').insert({
        workspace_id: workspaceId,
        team_id: selectedTeam.id,
        author_id: user.id,
        subject: composeSubject,
        content: composeText,
        edit_history: []
      }).select().single();

      if (data) {
        // Fetch new state to rebuild UI
        const dateObj = new Date(data.created_at);
        const newNote: Note = {
          id: data.id,
          teamId: data.team_id,
          authorId: data.author_id,
          date: dateObj.toLocaleDateString(),
          timestamp: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: (user as any)?.email || 'Me',
          subject: data.subject,
          content: data.content,
          editHistory: []
        };
        setNotes([newNote, ...notes]);
      }
    }

    setIsComposing(false);
    setEditingNoteId(null);
  };

  const handleDeleteNote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Är du säker på att du vill radera denna anteckning?')) {
      await supabase.from('work_notes').delete().eq('id', id);
      setNotes(notes.filter(n => n.id !== id));
      if (activeNoteId === id) setActiveNoteId(null);
    }
  };

  const handleEditNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const note = notes.find(n => n.id === id);
    if (!note) return;

    setComposeSubject(note.subject);
    setComposeText(note.content);
    setEditingNoteId(note.id);
    setIsComposing(true);
  };

  // Breadcrumb updates
  React.useEffect(() => {
    if (!setBreadcrumbNode) return;

    const baseBreadcrumb = (
      <>
        {userRole === 'platform_admin' && (
          <>
            <span
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              onClick={() => {
                setExploreLevel('workspaces');
                setSelectedTeam(null);
                setActiveNoteId(null);
                setIsComposing(false);
              }}
            >
              Organisationer
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-1" />
          </>
        )}
        <span
          className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          onClick={() => {
            setSelectedTeam(null);
            setActiveNoteId(null);
            setIsComposing(false);
            if (userRole === 'platform_admin' && !workspaceId) {
              setExploreLevel('workspaces');
            } else {
              setExploreLevel('teams');
            }
          }}
        >
          Anteckningar
        </span>
      </>
    );

    if (isComposing && selectedTeam) {
      setBreadcrumbNode(
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
          {baseBreadcrumb}
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span
            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            onClick={() => setIsComposing(false)}
          >
            {selectedTeam.name}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium">Ny Anteckning</span>
        </div>
      );
    } else if (activeNote && selectedTeam) {
      setBreadcrumbNode(
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
          {baseBreadcrumb}
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span
            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            onClick={() => setActiveNoteId(null)}
          >
            {selectedTeam.name}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{activeNote.subject}</span>
        </div>
      );
    } else if (selectedTeam) {
      setBreadcrumbNode(
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
          {baseBreadcrumb}
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium">{selectedTeam.name}</span>
        </div>
      );
    } else {
      setBreadcrumbNode(
        <span className="text-foreground font-medium animate-in fade-in duration-200">Anteckningar</span>
      );
    }
  }, [selectedTeam, activeNote, isComposing, setBreadcrumbNode]);


  // ==========================================
  // PANE 0: WORKSPACE OVERVIEW (Admin Only)
  // ==========================================
  const renderWorkspaceOverview = () => {
    let wss = dbWorkspaces;
    if (searchQuery) wss = wss.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <div className="h-16 px-8 flex items-center justify-between border-b border-border shrink-0">
          <h2 className="text-foreground font-medium text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Välj Organisation
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Sök efter organisation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted border-none text-foreground h-8 rounded-full text-xs focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
          {wss.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <Building2 className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Inga organisationer hittades</p>
            </div>
          ) : (
            wss.map((ws) => (
              <div
                key={ws.id}
                onClick={() => {
                  if (setAdminWorkspace) setAdminWorkspace(ws.id);
                  setExploreLevel('teams');
                  setSearchQuery('');
                }}
                className="group flex items-center px-8 py-3 border-b border-border hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center text-primary mr-4 shrink-0 transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>

                <div className="w-64 md:w-80 shrink-0 pr-4 text-foreground font-medium text-[15px]">
                  {ws.name}
                  <div className="text-[11px] text-muted-foreground font-normal uppercase tracking-wider mt-0.5">{ws.type || 'Assistance'}</div>
                </div>

                <div className="flex-1 min-w-0 pr-4"></div>

                <div className="w-12 shrink-0 flex items-center justify-end text-muted-foreground gap-2 group-hover:text-foreground transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // PANE 1: TEAM OVERVIEW
  // ==========================================
  const renderTeamOverview = () => {
    let teams = dbTeams;

    teams = teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <div className="h-16 px-8 flex items-center justify-between border-b border-border shrink-0">
          <h2 className="text-foreground font-medium">Välj Anteckningsbok</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Sök efter team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted border-none text-foreground h-8 rounded-full text-xs focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
          {teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <Users className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Inga team hittades</p>
            </div>
          ) : (
            teams.map((team) => {
              const unreadInTeam = unreadNotes?.byTeam[team.id] || 0;
              return (
                <div
                  key={team.id}
                  onClick={async () => {
                    setSelectedTeam(team);
                    setSearchQuery('');
                    // Markera teamets anteckningar som lästa i databasen om man har olästa
                    if (unreadInTeam > 0 && user) {
                      await supabase.from('team_members').update({ notes_last_read_at: new Date().toISOString() }).eq('team_id', team.id).eq('user_id', user.id);
                    }
                  }}
                  className="group flex items-center px-8 py-3 border-b border-border hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-[8px] bg-secondary flex items-center justify-center text-primary mr-4 shrink-0 transition-colors">
                    <FileText className="w-5 h-5 relative" />
                    {unreadInTeam > 0 && (
                      <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-sidebar shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    )}
                  </div>

                  <div className="w-64 md:w-80 shrink-0 pr-4 text-foreground font-medium text-[15px]">
                    {team.name}
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="text-[11px] text-muted-foreground font-normal uppercase tracking-wider">{team.notesCount || 0} anteckningar skapade</div>
                      {unreadInTeam > 0 && (
                        <span className="text-red-500 font-bold bg-red-500/10 px-1.5 py-0 rounded text-[9px] uppercase tracking-wider">{unreadInTeam} Nya</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-4 flex items-center justify-end">
                    {team.recentNote && (
                      <div className="text-right mr-4">
                        <div className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">Senast uppdaterad</div>
                        <div className="text-[13px] text-muted-foreground mt-0.5">{team.recentNote}</div>
                      </div>
                    )}
                  </div>

                  <div className="w-12 shrink-0 flex items-center justify-end text-muted-foreground gap-2 group-hover:text-foreground transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };


  // ==========================================
  // PANE 2: NOTE LIST (EDGE-TO-EDGE)
  // ==========================================
  const renderNoteList = () => {
    if (!selectedTeam) return null;
    let teamNotes = notes.filter(n => n.teamId === selectedTeam.id);
    if (noteSearchQuery) {
      teamNotes = teamNotes.filter(n =>
        n.subject.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(noteSearchQuery.toLowerCase())
      );
    }

    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        {/* Header Options */}
        <div className="h-16 px-8 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedTeam(null)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-foreground font-medium">{selectedTeam.name} Anteckningar</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Sök i anteckningar..."
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
                className="pl-9 bg-muted border-none text-foreground h-8 rounded-full text-xs focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
          {teamNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Finns inga anteckningar än</p>
            </div>
          ) : (
            <div className="flex flex-col w-full text-sm">
              {teamNotes.map((note) => {
                const canEdit = note.authorId === currentUser;
                const canDelete = canEdit || userRole === 'admin' || userRole === 'platform_admin';

                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className="group flex items-center px-8 py-4 border-b border-border hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className={`w-40 shrink-0 truncate pr-4 text-foreground font-medium`}>
                      {note.author}
                    </div>

                    <div className="flex-1 flex items-center truncate min-w-0 pr-4">
                      <span className="text-foreground mr-2 font-medium">
                        {note.subject}
                      </span>
                      <span className="text-muted-foreground truncate">
                        - {note.content}
                      </span>
                    </div>

                    <div className="w-48 shrink-0 flex items-center justify-end">
                      <div className="hidden group-hover:flex items-center gap-3 mr-4 text-muted-foreground">
                        {canEdit && <PenSquare className="w-[18px] h-[18px] hover:text-foreground transition-colors" onClick={(e) => handleEditNote(e, note.id)} />}
                        {canDelete && <Trash2 className="w-[18px] h-[18px] hover:text-rose-400 transition-colors" onClick={(e) => handleDeleteNote(e, note.id)} />}
                      </div>
                      <span className="text-muted-foreground text-sm tracking-wide group-hover:text-foreground transition-colors">
                        {note.date === 'Idag' ? note.timestamp : note.date}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* FAB Compose Button */}
        <div className="absolute bottom-8 right-8">
          <Button
            onClick={() => {
              setEditingNoteId(null);
              setComposeSubject('');
              setComposeText('');
              setIsComposing(true);
            }}
            className="rounded-full pl-5 pr-6 h-12 bg-white text-black hover:bg-neutral-200 shadow-xl shadow-black/50 font-medium flex items-center gap-2 transition-transform hover:scale-105"
          >
            <PlusIcon /> Ny Anteckning
          </Button>
        </div>
      </div>
    );
  };


  // ==========================================
  // PANE 3: READ VIEW (WITH AUDIT)
  // ==========================================
  const renderReadPane = () => {
    if (!activeNote) return null;
    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <div className="h-16 px-8 flex items-center justify-between border-b border-border bg-sidebar shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveNoteId(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-foreground font-medium">Läs Anteckning</h2>
          </div>

          <div className="flex items-center gap-2">
            {activeNote.authorId === currentUser && (
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={(e) => handleEditNote(e, activeNote.id)}>
                <PenSquare className="w-4 h-4" />
              </Button>
            )}
            {(activeNote.authorId === currentUser || userRole === 'admin' || userRole === 'platform_admin') && (
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-400" onClick={(e) => handleDeleteNote(e, activeNote.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 md:px-24 lg:px-48 py-10 scrollbar-dark">
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-border bg-secondary flex items-center justify-center text-foreground font-semibold">
                {activeNote.author.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground mb-1">
                  Skrivet av {activeNote.author}
                </div>
                <div className="text-xs text-muted-foreground">
                  Publicerat {activeNote.date} kl {activeNote.timestamp}
                </div>
              </div>
            </div>

            {/* Audit knapp */}
            <div className="flex items-center">
              <button
                onClick={() => setExpandedAudit(!expandedAudit)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-xs font-semibold uppercase tracking-wider ${activeNote.editHistory.length > 0 ? 'text-amber-500 hover:bg-amber-500/10' : 'text-muted-foreground hover:text-muted-foreground bg-muted'}`}
              >
                <History className="w-3.5 h-3.5" />
                Historik
              </button>
            </div>
          </div>

          {/* Audit Log (Expanderbar) */}
          {expandedAudit && activeNote.editHistory.length > 0 && (
            <div className="mb-10 bg-background border border-border rounded-md p-4 animate-in fade-in slide-in-from-top-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                <History className="w-4 h-4" /> Redigeringslogg
              </div>
              {activeNote.editHistory.map((h, i) => (
                <div key={i} className="text-sm text-muted-foreground py-1.5 flex items-center justify-between border-b border-border last:border-0">
                  <span className="flex items-center gap-2">
                    <PenSquare className="w-3 h-3 text-muted-foreground" />
                    Redigerad av <b>{h.editedBy}</b>
                  </span>
                  <span className="text-[11px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">
                    {activeNote.date} kl {h.editedAt}
                  </span>
                </div>
              ))}
            </div>
          )}

          <h3 className="text-xl font-medium text-foreground mb-6 leading-tight">
            {activeNote.subject}
          </h3>

          <div className="text-[15px] text-muted-foreground leading-loose whitespace-pre-wrap">
            {activeNote.content}
          </div>
        </div>
      </div>
    );
  };


  // ==========================================
  // PANE 4: COMPOSE PANE (CLEAN FULLSCREEN)
  // ==========================================
  const renderComposePane = () => {
    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <div className="h-16 px-8 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsComposing(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-foreground font-medium">Skriv för {selectedTeam?.name}</h2>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setIsComposing(false)}>
              Avbryt
            </Button>
            <Button
              className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white pl-4 pr-5 rounded-full"
              disabled={composeText.trim().length === 0}
              onClick={handleSaveNote}
            >
              <Check className="w-4 h-4 mr-2" />
              Spara Anteckning
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 md:px-24 lg:px-48 py-10 scrollbar-dark flex flex-col gap-8">

          {/* Subject Field */}
          <div className="flex flex-col border-b border-border pb-2 transition-colors">
            <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Rubrik</label>
            <input
              placeholder="Ex. Eftermiddagspasset eller Incident"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              className="px-0 bg-transparent border-none text-foreground text-lg font-medium focus:outline-none focus:ring-0 h-10 w-full placeholder:text-[15px] placeholder:font-medium placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 pb-10 flex flex-col">
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              className="w-full bg-transparent border-none text-foreground text-[15px] leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/50 flex-1 min-h-[300px]"
              placeholder="Vad hände under passet? Skriv dina detaljerade anteckningar här..."
            />
          </div>
        </div>
      </div>
    );
  };

  // --- MASTER RENDERER ---
  return (
    <div className="flex-1 flex flex-col h-full bg-background w-full">
      {isComposing
        ? renderComposePane()
        : activeNoteId
          ? renderReadPane()
          : selectedTeam
            ? renderNoteList()
            : (exploreLevel === 'workspaces' && userRole === 'platform_admin')
              ? renderWorkspaceOverview()
              : renderTeamOverview()
      }
    </div>
  );
};

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
