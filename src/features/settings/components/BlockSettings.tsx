import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  LayoutGrid,
  Info,
  Link2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ICON_MAP, type IconName } from '@/lib/blocks/registry'

interface Block {
  id: string
  name: string
  description: string
  icon: string
  category: string
  dependencies: string[]
}

export const BlockSettings: React.FC<{ setIsSaving: (val: boolean) => void }> = ({ setIsSaving }) => {
  const { t } = useTranslation()
  const { modules, updateModules } = useWorkspace()
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t('settings.blocks.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('settings.blocks.desc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableBlocks.map((block) => {
          const Icon = ICON_MAP[block.icon as IconName] || LayoutGrid
          const isEnabled = !!(modules as any)[block.id]

          return (
            <Card
              key={block.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-md ${isEnabled ? 'border-primary/20 bg-primary/5' : 'border-border/50 opacity-80 hover:opacity-100'
                }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl p-2.5 shadow-inner ${isEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(block.id, checked)}
                  />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <CardTitle className="text-base font-bold">
                    {t(`blocks.${block.id}.name`, block.name)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                  {t(`blocks.${block.id}.desc`, block.description)}
                </CardDescription>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    <Info className="h-3 w-3" />
                    {t(`blocks.categories.${block.category.toLowerCase()}`, block.category)}
                  </div>

                  {block.dependencies?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-500/80">
                      <Link2 className="h-3 w-3" />
                      {block.dependencies.length} {t('settings.blocks.dependencies')}
                    </div>
                  )}
                </div>
              </CardContent>

              {isEnabled && (
                <div className="absolute -right-8 -top-8 h-16 w-16 rotate-45 bg-primary/10" />
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
