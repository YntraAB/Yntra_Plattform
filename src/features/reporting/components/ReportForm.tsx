import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Loader2, FileText, Send, UserCheck, ShieldCheck } from 'lucide-react'

interface ReportFormProps {
  onSuccess: () => void
}

export const ReportForm: React.FC<ReportFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const queryClient = useQueryClient()

  const [reportType, setReportType] = useState('complaint')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [dateOfIncident, setDateOfIncident] = useState(new Date().toISOString().split('T')[0])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  React.useEffect(() => {
    const type = searchParams.get('type')
    if (type && ['complaint', 'work_injury', 'incident', 'deviation', 'whistleblower'].includes(type)) {
      setReportType(type)
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('type')
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !user) throw new Error('Missing workspace or user context')

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

      // Attempt to notify admins
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
      } catch (e) {
        console.warn('Admin notification failed, but report was saved:', e)
      }
    },
    onSuccess: () => {
      toast.success(t('reporting.form.success'))
      setSubject('')
      setDescription('')
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      onSuccess()
    },
    onError: (error) => {
      console.error('Report submission failed:', error)
      toast.error(t('reporting.form.error'))
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="report-type" className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
            <FileText className="h-4 w-4 text-primary" />
            {t('reporting.list.type')}
          </Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger id="report-type" className="h-12 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm transition-all focus:ring-4 focus:ring-primary/10">
              <SelectValue placeholder={t('reporting.form.select_type')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50 bg-popover">
              <SelectItem value="complaint">{t('reporting.types.complaint')}</SelectItem>
              <SelectItem value="work_injury">{t('reporting.types.work_injury')}</SelectItem>
              <SelectItem value="incident">{t('reporting.types.incident')}</SelectItem>
              <SelectItem value="deviation">{t('reporting.types.deviation')}</SelectItem>
              <SelectItem value="whistleblower">{t('reporting.types.whistleblower')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="date" className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t('reporting.form.date_of_incident')}
          </Label>
          <Input
            id="date"
            type="date"
            value={dateOfIncident}
            onChange={(e) => setDateOfIncident(e.target.value)}
            className="h-12 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm transition-all focus:ring-4 focus:ring-primary/10"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="subject" className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
          <Send className="h-4 w-4 text-primary" />
          {t('reporting.form.subject')}
        </Label>
        <Input
          id="subject"
          placeholder={t('reporting.form.subject_placeholder')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-12 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm transition-all focus:ring-4 focus:ring-primary/10"
          required
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
          <FileText className="h-4 w-4 text-primary" />
          {t('reporting.form.description')}
        </Label>
        <Textarea
          id="description"
          placeholder={t('reporting.form.description_placeholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[160px] rounded-2xl border-border/60 bg-background/50 backdrop-blur-sm transition-all focus:ring-4 focus:ring-primary/10"
          required
        />
      </div>

      <div className="group flex items-center space-x-3 rounded-2xl border border-border/40 bg-muted/30 p-4 transition-all hover:bg-muted/50">
        <Checkbox
          id="anonymous"
          checked={isAnonymous}
          onCheckedChange={(checked) => setIsAnonymous(checked === true)}
          className="h-5 w-5 rounded-md"
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="anonymous"
            className="flex items-center gap-2 text-sm font-bold leading-none text-foreground/90 transition-colors group-hover:text-primary"
          >
            <UserCheck className="h-3.5 w-3.5" />
            {t('reporting.form.is_anonymous')}
          </Label>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
            {t('reporting.form.anonymous_hint')}
          </p>
        </div>
      </div>

      <Button 
        type="submit" 
        className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] hover:shadow-primary/30 active:scale-[0.99] disabled:opacity-50" 
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t('common.saving')}
          </>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t('reporting.form.submit')}
          </span>
        )}
      </Button>
    </form>
  )
}
