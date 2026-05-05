import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Calendar, MessageSquare, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import { useUnreadNotes } from '@/hooks/useUnreadNotes'

interface DashboardEvent {
  id: string
  title: string
  start_time: string
  end_time: string
}

export const UpcomingEventsWidget: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const [events, setEvents] = useState<DashboardEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      if (!workspaceId || !user) return
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true })
        .limit(3)

      if (data) {
        setEvents(data)
      }
      setLoading(false)
    }

    fetchEvents()
  }, [workspaceId, user])

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          {t('dashboard.upcoming_events', 'Dagens Schema')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.upcoming_events_desc', 'Dina kommande händelser idag')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between">
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          ) : events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="flex flex-col gap-1 rounded-md border p-3">
                <span className="font-medium">{event.title}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t('dashboard.no_events', 'Inga fler händelser idag.')}</p>
          )}
        </div>
        <Button variant="secondary" className="mt-4 w-full gap-2" onClick={() => navigate('/schedule')}>
          {t('dashboard.go_to_schedule', 'Öppna schema')} <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

export const CommunicationsWidget: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const unreadNotes = useUnreadNotes()
  const [unreadMessages, setUnreadMessages] = useState<number>(0)

  useEffect(() => {
    async function fetchUnreadCounts() {
      if (!workspaceId || !user) return
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('is_read', false)
        .neq('sender_id', user.id)

      if (count !== null) setUnreadMessages(count)
    }
    fetchUnreadCounts()
  }, [workspaceId, user])

  const totalUnread = unreadMessages + unreadNotes.total

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          {t('dashboard.communications', 'Kommunikation')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.communications_desc', 'Olästa meddelanden och anteckningar')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between">
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('sidebar.sections.inbox', 'Inkorg')}</span>
            {unreadMessages > 0 ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {unreadMessages}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">0</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('sidebar.sections.notes', 'Anteckningar')}</span>
            {unreadNotes.total > 0 ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {unreadNotes.total}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">0</span>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/inbox')}>
            {t('sidebar.sections.inbox', 'Inkorg')}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate('/notes')}>
            {t('sidebar.sections.notes', 'Anteckningar')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
