import { HTMLAttributes, useState } from 'react';
import { IconBrandWindows, IconLoader2 } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { useAzureAuthStore } from '@/stores/azureAuthStore';

type AzureAuthFormProps = HTMLAttributes<HTMLFormElement>;

export function AzureAuthForm({ className, ...props }: AzureAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, error, loading } = useAzureAuthStore();

  const handleAzureLogin = async () => {
    setIsLoading(true);
    
    try {
      // Ensure we're in the browser context before attempting login
      if (typeof window === 'undefined') {
        throw new Error('Azure AD login only available in browser context');
      }
      
      const success = await login();
      if (success) {
        console.log('✅ Azure AD login successful, navigating to home');
        navigate({ to: '/' });
      }
    } catch (error) {
      console.error('❌ Azure AD login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isLoadingState = isLoading || loading;

  return (
    <div className={cn('space-y-8', className)} {...props}>
      {error && (
        <div className="animate-in slide-in-from-top duration-300 p-6 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <p className="text-base text-red-200 font-medium">Authentication Error</p>
          </div>
          <p className="text-sm text-red-300/80 mt-2">{error}</p>
        </div>
      )}

      <Button
        onClick={handleAzureLogin}
        disabled={isLoadingState}
        className="signin-button w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed group"
        aria-label={isLoadingState ? "Signing in..." : "Sign in with Microsoft"}
      >
        {isLoadingState ? (
          <div className="flex items-center justify-center">
            <IconLoader2 className="mr-4 h-7 w-7 animate-spin" />
            <span>Signing in...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <IconBrandWindows className="mr-4 h-7 w-7" />
            <span>Continue with Microsoft</span>
          </div>
        )}
      </Button>

      <div className="text-center">
        <a
          href="/forgot-password"
          className="signin-help-link inline-flex items-center text-white/60 hover:text-white/90 transition-colors duration-200 group"
        >
          <span>Need help signing in?</span>
          <svg 
            className="ml-2 w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
} 