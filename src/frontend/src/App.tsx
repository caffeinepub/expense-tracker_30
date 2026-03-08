import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, IndianRupee, Loader2, LogIn, User } from "lucide-react";
import { useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BottomNavigation } from "./components/BottomNavigation";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "./hooks/useQueries";
import { AddExpense } from "./pages/AddExpense";
import { BudgetGoals } from "./pages/BudgetGoals";
import { History } from "./pages/History";
import { RepayReport } from "./pages/RepayReport";

type Tab = "add" | "history" | "repay" | "budget";

function ProfileSetupModal({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await saveProfile.mutateAsync({ name: name.trim() });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mx-auto mb-4">
          <User className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-display font-bold text-xl text-center text-foreground mb-1">
          Welcome to Rupee Tracker!
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-5">
          Please enter your name to get started.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="profile-name"
              className="text-sm font-semibold text-foreground"
            >
              Your Name
            </Label>
            <Input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="h-11 text-sm"
              autoFocus
              required
            />
          </div>
          <Button
            type="submit"
            disabled={!name.trim() || saveProfile.isPending}
            className="w-full h-11 font-bold rounded-xl"
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Get Started"
            )}
          </Button>
          {saveProfile.isError && (
            <p className="text-xs text-destructive text-center">
              Failed to save profile. Please try again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const appId = encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "rupee-tracker",
  );

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6 overflow-hidden">
          <img
            src="/assets/generated/rupee-icon.dim_128x128.png"
            alt="Rupee Tracker"
            className="w-16 h-16 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<span style="font-size:2rem">₹</span>';
              }
            }}
          />
        </div>
        <h1 className="font-display font-bold text-3xl text-foreground mb-2 text-center">
          Rupee Tracker
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-10">
          Your personal daily expense manager
        </p>

        <div className="w-full max-w-xs space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <IndianRupee
                  className="w-4 h-4 text-primary"
                  strokeWidth={2.5}
                />
              </div>
              <p className="text-sm text-foreground font-medium">
                Track daily expenses easily
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm">📊</span>
              </div>
              <p className="text-sm text-foreground font-medium">
                View history & reports
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm">💸</span>
              </div>
              <p className="text-sm text-foreground font-medium">
                Manage repayments
              </p>
            </div>
          </div>

          <Button
            onClick={() => login()}
            disabled={isLoggingIn}
            className="w-full h-12 font-bold rounded-xl text-sm"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Login to Continue
              </>
            )}
          </Button>
        </div>
      </div>

      <footer className="px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          Built with <Heart className="w-3 h-3 text-primary fill-primary" />{" "}
          using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            caffeine.ai
          </a>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          © {new Date().getFullYear()} Rupee Tracker
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("add");
  const { identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
    isError: profileError,
    isTimedOut: profileTimedOut,
  } = useGetCallerUserProfile();

  const appId = encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "rupee-tracker",
  );

  // Show loading spinner while initializing identity (this is fast, local storage check)
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // If profile fetch timed out or errored, fall back to login screen so user can retry
  if (profileTimedOut || profileError) {
    return <LoginScreen />;
  }

  // Show loading while fetching profile (bounded by timeout above)
  if (profileLoading && !profileFetched) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // Show profile setup if authenticated but no profile yet
  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <ProfileSetupModal
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
          }}
        />
      )}

      {/* Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === "add" && <AddExpense />}
        {activeTab === "history" && <History />}
        {activeTab === "repay" && <RepayReport />}
        {activeTab === "budget" && <BudgetGoals />}

        {/* Footer Attribution */}
        <footer className="px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            Built with <Heart className="w-3 h-3 text-primary fill-primary" />{" "}
            using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              caffeine.ai
            </a>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            © {new Date().getFullYear()} Rupee Tracker
          </p>
        </footer>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
