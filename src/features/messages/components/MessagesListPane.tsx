import React, { memo, useCallback } from 'react';
import {
  Inbox,
  Trash2,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Clock,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { MessageSkeleton } from './MessageSkeleton';
import type { ProcessedMessage } from '../types';

interface MessagesListPaneProps {
  messages: ProcessedMessage[];
  isLoading: boolean;
  filterType: string;
  setFilterType: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  handleSelectMessage: (id: string) => void;
  handleCompose: () => void;
  selectedMsgs: string[];
  setSelectedMsgs: React.Dispatch<React.SetStateAction<string[]>>;
  handleDeleteSelected: () => void;
}

export const MessagesListPane = memo<MessagesListPaneProps>(({
  messages,
  isLoading,
  filterType,
  setFilterType,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  totalPages,
  handleSelectMessage,
  handleCompose,
  selectedMsgs,
  setSelectedMsgs,
  handleDeleteSelected
}) => {
  const { t } = useTranslation();

  const getTitle = useCallback(() => {
    if (filterType === 'inbox') return t('messages.inbox');
    if (filterType === 'unread') return t('messages.unread');
    if (filterType === 'sent') return t('messages.sent');
    if (filterType === 'archive') return t('messages.archive');
    if (filterType === 'trash') return t('messages.trash');
    return t('messages.inbox');
  }, [filterType, t]);

  const isAllSelected = messages.length > 0 && selectedMsgs.length === messages.length;

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedMsgs([]);
    } else {
      setSelectedMsgs(messages.map(m => m.id));
    }
  }, [isAllSelected, messages, setSelectedMsgs]);

  const toggleSelect = useCallback((id: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (selectedMsgs.includes(id)) {
      setSelectedMsgs(prev => prev.filter(m => m !== id));
    } else {
      setSelectedMsgs(prev => [...prev, id]);
    }
  }, [selectedMsgs, setSelectedMsgs]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative selection:bg-primary/20">
      {/* Top Header Controls */}
      <div className="h-16 px-8 flex items-center justify-between border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div
            className={`w-8 shrink-0 flex items-center justify-center cursor-pointer group transition-all duration-200 ${isAllSelected ? 'scale-110' : ''}`}
            onClick={toggleSelectAll}
            role="checkbox"
            aria-checked={isAllSelected}
            aria-label={t('common.select_all')}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') toggleSelectAll() }}
          >
            <div className={`w-4 h-4 rounded-[4px] border ${isAllSelected ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/50'} flex items-center justify-center transition-all duration-300`}>
              {isAllSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>

          <h2 className="text-foreground font-semibold flex items-center ml-2 mr-2 text-lg tracking-tight">
            {getTitle()}
          </h2>

          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" aria-label={t('common.more_options')}>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
          </Button>

          {selectedMsgs.length > 0 && (
            <div className="flex items-center gap-1 border-l border-border ml-2 pl-4 animate-in fade-in slide-in-from-left-2 duration-300">
              <Button variant="ghost" size="icon" aria-label={t('messages.delete_selected')} className="w-8 h-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all" onClick={handleDeleteSelected}>
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
              aria-label={t('messages.search_placeholder')}
              className="pl-9 bg-muted/50 border border-border/50 text-foreground h-9 rounded-full text-xs focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-muted transition-all"
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground relative group">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label={t('messages.filter')}
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
              aria-label={t('pagination.previous')}
              className={`w-8 h-8 rounded-full transition-all ${currentPage > 1 ? 'hover:text-foreground hover:bg-secondary' : 'opacity-30'}`}
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold tabular-nums text-foreground/80" aria-label={t('pagination.page_info', { current: currentPage, total: totalPages })}>{currentPage} <span className="text-muted-foreground font-medium mx-1">/</span> {totalPages}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('pagination.next')}
              className={`w-8 h-8 rounded-full transition-all ${currentPage < totalPages ? 'hover:text-foreground hover:bg-secondary' : 'opacity-30'}`}
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <MessageSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto w-full scrollbar-dark scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6 border border-border/50">
                <Inbox className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-sm font-medium">{t('messages.empty_state')}</p>
            </div>
          ) : (
            <div className="flex flex-col w-full text-sm">
              {messages.map((msg, idx) => {
                const isSelected = selectedMsgs.includes(msg.id);
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg.id)}
                    className={`group flex items-center px-6 py-3.5 border-b border-border/40 hover:bg-secondary/40 cursor-pointer transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSelectMessage(msg.id) }}
                    aria-label={t('messages.read_message', { subject: msg.subject })}
                  >
                    <div
                      className="w-10 shrink-0 flex items-center justify-start py-1"
                      onClick={(e) => toggleSelect(msg.id, e)}
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={t('messages.select_message')}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') toggleSelect(msg.id, e as any) }}
                    >
                      <div className={`w-[18px] h-[18px] rounded-[5px] border transition-all duration-300 ${isSelected ? 'border-primary bg-primary' : 'border-border/60 group-hover:border-primary/50'}`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>

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

                    <div className="flex-1 flex items-center truncate min-w-0 pr-6 gap-x-2">
                      {msg.folderId === 'sent' && <span className="text-[10px] font-black uppercase tracking-tighter text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded shrink-0">{t('messages.to')} {msg.to}</span>}
                      <span className={`${msg.unread ? 'text-foreground font-bold' : 'text-foreground/90'} truncate`}>
                        {msg.subject}
                      </span>
                      <span className="text-muted-foreground/60 truncate italic font-light">
                        {msg.snippet}
                      </span>
                    </div>

                    <div className="w-48 shrink-0 flex items-center justify-end">
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-3.5 mr-6 text-muted-foreground/60 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <Archive className="w-[18px] h-[18px] hover:text-primary transition-colors cursor-pointer" />
                        <Trash2 className="w-[18px] h-[18px] hover:text-rose-500 transition-colors cursor-pointer" />
                        <Clock className="w-[18px] h-[18px] hover:text-foreground transition-colors cursor-pointer" />
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
      )}

      {/* Floating Action Button */}
      <div className="absolute bottom-10 right-10 z-20">
        <Button
          onClick={handleCompose}
          size="lg"
          aria-label={t('messages.new_message')}
          className="rounded-full h-14 pl-5 pr-7 bg-foreground text-background hover:bg-foreground/90 shadow-[0_20px_50px_rgba(0,0,0,0.3)] font-bold flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 group overflow-hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="relative z-10">{t('messages.new_message')}</span>
        </Button>
      </div>
    </div>
  );
});

MessagesListPane.displayName = 'MessagesListPane';
