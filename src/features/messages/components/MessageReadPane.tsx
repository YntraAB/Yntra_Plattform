import { memo } from 'react';
import {
  Archive,
  Trash2,
  Reply,
  Forward,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import type { ProcessedMessage } from '../types';

interface MessageReadPaneProps {
  activeMessage: ProcessedMessage | null;
  currentUserId: string | undefined;
  setActiveMessageId: (id: string | null) => void;
  handleReply: () => void;
  handleForward: () => void;
}

export const MessageReadPane = memo<MessageReadPaneProps>(({
  activeMessage,
  currentUserId,
  setActiveMessageId,
  handleReply,
  handleForward
}) => {
  const { t } = useTranslation();

  if (!activeMessage) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative selection:bg-primary/20 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="h-16 px-8 flex items-center justify-between border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-4 min-w-0 pr-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveMessageId(null)}
            aria-label={t('messages.go_back')}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full shrink-0 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <h2 className="text-foreground font-bold truncate text-lg tracking-tight">{activeMessage.subject}</h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="icon" aria-label={t('messages.archive')} className="text-muted-foreground hover:text-primary hover:bg-primary/5 w-9 h-9 rounded-full transition-all">
            <Archive className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t('messages.trash')} className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 w-9 h-9 rounded-full transition-all">
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
                    {activeMessage.sender_id === currentUserId ? t('messages.you') : t('directory.roles.assistant')}
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
});

MessageReadPane.displayName = 'MessageReadPane';
