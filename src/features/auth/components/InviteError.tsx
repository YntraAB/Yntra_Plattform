import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InviteErrorProps {
  error: string;
  onClose: () => void;
}

export const InviteError: React.FC<InviteErrorProps> = ({ error, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-sidebar border border-border rounded-xl w-[400px] p-8 shadow-2xl animate-fade-in text-center">
        <div className="flex justify-center text-red-500 mb-6">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h2 className="text-foreground text-xl font-bold mb-4">{t('auth.invite_error.title')}</h2>
        <p className="text-muted-foreground text-sm mb-8">{error}</p>
        <button
          onClick={onClose}
          className="w-full bg-primary hover:bg-primary/80 text-white h-12 rounded-lg font-medium transition-colors"
        >
          {t('auth.invite_error.back_to_login')}
        </button>
      </div>
    </div>
  );
};
