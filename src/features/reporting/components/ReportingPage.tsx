import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportForm } from './ReportForm'
import { ReportList } from './ReportList'
import { AlertTriangle, ClipboardList, Send, Shield } from 'lucide-react'

export const ReportingPage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('send')

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('reporting.title')}</h2>
      </div>

      {/* Trust Banner */}
      <div className="flex items-center gap-3 rounded-md bg-emerald-500/10 p-4 border border-emerald-500/20">
        <Shield className="h-5 w-5 text-emerald-500 shrink-0" />
        <p className="text-[13px] font-medium text-emerald-600/90 dark:text-emerald-400/90">
          Alla anmälningar och visselblåsningar krypteras och hanteras strikt konfidentiellt av ledningen. Vid akuta personskador, säkerställ först och främst medicinsk vård.
        </p>
      </div>

      <Tabs value={activeTab} className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="send" className="font-medium">
            {t('reporting.tabs.send')}
          </TabsTrigger>
          <TabsTrigger value="my_reports" className="font-medium">
            {t('reporting.tabs.my_reports')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>
                  {t('reporting.tabs.send')}
                </CardTitle>
                <CardDescription>
                  {t('reporting.form.description_help')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportForm onSuccess={() => setActiveTab('my_reports')} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="my_reports" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>{t('reporting.tabs.my_reports')}</CardTitle>
              <CardDescription>
                {t('reporting.list.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
