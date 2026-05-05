import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { UpcomingEventsWidget, CommunicationsWidget } from './Widgets'
// Force Vite HMR reload
import { ReportTimeDialog } from '@/features/time/components/ReportTimeDialog'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isReportTimeOpen, setIsReportTimeOpen] = React.useState(false)
  
  // Format current date nicely
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-background p-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {today}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t('dashboard.welcome', 'Välkommen tillbaka')}, {user?.name || user?.email}
            </h1>
          </div>
          <Button 
            onClick={() => setIsReportTimeOpen(true)}
            className="shrink-0 gap-2 border-emerald-700 bg-emerald-600 font-bold text-white shadow-md hover:bg-emerald-700"
          >
            <Clock className="h-4 w-4" />
            {t('timereports.report_time_btn', 'Rapportera tid')}
          </Button>
        </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-2">
          <UpcomingEventsWidget />
        </div>
        <div className="col-span-1">
          <CommunicationsWidget />
        </div>
        {/* We can add more widgets like AdminTasksWidget here in the future */}
      </div>

      <ReportTimeDialog open={isReportTimeOpen} onOpenChange={setIsReportTimeOpen} />
    </div>
  )
}
