import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'

export const ClientHomePage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">
        {t('client_portal.welcome', { name: user?.name })}
      </h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-sidebar p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">{t('client_portal.todays_assistance')}</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('client_portal.assistance_description')}
          </p>
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-secondary p-4 text-sm text-muted-foreground">
            {t('client_portal.no_schedule')}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-sidebar p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">{t('client_portal.messages')}</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('client_portal.messages_description')}
          </p>
          <a
            href="/inbox"
            className="mt-2 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('client_portal.go_to_inbox')}
          </a>
        </div>
      </div>
    </div>
  )
}
