import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { School, HeartPulse } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DevHubModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DevHubModal: React.FC<DevHubModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const [hubWsName, setHubWsName] = useState('')
  const [hubAdminEmail, setHubAdminEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModules, setSelectedModules] = useState({
    school: false,
    assistance: false,
  })

  const handleModuleToggle = (moduleKey: 'school' | 'assistance', checked: boolean) => {
    if (checked) {
      const otherKey = moduleKey === 'school' ? 'assistance' : 'school'
      setSelectedModules({ [moduleKey]: true, [otherKey]: false } as typeof selectedModules)
    } else {
      setSelectedModules((prev) => ({ ...prev, [moduleKey]: false }))
    }
  }

  const handleCreate = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.functions.invoke('invite_user', {
      body: {
        newWorkspaceName: hubWsName,
        email: hubAdminEmail,
        role: 'admin',
        modules: selectedModules,
      },
    })
    setIsLoading(false)
    if (error) alert(t('directory.members.delete_error') + ' ' + error.message)
    else if (data && data.success === false)
      alert(t('directory.members.delete_error') + ' ' + data.error)
    else {
      alert(t('directory.hub.success'))
      onClose()
      setHubWsName('')
      setHubAdminEmail('')
      setSelectedModules({ school: false, assistance: false })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-sidebar sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t('directory.hub.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wsName" className="text-muted-foreground">
                {t('directory.hub.ws_name_label')}
              </Label>
              <Input
                id="wsName"
                value={hubWsName}
                onChange={(e) => setHubWsName(e.target.value)}
                placeholder={t('directory.hub.ws_name_placeholder')}
                className="border-border bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="text-muted-foreground">
                {t('directory.hub.admin_email_label')}
              </Label>
              <Input
                id="adminEmail"
                type="email"
                value={hubAdminEmail}
                onChange={(e) => setHubAdminEmail(e.target.value)}
                placeholder={t('directory.hub.admin_email_placeholder')}
                className="border-border bg-muted/50"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="mb-2 block text-muted-foreground">{t('settings.tabs.modules')}</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* School Module */}
              <div
                onClick={() => handleModuleToggle('school', !selectedModules.school)}
                className={cn(
                  'flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-3 transition-all',
                  selectedModules.school
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/30 hover:border-primary/30',
                )}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'rounded-lg p-2 transition-colors',
                      selectedModules.school
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <School className="h-4 w-4" />
                  </div>
                  <Switch
                    checked={selectedModules.school}
                    onCheckedChange={(c) => handleModuleToggle('school', c)}
                  />
                </div>
                <div>
                  <span className="block text-sm font-bold">
                    {t('settings.modules.school_title')}
                  </span>
                  <span className="line-clamp-1 text-[10px] text-muted-foreground">
                    {t('settings.modules.school_desc')}
                  </span>
                </div>
              </div>

              {/* Assistance Module */}
              <div
                onClick={() => handleModuleToggle('assistance', !selectedModules.assistance)}
                className={cn(
                  'flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-3 transition-all',
                  selectedModules.assistance
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-border bg-muted/30 hover:border-emerald-500/30',
                )}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'rounded-lg p-2 transition-colors',
                      selectedModules.assistance
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <HeartPulse className="h-4 w-4" />
                  </div>
                  <Switch
                    checked={selectedModules.assistance}
                    onCheckedChange={(c) => handleModuleToggle('assistance', c)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
                <div>
                  <span className="block text-sm font-bold">
                    {t('settings.modules.assistance_title')}
                  </span>
                  <span className="line-clamp-1 text-[10px] text-muted-foreground">
                    {t('settings.modules.assistance_desc')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {t('directory.hub.cancel')}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading || !hubWsName || !hubAdminEmail}
            className="bg-primary text-white hover:bg-primary/80 dark:bg-[#0F1115] dark:hover:bg-[#1A1D24]"
          >
            {isLoading ? t('directory.hub.creating') : t('directory.hub.create_invite')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
