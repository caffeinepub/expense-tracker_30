import { History, PlusCircle, RotateCcw, Target } from "lucide-react";

type Tab = "add" | "history" | "repay" | "budget";

interface BottomNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "add",
      label: "Add",
      icon: (
        <PlusCircle
          className={`w-5 h-5 transition-all ${activeTab === "add" ? "scale-110" : ""}`}
          strokeWidth={activeTab === "add" ? 2.5 : 1.8}
        />
      ),
    },
    {
      id: "history",
      label: "History",
      icon: (
        <History
          className={`w-5 h-5 transition-all ${activeTab === "history" ? "scale-110" : ""}`}
          strokeWidth={activeTab === "history" ? 2.5 : 1.8}
        />
      ),
    },
    {
      id: "repay",
      label: "Repay",
      icon: (
        <RotateCcw
          className={`w-5 h-5 transition-all ${activeTab === "repay" ? "scale-110" : ""}`}
          strokeWidth={activeTab === "repay" ? 2.5 : 1.8}
        />
      ),
    },
    {
      id: "budget",
      label: "Budget",
      icon: (
        <Target
          className={`w-5 h-5 transition-all ${activeTab === "budget" ? "scale-110" : ""}`}
          strokeWidth={activeTab === "budget" ? 2.5 : 1.8}
        />
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border max-w-lg mx-auto"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex">
        {tabs.map((tab, index) => (
          <div key={tab.id} className="flex flex-1 items-stretch">
            {index > 0 && <div className="w-px bg-border my-2" />}
            <button
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-all relative ${
                activeTab === tab.id ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label={tab.label}
              data-ocid={tab.id === "budget" ? "budget.tab" : undefined}
            >
              {activeTab === tab.id && (
                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-b-full" />
              )}
              {tab.icon}
              <span className="text-[10px] font-semibold leading-tight text-center">
                {tab.label}
              </span>
            </button>
          </div>
        ))}
      </div>
    </nav>
  );
}
