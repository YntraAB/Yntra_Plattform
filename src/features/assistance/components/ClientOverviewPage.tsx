import React, { useState, useEffect } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import { Loader2, User, FileText, Pill } from 'lucide-react'
import { JournalTab } from './JournalTab'
import { MedicationTab } from './MedicationTab'

interface Client {
  id: string
  first_name: string
  last_name: string
  personal_number?: string
  care_level?: string
}

export const ClientOverviewPage: React.FC = () => {
  const { selectedTeamId: activeTeam } = useWorkspace()
  const { t } = useTranslation()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'journal' | 'medication'>('journal')

  useEffect(() => {
    const fetchClient = async () => {
      if (!activeTeam) {
        setClient(null)
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const { data } = await supabase
          .from('clients')
          .select('*')
          .eq('team_id', activeTeam)
          .single()

        if (data) setClient(data)
        else setClient(null)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchClient()
  }, [activeTeam])

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center p-8 text-center">
        <User className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <h2 className="mb-2 text-xl font-bold">
          {t('assistance.no_client_linked', 'Ingen Brukare Kopplad')}
        </h2>
        <p className="mx-auto max-w-md text-muted-foreground">
          {t(
            'assistance.no_client_description',
            'Detta team (arbetslag) har ingen brukare associerad till sig. En chef kan lägga till och koppla en brukare till teamet via katalogen (Directory).',
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto h-full w-full max-w-5xl flex-1 overflow-y-auto p-8">
      <div className="mb-6 flex items-start gap-6 rounded-xl border border-border bg-sidebar p-6 shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-[14px] bg-gradient-to-br from-primary to-primary/60 text-3xl font-bold text-primary-foreground shadow-inner">
          {client.first_name.charAt(0)}
          {client.last_name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {client.first_name} {client.last_name}
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {t('assistance.personal_number', 'Personnummer:')}{' '}
            {client.personal_number || t('common.unknown', 'Okänt')}
          </p>
          <div className="mt-4 flex gap-2">
            <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('assistance.care_level', 'Omvårdnadsnivå:')} {client.care_level}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('journal')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'journal' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> {t('assistance.daily_notes', 'Daganteckningar')}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('medication')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'medication' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4" />{' '}
            {t('assistance.active_medication_list', 'Aktiv Medicinlista')}
          </div>
        </button>
      </div>

      {activeTab === 'journal' ? (
        <JournalTab clientId={client.id} />
      ) : (
        <MedicationTab clientId={client.id} />
      )}
    </div>
  )
}
