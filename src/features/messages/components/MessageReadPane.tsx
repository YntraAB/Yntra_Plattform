import { memo } from 'react'
import { Archive, Trash2, Reply, Forward, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTranslation } from 'react-i18next'
import type { ProcessedMessage } from '../types'

interface MessageReadPaneProps {
  activeMessage: ProcessedMessage | null
  currentUserId: string | undefined
  setActiveMessageId: (id: string | null) => void
  handleReply: () => void
  handleForward: () => void
}

export const MessageReadPane = memo<MessageReadPaneProps>(
  ({ activeMessage, currentUserId, setActiveMessageId, handleReply, handleForward }) => {
    const { t } = useTranslation()

    if (!activeMessage) return null

    return (
      <div className="relative flex h-full flex-1 flex-col bg-background duration-500 animate-in fade-in slide-in-from-right-4 selection:bg-primary/20">
        <div className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-background/50 px-8 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-4 pr-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveMessageId(null)}
              aria-label={t('messages.go_back')}
              className="shrink-0 rounded-full text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <h2 className="truncate text-lg font-bold tracking-tight text-foreground">
              {activeMessage.subject}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('messages.archive')}
              className="h-9 w-9 rounded-full text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary"
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('messages.trash')}
              className="h-9 w-9 rounded-full text-muted-foreground transition-all hover:bg-rose-500/5 hover:text-rose-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="scrollbar-dark flex-1 overflow-y-auto scroll-smooth px-8 py-10 md:px-16 lg:px-32">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 flex items-start justify-between border-b border-border/30 pb-8">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/20 p-0.5 shadow-lg">
                  <AvatarImage src={activeMessage.sender.avatar} className="rounded-full" />
                  <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                    {activeMessage.sender.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="mb-0.5 flex items-center gap-2 text-base font-bold text-foreground">
                    {activeMessage.sender.name}
                    <span className="rounded-full border border-border/50 bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      {activeMessage.sender_id === currentUserId
                        ? t('messages.you')
                        : t('directory.roles.assistant')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/60">{t('messages.to')}:</span>
                    <span className="rounded-md bg-primary/5 px-2 py-0.5 font-bold text-primary/80">
                      {activeMessage.to}
                    </span>
                    <span className="mx-1 text-border">|</span>
                    <span className="font-medium tabular-nums tracking-tight opacity-60">
                      {activeMessage.date} {activeMessage.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                  onClick={handleReply}
                >
                  <Reply className="h-4 w-4" />
                  {t('messages.reply')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                  onClick={handleForward}
                >
                  <Forward className="h-4 w-4" />
                  {t('messages.forward')}
                </Button>
              </div>
            </div>

            <div className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-foreground/90">
              {activeMessage.content}
            </div>

            <div className="mt-16 border-t border-border/30 pt-10">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleReply}
                  className="flex h-12 items-center gap-2 rounded-xl bg-primary px-8 font-bold text-white transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20"
                >
                  <Reply className="h-4 w-4" />
                  {t('messages.reply')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleForward}
                  className="flex h-12 items-center gap-2 rounded-xl border-border px-8 font-bold transition-all hover:bg-secondary"
                >
                  <Forward className="h-4 w-4" />
                  {t('messages.forward')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

MessageReadPane.displayName = 'MessageReadPane'
