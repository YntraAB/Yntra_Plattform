import { memo, useEffect, useRef } from 'react';
import { Send, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import type { ComposeData } from '../types';
import type { User } from '@/types';

interface SimpleTeam {
  id: string;
  name: string;
}

interface MessageComposePaneProps {
  composeData: ComposeData;
  setComposeData: (data: ComposeData) => void;
  isSending: boolean;
  handleSendMessage: () => void;
  setIsComposing: (val: boolean) => void;
  users: User[];
  teams: SimpleTeam[];
  currentUserId: string | undefined;
}

export const MessageComposePane = memo<MessageComposePaneProps>(({
  composeData,
  setComposeData,
  isSending,
  handleSendMessage,
  setIsComposing,
  users,
  teams,
  currentUserId
}) => {
  const { t } = useTranslation();
  const subjectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the subject input on mount if it's empty and we have a target
    if (composeData.targetId && !composeData.subject) {
      subjectInputRef.current?.focus();
    }
  }, [composeData.targetId, composeData.subject]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative selection:bg-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="h-16 px-8 flex items-center justify-between border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsComposing(false)}
            aria-label={t('messages.cancel')}
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
                <Select
                  value={composeData.targetType}
                  onValueChange={(val) => setComposeData({ ...composeData, targetType: val as 'user' | 'team', targetId: '' })}
                >
                  <SelectTrigger size="sm" className="w-[100px] bg-muted/50 border-border/50 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{t('messages.person')}</SelectItem>
                    <SelectItem value="team">{t('messages.team')}</SelectItem>
                  </SelectContent>
                </Select>

                <div className="h-4 w-[1px] bg-border/50 mx-1" />

                <Select
                  value={composeData.targetId}
                  onValueChange={(val) => setComposeData({ ...composeData, targetId: val })}
                >
                  <SelectTrigger className="flex-1 bg-transparent border-none text-sm font-bold shadow-none focus-visible:ring-0">
                    <SelectValue placeholder={t('messages.recipient_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {composeData.targetType === 'user' ? (
                      users.filter(u => u.id !== currentUserId).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                      ))
                    ) : (
                      teams.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4 border-b border-border/30 pb-4 group focus-within:border-primary/50 transition-colors">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 w-16">{t('messages.subject')}</label>
              <Input
                ref={subjectInputRef}
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
              autoFocus={!!composeData.targetId && !!composeData.subject}
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
});

MessageComposePane.displayName = 'MessageComposePane';
