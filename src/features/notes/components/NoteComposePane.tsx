import React from 'react'
import { ChevronLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import type { NoteTeam } from '../types'

interface NoteComposePaneProps {
  selectedTeam: NoteTeam | null
  setIsComposing: (isComposing: boolean) => void
  composeSubject: string
  setComposeSubject: (subject: string) => void
  composeText: string
  setComposeText: (text: string) => void
  handleSaveNote: () => void
}

export const NoteComposePane: React.FC<NoteComposePaneProps> = ({
  selectedTeam,
  setIsComposing,
  composeSubject,
  setComposeSubject,
  composeText,
  setComposeText,
  handleSaveNote,
}) => {
  const { t } = useTranslation()

  return (
    <div className="relative flex h-full flex-1 flex-col bg-background">
      <div className="flex h-16 items-center justify-between border-b border-border px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsComposing(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-medium text-foreground">
            {t('notes.compose.title')} {selectedTeam?.displayName || selectedTeam?.name}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setIsComposing(false)}
          >
            {t('notes.compose.cancel')}
          </Button>
          <Button
            className="rounded-full bg-primary pl-4 pr-5 text-white hover:bg-primary/80 dark:bg-[#0F1115] dark:hover:bg-[#1A1D24]"
            disabled={composeText.trim().length === 0}
            onClick={handleSaveNote}
          >
            <Check className="mr-2 h-4 w-4" />
            {t('notes.compose.save_button')}
          </Button>
        </div>
      </div>

      <div className="scrollbar-dark flex flex-1 flex-col gap-8 overflow-y-auto px-8 py-10 md:px-24 lg:px-48">
        <div className="flex flex-col border-b border-border pb-2 transition-colors">
          <label className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t('notes.compose.subject_label')}
          </label>
          <input
            placeholder={t('notes.compose.subject_placeholder')}
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
            className="h-10 w-full border-none bg-transparent px-0 text-lg font-medium text-foreground placeholder:text-[15px] placeholder:font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
            autoFocus
          />
        </div>

        <div className="flex flex-1 flex-col pb-10">
          <textarea
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            className="min-h-[300px] w-full flex-1 resize-none border-none bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            placeholder={t('notes.compose.content_placeholder')}
          />
        </div>
      </div>
    </div>
  )
}
