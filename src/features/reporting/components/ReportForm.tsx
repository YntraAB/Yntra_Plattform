import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ReportFormProps {
  onSuccess: () => void
}

export const ReportForm: React.FC<ReportFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const [loading, setLoading] = useState(false)

  const [reportType, setReportType] = useState('complaint')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [dateOfIncident, setDateOfIncident] = useState(new Date().toISOString().split('T')[0])
  const [isAnonymous, setIsAnonymous] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || !user) return

    setLoading(true)
    try {
      const { error } = await supabase.from('reports').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        type: reportType,
        is_anonymous: isAnonymous,
        content: {
          subject,
          description,
          date_of_incident: dateOfIncident,
        },
        status: 'pending',
      })

      if (error) throw error

      // Notify admins via internal message
      try {
        const { data: admins } = await supabase
          .from('users')
          .select('id')
          .eq('workspace_id', workspaceId)
          .in('role', ['admin', 'platform_admin'])

        if (admins && admins.length > 0) {
          const messagePayloads = admins.map(admin => ({
            workspace_id: workspaceId,
            sender_id: user.id,
            receiver_id: admin.id,
            subject: t('reporting.notifications.admin_subject', { type: t(`reporting.types.${reportType}`) }),
            body: t('reporting.notifications.admin_body', { 
              type: t(`reporting.types.${reportType}`),
              subject
            }),
            is_read: false
          }))
          
          await supabase.from('messages').insert(messagePayloads)
        }
      } catch (msgError) {
        console.error('Failed to notify admins:', msgError)
        // We don't throw here as the report was already saved successfully
      }

      toast.success(t('reporting.form.success'))
      setSubject('')
      setDescription('')
      onSuccess()
    } catch (error: any) {
      console.error('Error sending report:', error)
      toast.error(t('reporting.form.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="report-type">{t('reporting.list.type')}</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger id="report-type" className="bg-background/50 border-border/50">
              <SelectValue placeholder={t('reporting.form.select_type')} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/50">
              <SelectItem value="complaint">{t('reporting.types.complaint')}</SelectItem>
              <SelectItem value="work_injury">{t('reporting.types.work_injury')}</SelectItem>
              <SelectItem value="incident">{t('reporting.types.incident')}</SelectItem>
              <SelectItem value="deviation">{t('reporting.types.deviation')}</SelectItem>
              <SelectItem value="whistleblower">{t('reporting.types.whistleblower')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">{t('reporting.form.date_of_incident')}</Label>
          <Input
            id="date"
            type="date"
            value={dateOfIncident}
            onChange={(e) => setDateOfIncident(e.target.value)}
            className="bg-background/50 border-border/50"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">{t('reporting.form.subject')}</Label>
        <Input
          id="subject"
          placeholder={t('reporting.form.subject_placeholder', 'Kort sammanfattning...')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="bg-background/50 border-border/50"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('reporting.form.description')}</Label>
        <Textarea
          id="description"
          placeholder={t('reporting.form.description_placeholder', 'Beskriv händelsen eller dina synpunkter i detalj...')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[150px] bg-background/50 border-border/50"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="anonymous"
          checked={isAnonymous}
          onCheckedChange={(checked) => setIsAnonymous(checked === true)}
        />
        <Label
          htmlFor="anonymous"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t('reporting.form.is_anonymous')}
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('common.saving')}
          </>
        ) : (
          t('reporting.form.submit')
        )}
      </Button>
    </form>
  )
}
