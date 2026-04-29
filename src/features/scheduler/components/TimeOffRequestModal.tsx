import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Calendar } from 'lucide-react'
import { useCreateReport } from '@/hooks/queries/useReporting'
import { userService } from '@/services/userService'
import { messageService, type SendMessagePayload } from '@/services/messageService'

interface TimeOffRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export const TimeOffRequestModal: React.FC<TimeOffRequestModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  
  const [leaveType, setLeaveType] = useState('vacation')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('')

  const createReportMutation = useCreateReport()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || !user) return

    try {
      await createReportMutation.mutateAsync({
        workspace_id: workspaceId,
        user_id: user.id,
        type: 'leave_request',
        is_anonymous: false,
        content: {
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          description: reason,
          subject: `${t(`reporting.leave_types.${leaveType}`)}: ${startDate} - ${endDate}`,
        },
        status: 'pending',
      })

      try {
        const admins = await userService.getWorkspaceAdmins(workspaceId)

        if (admins && admins.length > 0) {
          const messagePayloads: SendMessagePayload[] = admins.map(admin => ({
            workspace_id: workspaceId,
            sender_id: user.id,
            receiver_id: admin.id,
            subject: t('reporting.notifications.admin_subject', { type: t('reporting.types.leave_request') }),
            body: t('reporting.notifications.admin_body', {
              type: t('reporting.types.leave_request'),
              subject: `${t(`reporting.leave_types.${leaveType}`)} (${startDate} till ${endDate})`
            }),
            is_read: false
          }))

          await messageService.sendMessages(messagePayloads)
        }
      } catch (msgError) {
        console.error('Failed to notify admins:', msgError)
      }

      toast.success(t('reporting.form.success'))
      onClose()
    } catch (error: any) {
      console.error('Error sending leave request:', error)
      toast.error(t('reporting.form.error'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-sidebar border-border/50 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            {t('reporting.types.leave_request')}
          </DialogTitle>
          <DialogDescription>
            {t('reporting.form.description_help')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="leave-type">{t('reporting.list.type')}</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger id="leave-type" className="bg-background/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50">
                <SelectItem value="vacation">{t('reporting.leave_types.vacation')}</SelectItem>
                <SelectItem value="sick_leave">{t('reporting.leave_types.sick_leave')}</SelectItem>
                <SelectItem value="care_of_child">{t('reporting.leave_types.care_of_child')}</SelectItem>
                <SelectItem value="other">{t('reporting.leave_types.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">{t('common.start_date')}</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background/50 border-border/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">{t('common.end_date')}</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background/50 border-border/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">{t('reporting.form.description')}</Label>
            <Textarea
              id="reason"
              placeholder={t('scheduler.description_placeholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] bg-background/50 border-border/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createReportMutation.isPending} className="px-8">
              {createReportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('reporting.form.submit')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
