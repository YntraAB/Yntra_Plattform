import React, { useState } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AdminInviteModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string | null
  selectedWorkspace: string | null
}

export const AdminInviteModal: React.FC<AdminInviteModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  selectedWorkspace,
}) => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInvite = async () => {
    const targetWS = selectedWorkspace || workspaceId
    if (!targetWS) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('invite_user', {
        body: {
          email: email,
          role: 'admin',
          workspaceId: targetWS,
        },
      })

      if (error) throw error
      if (data && data.success === false) throw new Error(data.error)

      toast.success(t('directory.admin_invite.success'))
      onClose()
      setEmail('')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('directory.members.delete_error')
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-sidebar sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" /> {t('directory.admin_invite.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">{t('directory.admin_invite.desc')}</p>
          <div className="space-y-2">
            <Label htmlFor="adminEmail" className="text-muted-foreground">
              {t('directory.invite.email_label')}
            </Label>
            <Input
              id="adminEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('directory.invite.email_placeholder')}
              className="border-border bg-background"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            {t('directory.hub.cancel')}
          </Button>
          <Button
            onClick={handleInvite}
            disabled={isLoading || !email}
            className="bg-primary text-primary-foreground"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('directory.invite.send_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
