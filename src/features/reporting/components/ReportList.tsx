import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, MessageSquare, ShieldAlert, Eye, Filter, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { sv, enUS } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Report {
  id: string
  type: string
  content: any
  status: string
  is_anonymous: boolean
  created_at: string
  user?: {
    full_name: string
  }
}

export const ReportList: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin' || user?.role === 'platform_admin'

  const fetchReports = useCallback(async () => {
    if (!workspaceId || !user) return
    setLoading(true)
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          user:users(full_name)
        `)
        .eq('workspace_id', workspaceId)

      if (!isAdmin) {
        query = query.eq('user_id', user.id)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, user, isAdmin, statusFilter, typeFilter])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    setUpdatingStatus(reportId)
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId)

      if (error) throw error

      toast.success(t('reporting.status_updated'))

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r))
      if (selectedReport?.id === reportId) {
        setSelectedReport(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error(t('reporting.status_error'))
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{t('reporting.status.pending')}</Badge>
      case 'reviewed':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t('reporting.status.reviewed')}</Badge>
      case 'resolved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">{t('reporting.status.resolved')}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const locale = i18n.language === 'sv' ? sv : enUS

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-muted/30 p-4 rounded-lg border border-border/50">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('common.filter')}:</span>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-background/50">
              <SelectValue placeholder={t('reporting.list.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all_teams')}</SelectItem>
              <SelectItem value="pending">{t('reporting.status.pending')}</SelectItem>
              <SelectItem value="reviewed">{t('reporting.status.reviewed')}</SelectItem>
              <SelectItem value="resolved">{t('reporting.status.resolved')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px] bg-background/50">
              <SelectValue placeholder={t('reporting.list.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all_teams')}</SelectItem>
              <SelectItem value="complaint">{t('reporting.types.complaint')}</SelectItem>
              <SelectItem value="work_injury">{t('reporting.types.work_injury')}</SelectItem>
              <SelectItem value="incident">{t('reporting.types.incident')}</SelectItem>
              <SelectItem value="deviation">{t('reporting.types.deviation')}</SelectItem>
              <SelectItem value="whistleblower">{t('reporting.types.whistleblower')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg">
          <MessageSquare className="mb-2 h-10 w-10 opacity-20" />
          <p>{t('reporting.list.empty')}</p>
        </div>
      ) : (
        <div className="rounded-md border border-border/50 bg-card/30">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>{t('reporting.list.type')}</TableHead>
                <TableHead>{t('reporting.list.reporter')}</TableHead>
                <TableHead>{t('reporting.form.subject')}</TableHead>
                <TableHead>{t('reporting.list.date')}</TableHead>
                <TableHead>{t('reporting.list.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} className="border-border/50 group hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {report.is_anonymous && (
                        <ShieldAlert className="h-3 w-3 text-primary" />
                      )}
                      {t(`reporting.types.${report.type}`)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.is_anonymous ? (
                      <span className="text-muted-foreground italic">{t('messages.anonymous')}</span>
                    ) : (
                      report.user?.full_name || 'System'
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {report.content.subject}
                  </TableCell>
                  <TableCell>
                    {format(new Date(report.created_at), 'PPP', { locale })}
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedReport(report)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px] bg-sidebar border-border/50">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {report.is_anonymous && (
                              <ShieldAlert className="h-5 w-5 text-primary" />
                            )}
                            {t(`reporting.types.${report.type}`)}
                          </DialogTitle>
                          <DialogDescription>
                            {format(new Date(report.created_at), 'PPPP HH:mm', { locale })}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                {t('reporting.form.subject')}
                              </h4>
                              <p className="text-sm font-medium">{report.content.subject}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                {t('reporting.list.status')}
                              </h4>
                              {getStatusBadge(report.status)}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              {t('reporting.form.description')}
                            </h4>
                            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md border border-border/50">
                              {report.content.description}
                            </p>
                          </div>

                          {report.content.date_of_incident && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                {t('reporting.form.date_of_incident')}
                              </h4>
                              <p className="text-sm">
                                {report.content.date_of_incident}
                              </p>
                            </div>
                          )}

                          {isAdmin && (
                            <div className="pt-4 border-t border-border/50 space-y-3">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('reporting.admin.manage_status')}
                              </h4>
                              <div className="flex items-center gap-3">
                                <Select 
                                  value={report.status} 
                                  onValueChange={(val) => handleStatusChange(report.id, val)}
                                  disabled={updatingStatus === report.id}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('reporting.admin.select_status')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">{t('reporting.status.pending')}</SelectItem>
                                    <SelectItem value="reviewed">{t('reporting.status.reviewed')}</SelectItem>
                                    <SelectItem value="resolved">{t('reporting.status.resolved')}</SelectItem>
                                  </SelectContent>
                                </Select>
                                {updatingStatus === report.id && (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
