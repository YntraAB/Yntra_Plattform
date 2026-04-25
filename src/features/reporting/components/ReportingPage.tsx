import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportForm } from './ReportForm'
import { ReportList } from './ReportList'
import { ReportingStats } from './ReportingStats'
import { AlertTriangle, ClipboardList, Send } from 'lucide-react'

export const ReportingPage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('send')

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('reporting.title')}</h2>
      </div>

      <ReportingStats />

      <Tabs value={activeTab} className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            {t('reporting.tabs.send')}
          </TabsTrigger>
          <TabsTrigger value="my_reports" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            {t('reporting.tabs.my_reports')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
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
