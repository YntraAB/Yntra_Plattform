import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  LayoutGrid,
  Search,
  Settings2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { ICON_MAP, type IconName } from '@/lib/blocks/icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { SchedulerSettings } from './SchedulerSettings'
import { NotificationsSettings } from './NotificationsSettings'

interface Block {
  id: string
  name: string
  description: string
  icon: string
  category: string
  dependencies: string[]
}

const CONFIGURABLE_BLOCKS = ['scheduling', 'messaging']

export const BlockSettings: React.FC<{ setIsSaving: (val: boolean) => void }> = ({ setIsSaving }) => {
  const { t } = useTranslation()
  const { modules, updateModules } = useWorkspace()
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [configBlock, setConfigBlock] = useState<Block | null>(null)

  useEffect(() => {
    async function fetchBlocks() {
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .order('name')

      if (!error && data) {
        setAvailableBlocks(data)
      }
      setIsLoading(false)
    }
    fetchBlocks()
  }, [])

  const categories = ['all', ...Array.from(new Set(availableBlocks.map(b => b.category.toLowerCase())))]

  const filteredBlocks = availableBlocks.filter(block => {
    const matchesSearch =
      block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || block.category.toLowerCase() === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleToggle = async (blockId: string, enabled: boolean) => {
    if (enabled) {
      const block = availableBlocks.find((b) => b.id === blockId)
      if (block?.dependencies?.length) {
        const missing = block.dependencies.filter((depId) => !(modules as any)[depId])
        if (missing.length > 0) {
          const names = missing
            .map((id) => availableBlocks.find((b) => b.id === id)?.name || id)
            .join(', ')
          alert(t('settings.blocks.dependency_error', { names }))
          return
        }
      }
    }

    setIsSaving(true)
    await updateModules({ [blockId]: enabled })
    setTimeout(() => setIsSaving(false), 500)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t('settings.blocks.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('settings.blocks.desc')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('settings.blocks.search_placeholder')}
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all'
                ? t('settings.blocks.filter_all')
                : t(`blocks.categories.${cat}`, cat.charAt(0).toUpperCase() + cat.slice(1))
              }
            </Button>
          ))}
        </div>
      </div>

      {filteredBlocks.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed text-muted-foreground">
          <LayoutGrid className="mb-2 h-8 w-8 opacity-20" />
          <p className="text-sm">{t('settings.blocks.no_results')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBlocks.map((block) => {
            const Icon = ICON_MAP[block.icon as IconName] || LayoutGrid
            const isEnabled = !!(modules as any)[block.id]

            return (
              <Card
                key={block.id}
                onClick={() => handleToggle(block.id, !isEnabled)}
                className={cn(
                  "group relative cursor-pointer overflow-hidden border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                  isEnabled && "border-primary/30 bg-primary/[0.02] ring-1 ring-primary/10"
                )}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "rounded-lg p-2 transition-all duration-300 group-hover:scale-105",
                      isEnabled ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {CONFIGURABLE_BLOCKS.includes(block.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfigBlock(block)
                          }}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Switch
                        checked={isEnabled}
                        className="scale-90"
                        onCheckedChange={(checked) => handleToggle(block.id, checked)}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-bold tracking-tight">
                      {t(`blocks.${block.id}.name`, block.name ?? '')}
                    </CardTitle>
                    {isEnabled && (
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <CardDescription className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/80">
                    {t(`blocks.${block.id}.desc`, block.description ?? '')}
                  </CardDescription>
                </CardContent>

                {isEnabled && (
                  <div className="absolute -right-10 -top-10 h-20 w-20 rotate-45 bg-primary/5 transition-transform duration-500 group-hover:scale-110" />
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!configBlock} onOpenChange={() => setConfigBlock(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                {configBlock && (ICON_MAP[configBlock.icon as IconName] ? React.createElement(ICON_MAP[configBlock.icon as IconName], { className: "h-5 w-5" }) : <LayoutGrid className="h-5 w-5" />)}
              </div>
              <div>
                <DialogTitle>{t(`blocks.${configBlock?.id}.name`, configBlock?.name ?? '')}</DialogTitle>
                <DialogDescription>
                  {t(`blocks.${configBlock?.id}.desc`, configBlock?.description ?? '')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4">
            {configBlock?.id === 'scheduling' && (
              <SchedulerSettings setIsSaving={setIsSaving} />
            )}
            {configBlock?.id === 'messaging' && (
              <NotificationsSettings setIsSaving={setIsSaving} />
            )}
            {!['scheduling', 'messaging'].includes(configBlock?.id || '') && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Settings2 className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-lg font-medium">{t('settings.blocks.config_placeholder_title')}</h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                  {t('settings.blocks.config_placeholder_desc')}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
