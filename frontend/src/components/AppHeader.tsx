import { IndianRupee, LogIn, LogOut, Loader2 } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const { login, clear, loginStatus, identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border shadow-xs">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0 overflow-hidden">
          <img
            src="/assets/generated/rupee-icon.dim_128x128.png"
            alt="Rupee Tracker"
            className="w-9 h-9 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<span style="font-size:1.25rem">₹</span>';
              }
            }}
          />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-tight text-foreground">
            Rupee Tracker
          </h1>
          <p className="text-xs text-muted-foreground leading-tight">Daily Expense Manager</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 bg-primary/10 rounded-full px-3 py-1">
            <IndianRupee className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
            <span className="text-xs font-bold text-primary">INR</span>
          </div>
          {!isInitializing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAuth}
              disabled={isLoggingIn}
              className="w-8 h-8 rounded-full"
              title={isAuthenticated ? 'Logout' : 'Login'}
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : isAuthenticated ? (
                <LogOut className="w-4 h-4 text-muted-foreground" />
              ) : (
                <LogIn className="w-4 h-4 text-primary" />
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
