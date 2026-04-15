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
import { useTranslation } from 'react-i18next';

interface MessagesPageProps {
  setBreadcrumbNode?: (node: React.ReactNode) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ setBreadcrumbNode }) => {
  const { workspaceId } = useWorkspace();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [filterType, setFilterType] = useState('inbox');
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const markAsRead = async (id: string) => {
    const msg = dbMessages.find(m => m.id === id);
    if (msg && msg.unread) {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', id);

      if (!error) {
        setDbMessages(prev => prev.map(m =>
          m.id === id ? { ...m, unread: false } : m
        ));
      }
    }
  };
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
  const [isSending, setIsSending] = useState(false);

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
            toName = rcvrData ? (rcvrData.full_name || rcvrData.email || t('messages.anonymous')) : t('messages.anonymous');
          }

          const sndrData = Array.isArray(m.sender) ? m.sender[0] : m.sender;
          const senderName = sndrData ? (sndrData.full_name || sndrData.email || t('messages.system')) : t('messages.system');

          return {
            id: m.id,
            sender_id: m.sender_id,
            receiver_id: m.receiver_id,
            target_team_id: m.target_team_id,
            folderId: m.sender_id === user.id ? 'sent' : 'inbox',
            sender: { name: senderName, avatar: '' },
            to: toName,
            isTeamMessage: !!m.target_team_id,
            subject: m.subject || t('messages.no_header'),
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
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / itemsPerPage));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery]);

  const currentMessages = filteredMessages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getTitle = React.useCallback(() => {
    if (filterType === 'inbox') return t('messages.inbox');
    if (filterType === 'unread') return t('messages.unread');
    if (filterType === 'sent') return t('messages.sent');
    if (filterType === 'archive') return t('messages.archive');
    if (filterType === 'trash') return t('messages.trash');
    return t('messages.inbox');
  }, [filterType, t]);

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

    setIsSending(true);
    // Set is_read to true if we send to ourselves, otherwise false. But logic normally false.
    const payload = {
      workspace_id: workspaceId,
      sender_id: user.id,
      subject: composeData.subject || t('messages.no_header'),
      body: composeData.content,
      is_read: false
    } as any;

    if (composeData.targetType === 'user') {
      payload.receiver_id = composeData.targetId;
    } else {
      payload.target_team_id = composeData.targetId;
    }

    const { error } = await supabase.from('messages').insert(payload);
    setIsSending(false);
    if (error) {
      alert(t('messages.error_sending') + ": " + error.message);
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
    markAsRead(id);
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
      <div className="flex-1 flex flex-col h-full bg-background relative selection:bg-primary/20">
        {/* Top Header Controls */}
        <div className="h-16 px-8 flex items-center justify-between border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Master Checkbox */}
            <div
              className={`w-8 shrink-0 flex items-center justify-center cursor-pointer group transition-all duration-200 ${isAllSelected ? 'scale-110' : ''}`}
              onClick={toggleSelectAll}
            >
              <div className={`w-4 h-4 rounded-[4px] border ${isAllSelected ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/50'} flex items-center justify-center transition-all duration-300`}>
                {isAllSelected && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>

            <h2 className="text-foreground font-semibold flex items-center ml-2 mr-2 text-lg tracking-tight">
              {getTitle()}
            </h2>

            <MoreHorizontal className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />

            {selectedMsgs.length > 0 && (
              <div className="flex items-center gap-1 border-l border-border ml-2 pl-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all" onClick={handleDeleteSelected}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold ml-1 border border-primary/20">
                  {selectedMsgs.length} {t('messages.selected')}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder={t('messages.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50 border border-border/50 text-foreground h-9 rounded-full text-xs focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-muted transition-all"
              />
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground relative group">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-muted/80 border border-border/50 text-foreground font-semibold hover:bg-secondary cursor-pointer rounded-lg pl-3 pr-8 py-1.5 appearance-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                style={{ WebkitAppearance: 'none' }}
              >
                <option value="inbox" className="bg-card text-foreground py-2">{t('messages.inbox')}</option>
                <option value="unread" className="bg-card text-foreground py-2">{t('messages.unread')}</option>
                <option value="sent" className="bg-card text-foreground py-2">{t('messages.sent')}</option>
                <option value="archive" className="bg-card text-foreground py-2">{t('messages.archive')}</option>
                <option value="trash" className="bg-card text-rose-400 py-2">{t('messages.trash')}</option>
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-foreground transition-colors">
                <ChevronLeft className="w-3.5 h-3.5 -rotate-90" />
              </div>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <Button
                variant="ghost"
                size="icon"
                className={`w-8 h-8 rounded-full transition-all ${currentPage > 1 ? 'hover:text-foreground hover:bg-secondary' : 'opacity-30'}`}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-bold tabular-nums text-foreground/80">{currentPage} <span className="text-muted-foreground font-medium mx-1">/</span> {totalPages}</span>
              <Button
                variant="ghost"
                size="icon"
                className={`w-8 h-8 rounded-full transition-all ${currentPage < totalPages ? 'hover:text-foreground hover:bg-secondary' : 'opacity-30'}`}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Message Table */}
        <div className="flex-1 overflow-y-auto w-full scrollbar-dark scroll-smooth">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6 border border-border/50">
                <Inbox className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-sm font-medium">{t('messages.empty_state')}</p>
            </div>
          ) : (
            <div className="flex flex-col w-full text-sm">
              {currentMessages.map((msg, idx) => {
                const isSelected = selectedMsgs.includes(msg.id);
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg.id)}
                    className={`group flex items-center px-6 py-3.5 border-b border-border/40 hover:bg-secondary/40 cursor-pointer transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >

                    {/* Checkbox */}
                    <div
                      className="w-10 shrink-0 flex items-center justify-start py-1"
                      onClick={(e) => toggleSelect(msg.id, e)}
                    >
                      <div className={`w-[18px] h-[18px] rounded-[5px] border transition-all duration-300 ${isSelected ? 'border-primary bg-primary' : 'border-border/60 group-hover:border-primary/50'}`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>

                    {/* Sender & Context */}
                    <div className={`w-56 shrink-0 truncate pr-4 transition-colors ${msg.unread ? 'text-foreground font-bold' : 'text-muted-foreground group-hover:text-foreground/80'}`}>
                      <div className="flex items-center gap-2">
                        {msg.sender.name}
                        {msg.unread && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                      {msg.isTeamMessage && msg.folderId !== 'sent' && (
                        <div className="text-[10px] uppercase font-bold text-primary mt-1 tracking-widest truncate opacity-80">
                          {t('messages.team_collective', { name: msg.to })}
                        </div>
                      )}
                    </div>

                    {/* Subject & Snippet */}
                    <div className="flex-1 flex items-center truncate min-w-0 pr-6 gap-x-2">
                      {msg.folderId === 'sent' && <span className="text-[10px] font-black uppercase tracking-tighter text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded shrink-0">{t('messages.to')} {msg.to}</span>}
                      <span className={`${msg.unread ? 'text-foreground font-bold' : 'text-foreground/90'} truncate`}>
                        {msg.subject}
                      </span>
                      <span className="text-muted-foreground/60 truncate italic font-light">
                        {msg.snippet}
                      </span>
                    </div>

                    {/* Quick Actions (Hover) & Date */}
                    <div className="w-48 shrink-0 flex items-center justify-end">

                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-3.5 mr-6 text-muted-foreground/60 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <Archive className="w-[18px] h-[18px] hover:text-primary transition-colors" />
                        <Trash2 className="w-[18px] h-[18px] hover:text-rose-500 transition-colors" />
                        <Clock className="w-[18px] h-[18px] hover:text-foreground transition-colors" />
                      </div>

                      <span className={`text-[11px] font-bold tracking-tighter uppercase tabular-nums ${msg.unread ? 'text-primary' : 'text-muted-foreground/50'}`}>
                        {msg.date === t('common.today') ? msg.timestamp : msg.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <div className="absolute bottom-10 right-10">
          <Button
            onClick={handleCompose}
            size="lg"
            className="rounded-full h-14 pl-5 pr-7 bg-foreground text-background hover:bg-foreground/90 shadow-[0_20px_50px_rgba(0,0,0,0.3)] font-bold flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 group overflow-hidden"
          >
            <PlusIcon />
            <span className="relative z-10">{t('messages.new_message')}</span>
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
      <div className="flex-1 flex flex-col h-full bg-background relative selection:bg-primary/20 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="h-16 px-8 flex items-center justify-between border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-4 min-w-0 pr-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveMessageId(null)}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full shrink-0 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <h2 className="text-foreground font-bold truncate text-lg tracking-tight">{activeMessage.subject}</h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/5 w-9 h-9 rounded-full transition-all">
              <Archive className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 w-9 h-9 rounded-full transition-all">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 md:px-16 lg:px-32 py-10 scrollbar-dark scroll-smooth">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-10 pb-8 border-b border-border/30">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-primary/20 p-0.5 shadow-lg">
                  <AvatarImage src={activeMessage.sender.avatar} className="rounded-full" />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {activeMessage.sender.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-base font-bold text-foreground flex items-center gap-2 mb-0.5">
                    {activeMessage.sender.name}
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full border border-border/50">
                      {activeMessage.sender_id === user?.id ? t('messages.you') : t('directory.roles.assistant')}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="font-medium text-foreground/60">{t('messages.to')}:</span>
                    <span className="bg-primary/5 text-primary/80 px-2 py-0.5 rounded-md font-bold">{activeMessage.to}</span>
                    <span className="text-border mx-1">|</span>
                    <span className="tabular-nums opacity-60 font-medium tracking-tight">
                      {activeMessage.date} {activeMessage.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-secondary gap-2 px-3 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all" onClick={handleReply}>
                  <Reply className="w-4 h-4" />
                  {t('messages.reply')}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-secondary gap-2 px-3 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all" onClick={handleForward}>
                  <Forward className="w-4 h-4" />
                  {t('messages.forward')}
                </Button>
              </div>
            </div>

            <div className="text-[15px] text-foreground/90 leading-relaxed whitespace-pre-wrap font-medium">
              {activeMessage.content}
            </div>

            <div className="mt-16 pt-10 border-t border-border/30">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleReply}
                  className="bg-primary text-white hover:bg-primary/90 px-8 h-12 rounded-xl font-bold transition-all hover:shadow-xl hover:shadow-primary/20 flex items-center gap-2"
                >
                  <Reply className="w-4 h-4" />
                  {t('messages.reply')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleForward}
                  className="border-border hover:bg-secondary px-8 h-12 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <Forward className="w-4 h-4" />
                  {t('messages.forward')}
                </Button>
              </div>
            </div>
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
      <div className="flex-1 flex flex-col h-full bg-background relative selection:bg-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="h-16 px-8 flex items-center justify-between border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsComposing(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-foreground font-bold text-lg tracking-tight">{t('messages.compose_title')}</h2>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-bold text-sm" onClick={() => setIsComposing(false)}>
              {t('messages.cancel')}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !composeData.targetId || !composeData.content.trim()}
              className="bg-primary hover:bg-primary/90 text-white pl-5 pr-7 h-10 rounded-full font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSending ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('messages.sending')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-3.5 h-3.5" />
                  {t('messages.send')}
                </div>
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 md:px-16 lg:px-32 py-10 scrollbar-dark scroll-smooth">
          <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 border-b border-border/30 pb-4 group focus-within:border-primary/50 transition-colors">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 w-16">{t('messages.to')}</label>
                <div className="flex items-center flex-1 gap-2">
                  <select
                    value={composeData.targetType}
                    onChange={(e) => setComposeData({ ...composeData, targetType: e.target.value as any, targetId: '' })}
                    className="bg-muted/50 text-foreground text-xs font-bold px-3 py-1.5 rounded-lg border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer hover:bg-muted"
                  >
                    <option value="user" className="bg-card text-foreground">{t('messages.person')}</option>
                    <option value="team" className="bg-card text-foreground">{t('messages.team')}</option>
                  </select>
                  <div className="h-4 w-[1px] bg-border/50 mx-1" />
                  <select
                    value={composeData.targetId}
                    onChange={(e) => setComposeData({ ...composeData, targetId: e.target.value })}
                    className="flex-1 bg-transparent border-none text-foreground text-sm font-bold focus:outline-none placeholder:text-muted-foreground cursor-pointer"
                  >
                    <option value="" disabled className="bg-card text-foreground">{t('messages.recipient_placeholder')}</option>
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
              </div>

              <div className="flex items-center gap-4 border-b border-border/30 pb-4 group focus-within:border-primary/50 transition-colors">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 w-16">{t('messages.subject')}</label>
                <Input
                  placeholder={t('messages.subject_placeholder')}
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="flex-1 bg-transparent border-none text-foreground text-sm font-bold focus-visible:ring-0 p-0 h-8 shadow-none"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-8 min-h-[400px]">
              <textarea
                value={composeData.content}
                onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                className="w-full bg-transparent border-none text-foreground text-[15px] leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/40 flex-1 font-medium"
                placeholder={t('messages.content_placeholder')}
                autoFocus={!!composeData.targetId}
              />

              {composeData.quote && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="border-l-4 border-primary/20 bg-primary/5 pl-6 pr-4 py-6 rounded-r-2xl">
                    {composeData.quote.type === 'forward' ? (
                      <div className="text-[11px] text-muted-foreground/80 mb-4 font-mono space-y-1">
                        <div className="mb-3 font-bold text-primary/60">---------- {t('messages.forwarded_message').toUpperCase()} ----------</div>
                        <div><span className="opacity-60">{t('messages.from')}:</span> <span className="font-bold text-foreground/80">{composeData.quote.sender}</span></div>
                        <div><span className="opacity-60">{t('messages.date')}:</span> {composeData.quote.date} {composeData.quote.timestamp}</div>
                        <div><span className="opacity-60">{t('messages.subject')}:</span> <span className="font-bold text-foreground/80">{composeData.quote.subject}</span></div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground/80 mb-4 font-medium italic">
                        {t('messages.date')}: {composeData.quote.date} {composeData.quote.timestamp}, <span className="font-bold text-primary/60">{composeData.quote.sender}</span> {t('messages.wrote')}:
                      </div>
                    )}
                    <div className="text-[13px] text-foreground/60 leading-relaxed whitespace-pre-wrap font-medium">
                      {composeData.quote.content}
                    </div>
                  </div>
                </div>
              )}

              <div className="pb-12 border-t border-border/30 pt-8">
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !composeData.targetId || !composeData.content.trim()}
                  className="bg-primary text-white hover:bg-primary/90 px-10 h-12 rounded-xl font-bold transition-all shadow-xl shadow-primary/10 flex items-center gap-2 group hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isSending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('messages.sending')}
                    </div>
                  ) : (
                    <>
                      {t('messages.send')}
                      <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
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
