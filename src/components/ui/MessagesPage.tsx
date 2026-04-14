import React, { useState } from 'react';
import {
  Inbox,
  Send,
  Archive,
  Trash2,
  Search,
  Reply,
  Forward,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';

interface MessagesPageProps {
  setBreadcrumbNode?: (node: React.ReactNode) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ setBreadcrumbNode }) => {
  const { workspaceId } = useWorkspace();
  const { user } = useAuth();

  const [filterType, setFilterType] = useState('inbox');
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState<{
    targetType: 'user' | 'team';
    targetId: string;
    subject: string;
    content: string;
    quote?: {
      type: 'reply' | 'forward';
      sender: string;
      date: string;
      timestamp: string;
      subject: string;
      content: string;
    } | null;
  }>({ targetType: 'user', targetId: '', subject: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMsgs, setSelectedMsgs] = useState<string[]>([]);
  const [dbMessages, setDbMessages] = useState<any[]>([]);
  const [dbTeams, setDbTeams] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);

  React.useEffect(() => {
    async function fetchData() {
      if (!workspaceId || !user) return;

      const { data: teams } = await supabase.from('teams').select('*').eq('workspace_id', workspaceId);
      if (teams) setDbTeams(teams);

      const { data: users } = await supabase.from('users').select('*').eq('workspace_id', workspaceId);
      if (users) setDbUsers(users);

      const { data } = await supabase.from('messages').select('*, sender:users!messages_sender_id_fkey(*), receiver:users!messages_receiver_id_fkey(*)').eq('workspace_id', workspaceId);
      if (data) {
        setDbMessages(data.map(m => {
          let toName = 'Du';
          if (m.target_team_id) {
            toName = teams?.find(t => t.id === m.target_team_id)?.name || 'Ett Team';
          } else if (m.receiver_id === user.id) {
            toName = 'Du';
          } else {
            const rcvrData = Array.isArray(m.receiver) ? m.receiver[0] : m.receiver;
            toName = rcvrData ? (rcvrData.full_name || rcvrData.email || 'Okänd Agent') : 'Okänd Agent';
          }

          const sndrData = Array.isArray(m.sender) ? m.sender[0] : m.sender;
          const senderName = sndrData ? (sndrData.full_name || sndrData.email || 'System') : 'System';

          return {
            id: m.id,
            sender_id: m.sender_id,
            receiver_id: m.receiver_id,
            target_team_id: m.target_team_id,
            folderId: m.sender_id === user.id ? 'sent' : 'inbox',
            sender: { name: (m.sender as any)?.full_name || 'System', avatar: '' },
            to: toName,
            isTeamMessage: !!m.target_team_id,
            subject: m.subject || 'Ingen rubrik',
            snippet: m.body ? m.body.substring(0, 40) + '...' : '',
            content: m.body,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(m.created_at).toLocaleDateString(),
            unread: !m.is_read
          };
        }));
      }
    }
    fetchData();

    const channel = supabase.channel('messages-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => { fetchData(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, user]);

  // Sök och filtrera
  const filteredMessages = dbMessages.filter(m => {
    const searchMatch = m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sender.name.toLowerCase().includes(searchQuery.toLowerCase());

    let match = false;
    if (filterType === 'inbox') match = m.folderId === 'inbox';
    if (filterType === 'unread') match = m.folderId === 'inbox' && m.unread === true;
    if (filterType === 'sent') match = m.folderId === 'sent';
    if (filterType === 'archive') match = m.folderId === 'archive';
    if (filterType === 'trash') match = m.folderId === 'trash';

    return searchMatch && match;
  });

  const activeMessage = dbMessages.find(m => m.id === activeMessageId);

  // Pagination logic
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / itemsPerPage));

  React.useEffect(() => {
    // Reset page if filtered results change
    setCurrentPage(1);
  }, [filterType, searchQuery]);

  const currentMessages = filteredMessages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getTitle = React.useCallback(() => {
    if (filterType === 'inbox') return 'Inkorg';
    if (filterType === 'unread') return 'Olästa';
    if (filterType === 'sent') return 'Skickat';
    if (filterType === 'archive') return 'Arkiv';
    if (filterType === 'trash') return 'Papperskorg';
    return 'Inkorg';
  }, [filterType]);

  React.useEffect(() => {
    if (setBreadcrumbNode) {
      const inboxBtn = (
        <button
          onClick={() => {
            setFilterType('inbox');
            setIsComposing(false);
            setActiveMessageId(null);
          }}
          className="hover:text-foreground transition-colors flex items-center"
        >
          Inkorg
        </button>
      );

      if (isComposing) {
        setBreadcrumbNode(
          <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
            {inboxBtn}
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-1" />
            <span className="text-foreground font-medium flex items-center">
              Nytt Meddelande
            </span>
          </div>
        );
      } else if (activeMessageId) {
        const titleText = getTitle();
        setBreadcrumbNode(
          <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
            {inboxBtn}
            {filterType !== 'inbox' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-1" />
                <button
                  onClick={() => setActiveMessageId(null)}
                  className="hover:text-foreground transition-colors flex items-center"
                >
                  {titleText}
                </button>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-1" />
            <span className="text-foreground font-medium flex items-center">{activeMessage?.sender.name}</span>
          </div>
        );
      } else {
        if (filterType === 'inbox') {
          setBreadcrumbNode(
            <span className="text-foreground font-medium flex items-center animate-in fade-in duration-200">Inkorg</span>
          );
        } else {
          setBreadcrumbNode(
            <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
              {inboxBtn}
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-1" />
              <span className="text-foreground font-medium flex items-center">{getTitle()}</span>
            </div>
          );
        }
      }
    }
  }, [filterType, isComposing, activeMessageId, composeData, setBreadcrumbNode, getTitle]);

  const handleCompose = () => {
    setActiveMessageId(null);
    setComposeData({ targetType: 'user', targetId: '', subject: '', content: '', quote: null });
    setIsComposing(true);
  };

  const handleSendMessage = async () => {
    if (!workspaceId || !user || !composeData.targetId || !composeData.content) return;

    // Set is_read to true if we send to ourselves, otherwise false. But logic normally false.
    const payload = {
      workspace_id: workspaceId,
      sender_id: user.id,
      subject: composeData.subject,
      body: composeData.content,
      is_read: false
    } as any;

    if (composeData.targetType === 'user') {
      payload.receiver_id = composeData.targetId;
    } else {
      payload.target_team_id = composeData.targetId;
    }

    const { error } = await supabase.from('messages').insert(payload);
    if (error) {
      alert("Fel vid sändning: " + error.message);
    } else {
      setIsComposing(false);
    }
  };

  const handleReply = () => {
    if (activeMessage) {
      setComposeData({
        targetType: activeMessage.isTeamMessage ? 'team' : 'user',
        targetId: activeMessage.sender_id,
        subject: activeMessage.subject.startsWith('Svar:') ? activeMessage.subject : `Svar: ${activeMessage.subject}`,
        content: '',
        quote: {
          type: 'reply',
          sender: activeMessage.sender.name,
          date: activeMessage.date,
          timestamp: activeMessage.timestamp,
          subject: activeMessage.subject,
          content: activeMessage.content
        }
      });
      setActiveMessageId(null);
      setIsComposing(true);
    }
  };

  const handleForward = () => {
    if (activeMessage) {
      setComposeData({
        targetType: 'user',
        targetId: '',
        subject: activeMessage.subject.startsWith('VB:') ? activeMessage.subject : `VB: ${activeMessage.subject}`,
        content: '',
        quote: {
          type: 'forward',
          sender: activeMessage.sender.name,
          date: activeMessage.date,
          timestamp: activeMessage.timestamp,
          subject: activeMessage.subject,
          content: activeMessage.content
        }
      });
      setActiveMessageId(null);
      setIsComposing(true);
    }
  };

  const handleSelectMessage = (id: string) => {
    setIsComposing(false);
    setActiveMessageId(id);
  };

  const toggleSelect = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (selectedMsgs.includes(id)) {
      setSelectedMsgs(selectedMsgs.filter(m => m !== id));
    } else {
      setSelectedMsgs([...selectedMsgs, id]);
    }
  };

  const isAllSelected = filteredMessages.length > 0 && selectedMsgs.length === filteredMessages.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedMsgs([]);
    } else {
      setSelectedMsgs(filteredMessages.map(m => m.id));
    }
  };

  const handleDeleteSelected = () => {
    // I en riktig backend skulle du kalla på ett API här
    console.log("Tar bort:", selectedMsgs);
    setSelectedMsgs([]);
  };

  /**
   * MAIN PANE: Inbox List
   */
  const renderList = () => {
    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        {/* Top Header Controls */}
        <div className="h-16 px-8 flex items-center justify-between border-b border-border">

          <div className="flex items-center gap-4">
            {/* Master Checkbox */}
            <div
              className="w-8 shrink-0 flex items-center justify-center cursor-pointer group"
              onClick={toggleSelectAll}
            >
              <div className={`w-4 h-4 rounded-[4px] border ${isAllSelected ? 'border-primary bg-primary' : 'border-border group-hover:border-border'} flex items-center justify-center transition-colors`}>
                {isAllSelected && <Check className="w-3 h-3 text-foreground" />}
              </div>
            </div>

            <h2 className="text-foreground font-semibold flex items-center ml-2 mr-2">
              {getTitle()}
            </h2>

            <MoreHorizontal className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />

            {selectedMsgs.length > 0 && (
              <div className="flex items-center gap-1 border-l border-border ml-2 pl-4 animate-in fade-in slide-in-from-left-2 duration-200">
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-rose-400" onClick={handleDeleteSelected}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full ml-1">
                  {selectedMsgs.length} markerade
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Sök meddelanden..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted border-none text-foreground h-8 rounded-full text-xs focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground relative group">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-accent border border-border text-foreground font-medium hover:bg-secondary cursor-pointer rounded-md pl-3 pr-6 py-1.5 appearance-none focus:outline-none focus:border-primary/50 transition-colors"
                style={{ WebkitAppearance: 'none' }}
              >
                <option value="inbox" className="bg-card text-foreground py-2">Inkorg (Alla)</option>
                <option value="unread" className="bg-card text-foreground py-2">Olästa Meddelanden</option>
                <option value="sent" className="bg-card text-foreground py-2">Skickat</option>
                <option value="archive" className="bg-card text-foreground py-2">Mina Sparade (Arkiv)</option>
                <option value="trash" className="bg-card text-rose-400 py-2">Borttagna</option>
              </select>
              <ChevronRight className="w-3.5 h-3.5 rotate-90 pointer-events-none absolute right-2 text-muted-foreground group-hover:text-foreground" />
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <ChevronLeft
                className={`w-4 h-4 transition-colors ${currentPage > 1 ? 'cursor-pointer hover:text-foreground' : 'opacity-30 cursor-not-allowed'}`}
                onClick={() => currentPage > 1 && setCurrentPage(prev => prev - 1)}
              />
              <span className="text-xs font-medium">{currentPage} / {totalPages}</span>
              <ChevronRight
                className={`w-4 h-4 transition-colors ${currentPage < totalPages ? 'cursor-pointer hover:text-foreground' : 'opacity-30 cursor-not-allowed'}`}
                onClick={() => currentPage < totalPages && setCurrentPage(prev => prev + 1)}
              />
            </div>
          </div>
        </div>

        {/* Message Table */}
        <div className="flex-1 overflow-y-auto w-full scrollbar-dark">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Inbox className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Tomt här inne</p>
            </div>
          ) : (
            <div className="flex flex-col w-full text-sm">
              {currentMessages.map((msg) => {
                const isSelected = selectedMsgs.includes(msg.id);
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg.id)}
                    className={`group flex items-center px-6 py-3 border-b border-border hover:bg-muted cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : ''}`}
                  >

                    {/* Checkbox */}
                    <div
                      className="w-10 shrink-0 flex items-center justify-start p-1"
                      onClick={(e) => toggleSelect(msg.id, e)}
                    >
                      <div className={`w-[18px] h-[18px] rounded-[4px] border ${isSelected ? 'border-primary bg-primary' : 'border-border group-hover:border-border'} flex items-center justify-center transition-colors`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-foreground" />}
                      </div>
                    </div>

                    {/* Sender & Context */}
                    <div className={`w-56 shrink-0 truncate pr-4 ${msg.unread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                      {msg.sender.name}
                      {msg.isTeamMessage && msg.folderId !== 'sent' && (
                        <div className="text-[10px] uppercase font-bold text-primary mt-0.5 tracking-wider truncate">Kollektivt till {msg.to}</div>
                      )}
                    </div>

                    {/* Subject & Snippet */}
                    <div className="flex-1 flex items-center truncate min-w-0 pr-4">
                      {msg.folderId === 'sent' && <span className="text-muted-foreground mr-2 text-xs uppercase font-bold tracking-wider">Till {msg.to}:</span>}
                      <span className={`${msg.unread ? 'text-foreground font-semibold' : 'text-foreground'} mr-2`}>
                        {msg.subject}
                      </span>
                      <span className="text-muted-foreground truncate">
                        - {msg.snippet}
                      </span>
                    </div>

                    {/* Quick Actions (Hover) & Date */}
                    <div className="w-48 shrink-0 flex items-center justify-end">

                      <div className="hidden group-hover:flex items-center gap-4 mr-6 text-muted-foreground">
                        <Archive className="w-[18px] h-[18px] hover:text-foreground transition-colors" />
                        <Trash2 className="w-[18px] h-[18px] hover:text-rose-400 transition-colors" />
                        <Clock className="w-[18px] h-[18px] hover:text-foreground transition-colors" />
                      </div>

                      <span className={`text-sm tracking-wide ${msg.unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {msg.date === 'Idag' ? msg.timestamp : msg.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <div className="absolute bottom-8 right-8">
          <Button
            onClick={handleCompose}
            className="rounded-full pl-4 pr-5 h-12 bg-white text-black hover:bg-neutral-200 shadow-xl shadow-black/50 font-medium flex items-center gap-2 transition-transform hover:scale-105"
          >
            <PlusIcon /> Nytt meddelande
          </Button>
        </div>
      </div>
    );
  };

  /**
   * READING PANE
   */
  const renderReadPane = () => {
    if (!activeMessage) return null;
    return (
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <div className="h-16 px-8 flex items-center justify-between border-b border-border bg-sidebar shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4 min-w-0 pr-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveMessageId(null)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <h2 className="text-foreground font-medium truncate text-base">{activeMessage.subject}</h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground w-8 h-8">
              <Archive className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-400 w-8 h-8">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 md:px-24 lg:px-48 py-10 scrollbar-dark">

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={activeMessage.sender.avatar} />
                <AvatarFallback className="bg-muted text-foreground text-xs">
                  {activeMessage.sender.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  {activeMessage.sender.name}
                  <span className="text-[10px] text-muted-foreground font-normal">{`<${activeMessage.sender.name.toLowerCase().replace(' ', '.')}@yntra.se>`}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Till: <span className="text-muted-foreground">{activeMessage.to}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                {activeMessage.date} {activeMessage.timestamp}
              </span>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground w-8 h-8" onClick={handleReply}>
                <Reply className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground w-8 h-8" onClick={handleForward}>
                <Forward className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-foreground leading-loose whitespace-pre-wrap">
            {activeMessage.content}
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <Button variant="outline" className="border-border bg-transparent hover:bg-accent text-foreground" onClick={handleReply}>
              <Reply className="w-4 h-4 mr-2" />
              Svara
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * COMPOSE PANE (Full Screen)
   */
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
            <h2 className="text-foreground font-medium">Nytt Meddelande</h2>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setIsComposing(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!composeData.targetId || !composeData.content.trim()}
              className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white pl-4 pr-5 rounded-full"
            >
              <Send className="w-3.5 h-3.5 mr-2" />
              Skicka
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 md:px-24 lg:px-48 py-8 scrollbar-dark flex flex-col gap-6">
          <div className="flex items-center border-b border-border pb-2 transition-colors focus-within:border-primary/50">
            <label className="text-xs font-medium text-muted-foreground w-16">Till</label>
            <select
              value={composeData.targetType}
              onChange={(e) => setComposeData({ ...composeData, targetType: e.target.value as any, targetId: '' })}
              className="bg-transparent text-sm font-medium focus:outline-none"
            >
              <option value="user" className="bg-card text-foreground">Person</option>
              <option value="team" className="bg-card text-foreground">Hela Teamet</option>
            </select>
            <div className="h-4 w-[1px] bg-border mx-3" />
            <select
              value={composeData.targetId}
              onChange={(e) => setComposeData({ ...composeData, targetId: e.target.value })}
              className="flex-1 bg-transparent border-none text-foreground text-sm focus-visible:ring-0 px-0 h-8 font-medium focus:outline-none"
            >
              <option value="" disabled className="bg-card text-foreground">Välj mottagare...</option>
              {composeData.targetType === 'user' ? (
                dbUsers.filter(u => u.id !== user?.id).map(u => (
                  <option key={u.id} value={u.id} className="bg-card text-foreground">{u.full_name || u.email}</option>
                ))
              ) : (
                dbTeams.map(t => (
                  <option key={t.id} value={t.id} className="bg-card text-foreground">{t.name}</option>
                ))
              )}
            </select>
          </div>
          <div className="flex items-center border-b border-border pb-2 transition-colors focus-within:border-primary/50">
            <label className="text-xs font-medium text-muted-foreground w-16">Ämne</label>
            <Input
              placeholder=""
              value={composeData.subject}
              onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              className="flex-1 bg-transparent border-none text-foreground text-sm focus-visible:ring-0 px-0 h-8 font-medium"
            />
          </div>

          <div className="flex-1 pt-4 pb-10 flex flex-col">
            <textarea
              value={composeData.content}
              onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
              className="w-full bg-transparent border-none text-foreground text-sm leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground flex-1 min-h-[200px]"
              placeholder="Skriv ditt meddelande här..."
              autoFocus={!!composeData.targetId}
            />

            {composeData.quote && (
              <div className="mt-8 pt-4">
                <div className="border-l-2 border-primary/50 pl-4 py-1">
                  {composeData.quote.type === 'forward' ? (
                    <div className="text-xs text-muted-foreground mb-3 font-mono space-y-0.5">
                      <div className="mb-2">---------- Vidarebefordrat meddelande ----------</div>
                      <div>Från: <span className="text-muted-foreground">{composeData.quote.sender}</span></div>
                      <div>Datum: {composeData.quote.date} {composeData.quote.timestamp}</div>
                      <div>Ämne: <span className="text-muted-foreground">{composeData.quote.subject}</span></div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground mb-3">
                      Den {composeData.quote.date} {composeData.quote.timestamp} skrev <span className="text-muted-foreground font-medium">{composeData.quote.sender}</span>:
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground leading-loose whitespace-pre-wrap opacity-80">
                    {composeData.quote.content}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12 flex items-center">
              <Button
                onClick={handleSendMessage}
                disabled={!composeData.targetId || !composeData.content.trim()}
                className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white px-8 font-medium"
              >
                Skicka
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isComposing) return renderComposePane();
  if (activeMessageId) return renderReadPane();

  return renderList();
};

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
