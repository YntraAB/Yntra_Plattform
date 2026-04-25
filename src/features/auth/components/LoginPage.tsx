import React from 'react';
import { ArrowRight, Loader2, Minus, Square, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SocialAuthProvider } from '@/types';

interface LoginPageProps {
  onLogin: (provider: SocialAuthProvider) => void;
  pendingProvider?: SocialAuthProvider | null;
  error?: string | null;
}

const VoltLogo: React.FC = () => (
  <div className="mb-6 flex items-center justify-center">
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="-rotate-12 transform"
    >
      <path
        d="M28 4L12 24H22L18 44L36 20H24L28 4Z"
        fill="url(#volt-gradient)"
        stroke="url(#volt-gradient)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="volt-gradient" x1="12" y1="4" x2="36" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
    </svg>
    <span className="ml-2 text-2xl font-bold text-foreground" data-testid="volt-logo">Volt</span>
  </div>
);

const WindowTitleBar: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
      <div className="flex items-center gap-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="-rotate-12 transform"
        >
          <path
            d="M28 4L12 24H22L18 44L36 20H24L28 4Z"
            fill="#8B5CF6"
            stroke="#8B5CF6"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm text-muted-foreground">{t('auth.login.sign_in')}</span>
      </div>

      <div className="flex items-center gap-2">
        <button className="rounded p-1.5 transition-colors hover:bg-muted" type="button">
          <Minus className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="rounded p-1.5 transition-colors hover:bg-muted" type="button">
          <Square className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button className="rounded p-1.5 transition-colors hover:bg-red-600" type="button">
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>
  );
};

const providerIcon: Record<SocialAuthProvider, React.ReactNode> = {
  google: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.5-.2-2.2H12Z" />
      <path fill="#34A853" d="M12 21c2.5 0 4.6-.8 6.1-2.2L15 16.4c-.8.5-1.8.8-3 .8-2.3 0-4.3-1.6-5-3.8H3.8v2.5A9.2 9.2 0 0 0 12 21Z" />
      <path fill="#FBBC05" d="M7 13.4a5.5 5.5 0 0 1 0-3.4V7.5H3.8a9.2 9.2 0 0 0 0 8.4L7 13.4Z" />
      <path fill="#4285F4" d="M12 6.8c1.3 0 2.4.4 3.3 1.3l2.5-2.5A9 9 0 0 0 12 3 9.2 9.2 0 0 0 3.8 7.5L7 10c.7-2.2 2.7-3.2 5-3.2Z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-1.9.9-1.9 1.8V12h3.3l-.5 3.5H14v8.4A12 12 0 0 0 24 12Z"
      />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M16.7 12.8c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.8-1.6 0-3.1.9-3.9 2.3-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.2-.9-2.2-3.7Zm-2.4-7c.6-.8 1-1.9.9-3-1 .1-2.2.7-2.9 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.3-.6 3-1.4Z" />
    </svg>
  ),
};

function SocialButton({
  provider,
  label,
  description,
  isPending,
  onClick,
}: {
  provider: SocialAuthProvider;
  label: string;
  description: string;
  isPending: boolean;
  onClick: (provider: SocialAuthProvider) => void;
}) {
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => onClick(provider)}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary/80 px-4 py-4 text-left transition-all duration-200 hover:border-primary/60 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground shadow-inner">
          {providerIcon[provider]}
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  pendingProvider = null,
  error = null,
}) => {
  const { t } = useTranslation();

  const loginProviders: Array<{
    provider: SocialAuthProvider;
    label: string;
    description: string;
  }> = [
    {
      provider: 'google',
      label: t('auth.login.google_label'),
      description: t('auth.login.google_desc')
    },
    {
      provider: 'facebook',
      label: t('auth.login.facebook_label'),
      description: t('auth.login.facebook_desc')
    },
    {
      provider: 'apple',
      label: t('auth.login.apple_label'),
      description: t('auth.login.apple_desc')
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <WindowTitleBar />

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-10 text-center">
            <VoltLogo />
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              {t('auth.login.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('auth.login.subtitle')}
            </p>
          </div>

          <div className="space-y-3">
            {loginProviders.map(({ provider, label, description }) => (
              <SocialButton
                key={provider}
                provider={provider}
                label={label}
                description={description}
                isPending={pendingProvider === provider}
                onClick={onLogin}
              />
            ))}
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.login.footer_info')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

