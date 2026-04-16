import React, { useState } from 'react';
import { Key } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

interface PasswordResetPageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSave = async () => {
    setResetLoading(true);
    const { data: { user }, error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { full_name: fullName, phone: phoneNumber }
    });

    if (user) {
      await supabase.from('users').update({
        full_name: fullName,
        phone: phoneNumber
      }).eq('id', user.id);
    }

    setResetLoading(false);
    if (error) {
      alert(t('auth.setup.error_prefix') + error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-sidebar border border-border rounded-xl w-[400px] p-8 shadow-2xl animate-fade-in">
        <div className="flex justify-center text-primary mb-6"><Key className="w-12 h-12" /></div>
        <h2 className="text-foreground text-2xl font-bold text-center mb-2">{t('auth.setup.title')}</h2>
        <p className="text-muted-foreground text-sm text-center mb-8">{t('auth.setup.description')}</p>

        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('auth.setup.full_name')} className="w-full bg-accent border border-border text-foreground rounded-md px-3 py-3 text-sm focus:outline-none focus:border-primary mb-4" />

        <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder={t('auth.setup.phone_optional')} className="w-full bg-accent border border-border text-foreground rounded-md px-3 py-3 text-sm focus:outline-none focus:border-primary mb-4" />

        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('auth.setup.new_password')} className="w-full bg-accent border border-border text-foreground rounded-md px-3 py-3 text-sm focus:outline-none focus:border-primary mb-6" />

        <button disabled={resetLoading || newPassword.length < 6 || !fullName} onClick={handleSave} className="w-full bg-primary hover:bg-primary/80 text-white h-12 rounded-lg font-medium transition-colors disabled:opacity-50">
          {resetLoading ? t('common.saving') : t('auth.setup.save_continue')}
        </button>

        <button
          disabled={resetLoading}
          onClick={onCancel}
          className="w-full mt-3 bg-transparent hover:bg-muted text-muted-foreground h-10 rounded-lg text-sm font-medium transition-colors"
        >
          {t('auth.setup.cancel_logout')}
        </button>
      </div>
    </div>
  );
};
