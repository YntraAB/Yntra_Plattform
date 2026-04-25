import { memo, useEffect, useRef } from 'react'
import { Send, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import type { ComposeData } from '../types'
import type { User } from '@/types'

interface SimpleTeam {
  id: string
  name: string
}

interface MessageComposePaneProps {
  composeData: ComposeData
  setComposeData: (data: ComposeData) => void
  isSending: boolean
  handleSendMessage: () => void
  setIsComposing: (val: boolean) => void
  users: User[]
  teams: SimpleTeam[]
  currentUserId: string | undefined
}

export const MessageComposePane = memo<MessageComposePaneProps>(
  ({
    composeData,
    setComposeData,
    isSending,
    handleSendMessage,
    setIsComposing,
    users,
    teams,
    currentUserId,
  }) => {
    const { t } = useTranslation()
    const subjectInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      // Focus the subject input on mount if it's empty and we have a target
      if (composeData.targetId && !composeData.subject) {
        subjectInputRef.current?.focus()
      }
    }, [composeData.targetId, composeData.subject])

    return (
      <div className="relative flex h-full flex-1 flex-col bg-background duration-500 animate-in fade-in slide-in-from-bottom-4 selection:bg-primary/20">
        <div className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-background/50 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsComposing(false)}
              aria-label={t('messages.cancel')}
              className="rounded-full text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {t('messages.compose_title')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-sm font-bold text-muted-foreground hover:text-foreground"
              onClick={() => setIsComposing(false)}
            >
              {t('messages.cancel')}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !composeData.targetId || !composeData.content.trim()}
              className="h-10 rounded-full bg-primary pl-5 pr-7 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {isSending ? (
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t('messages.sending')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-3.5 w-3.5" />
                  {t('messages.send')}
                </div>
              )}
            </Button>
          </div>
        </div>

        <div className="scrollbar-dark flex-1 overflow-y-auto scroll-smooth px-8 py-10 md:px-16 lg:px-32">
          <div className="mx-auto flex max-w-4xl flex-col gap-8">
            <div className="space-y-4">
              <div className="group flex items-center gap-4 border-b border-border/30 pb-4 transition-colors focus-within:border-primary/50">
                <label className="w-16 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {t('messages.to')}
                </label>
                <div className="flex flex-1 items-center gap-2">
                  <Select
                    value={composeData.targetType}
                    onValueChange={(val) =>
                      setComposeData({
                        ...composeData,
                        targetType: val as 'user' | 'team',
                        targetId: '',
                      })
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-[100px] border-border/50 bg-muted/50 text-xs font-bold"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t('messages.person')}</SelectItem>
                      <SelectItem value="team">{t('messages.team')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="mx-1 h-4 w-[1px] bg-border/50" />

                  <Select
                    value={composeData.targetId}
                    onValueChange={(val) => setComposeData({ ...composeData, targetId: val })}
                  >
                    <SelectTrigger className="flex-1 border-none bg-transparent text-sm font-bold shadow-none focus-visible:ring-0">
                      <SelectValue placeholder={t('messages.recipient_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {composeData.targetType === 'user'
                        ? users
                            .filter((u) => u.id !== currentUserId)
                            .map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name || u.email}
                              </SelectItem>
                            ))
                        : teams.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="group flex items-center gap-4 border-b border-border/30 pb-4 transition-colors focus-within:border-primary/50">
                <label className="w-16 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {t('messages.subject')}
                </label>
                <Input
                  ref={subjectInputRef}
                  placeholder={t('messages.subject_placeholder')}
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="h-8 flex-1 border-none bg-transparent p-0 text-sm font-bold text-foreground shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="flex min-h-[400px] flex-1 flex-col gap-8">
              <textarea
                value={composeData.content}
                onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                className="w-full flex-1 resize-none border-none bg-transparent text-[15px] font-medium leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                placeholder={t('messages.content_placeholder')}
                autoFocus={!!composeData.targetId && !!composeData.subject}
              />

              {composeData.quote && (
                <div className="mt-4 duration-300 animate-in fade-in slide-in-from-top-2">
                  <div className="rounded-r-2xl border-l-4 border-primary/20 bg-primary/5 py-6 pl-6 pr-4">
                    {composeData.quote.type === 'forward' ? (
                      <div className="mb-4 space-y-1 font-mono text-[11px] text-muted-foreground/80">
                        <div className="mb-3 font-bold text-primary/60">
                          ---------- {t('messages.forwarded_message').toUpperCase()} ----------
                        </div>
                        <div>
                          <span className="opacity-60">{t('messages.from')}:</span>{' '}
                          <span className="font-bold text-foreground/80">
                            {composeData.quote.sender}
                          </span>
                        </div>
                        <div>
                          <span className="opacity-60">{t('messages.date')}:</span>{' '}
                          {composeData.quote.date} {composeData.quote.timestamp}
                        </div>
                        <div>
                          <span className="opacity-60">{t('messages.subject')}:</span>{' '}
                          <span className="font-bold text-foreground/80">
                            {composeData.quote.subject}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 text-[11px] font-medium italic text-muted-foreground/80">
                        {t('messages.date')}: {composeData.quote.date} {composeData.quote.timestamp}
                        ,{' '}
                        <span className="font-bold text-primary/60">
                          {composeData.quote.sender}
                        </span>{' '}
                        {t('messages.wrote')}:
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-foreground/60">
                      {composeData.quote.content}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-border/30 pb-12 pt-8">
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !composeData.targetId || !composeData.content.trim()}
                  className="group flex h-12 items-center gap-2 rounded-xl bg-primary px-10 font-bold text-white shadow-xl shadow-primary/10 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                >
                  {isSending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t('messages.sending')}
                    </div>
                  ) : (
                    <>
                      {t('messages.send')}
                      <Send className="h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

MessageComposePane.displayName = 'MessageComposePane'
