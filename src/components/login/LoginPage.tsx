/**
 * =============================================================================
 * LOGIN PAGE COMPONENT
 * =============================================================================
 * This component replicates the exact Volt login UI design.
 * It features a dark theme with purple accents, custom input fields,
 * and a clean, centered layout.
 * =============================================================================
 */

import React, { useState } from 'react';
import { User, Key, Eye, EyeOff, ArrowRight, Minus, Square, X } from 'lucide-react';
import type { LoginCredentials } from '@/types';

/**
 * Props for the LoginPage component
 */
interface LoginPageProps {
  /** Callback when user submits login form */
  onLogin: (credentials: LoginCredentials) => void;
  /** Loading state during authentication */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
}

/**
 * Volt Logo Component
 * Displays the stylized Volt lightning bolt logo
 */
const VoltLogo: React.FC = () => (
  <div className="flex items-center justify-center mb-6">
    <svg 
      width="48" 
      height="48" 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="transform -rotate-12"
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
    <span className="text-2xl font-bold text-foreground ml-2">Volt</span>
  </div>
);

/**
 * Window Title Bar Component
 * Simulates a native window title bar with controls
 */
const WindowTitleBar: React.FC = () => (
  <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border">
    <div className="flex items-center gap-2">
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="transform -rotate-12"
      >
        <path
          d="M28 4L12 24H22L18 44L36 20H24L28 4Z"
          fill="#8B5CF6"
          stroke="#8B5CF6"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-sm text-muted-foreground">Sign In</span>
    </div>
    
    <div className="flex items-center gap-2">
      <button className="p-1.5 hover:bg-muted rounded transition-colors">
        <Minus className="w-4 h-4 text-muted-foreground" />
      </button>
      <button className="p-1.5 hover:bg-muted rounded transition-colors">
        <Square className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      <button className="p-1.5 hover:bg-red-600 rounded transition-colors">
        <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
      </button>
    </div>
  </div>
);

interface InputFieldProps {
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  toggleButton?: React.ReactNode;
  hasError?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  type,
  value,
  onChange,
  placeholder,
  icon,
  toggleButton,
  hasError,
}) => (
  <div className="relative">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
      {icon}
    </div>
    
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`
        w-full h-12 pl-12 pr-${toggleButton ? '12' : '4'} rounded-lg
        bg-secondary border text-foreground text-sm
        placeholder:text-muted-foreground
        focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
        transition-all duration-200
        ${hasError ? 'border-red-500' : 'border-border'}
      `}
    />
    
    {toggleButton && (
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        {toggleButton}
      </div>
    )}
  </div>
);

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLogin, 
  isLoading = false, 
  error = null 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ email, password });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WindowTitleBar />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-10">
            <VoltLogo />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to Volt
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to access your Lua development environment
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Username or Email
              </label>
              <InputField
                type="text"
                value={email}
                onChange={setEmail}
                placeholder="user@volt.bz"
                icon={<User className="w-5 h-5" />}
                hasError={!!error}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <InputField
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="********"
                icon={<Key className="w-5 h-5" />}
                hasError={!!error}
                toggleButton={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full h-12 rounded-lg
                bg-primary/80 hover:bg-primary/80
                text-foreground font-medium
                flex items-center justify-center gap-2
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Forgot your password?
            </a>
          </div>

          <div className="mt-8 text-center">
            <span className="text-muted-foreground text-sm">
              Don&apos;t have an account?{' '}
            </span>
            <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
              Create one here
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
