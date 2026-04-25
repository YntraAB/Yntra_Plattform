import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, FileText } from 'lucide-react'

export const ReportingStats: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0
  })

  useEffect(() => {
    async function fetchStats() {
      if (!workspaceId || !user) return

      const isAdmin = user.role === 'admin' || user.role === 'platform_admin'
      let query = supabase
        .from('reports')
        .select('status', { count: 'exact' })
        .eq('workspace_id', workspaceId)

      if (!isAdmin) {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query

      if (!error && data) {
        const total = data.length
        const pending = data.filter(r => r.status === 'pending').length
        const resolved = data.filter(r => r.status === 'resolved').length
        setStats({ total, pending, resolved })
      }
    }

    fetchStats()
  }, [workspaceId, user])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('reporting.stats.total')}</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('reporting.status.pending')}</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('reporting.status.resolved')}</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
        </CardContent>
      </Card>
    </div>
  )
}
