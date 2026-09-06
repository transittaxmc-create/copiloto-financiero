"use client";
import { usePathname, useRouter } from "next/navigation";
import { Home, ClipboardList, Camera, TrendingUp, BookOpen, FileText, Settings, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Inicio", icon: Home },
  { path: "/register", label: "Register", icon: ClipboardList },
  { path: "/ezpass", label: "E-ZPass", icon: Camera },
  { path: "/growth", label: "Growth", icon: TrendingUp },
  { path: "/ledger", label: "Ledger", icon: BookOpen },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/ai", label: "AI", icon: Sparkles },
];

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-slate-700/50 bg-slate-900/95 backdrop-blur-md">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-700/50 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500">
          <span className="text-xl font-bold text-white">$</span>
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-slate-50">Copiloto</h1>
          <p className="text-xs text-slate-500">Financiero</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = pathname === path || pathname.startsWith(path + "/");
          return (
            <button
              key={path}
              onClick={() => router.push(path)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                active 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Icon size={20} className={active ? "text-emerald-400" : ""} />
              <span>{label}</span>
              {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-slate-700/50 px-3 py-4 space-y-1">
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-slate-800 hover:text-slate-200">
          <Settings size={20} />
          <span>Settings</span>
        </button>
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-slate-800 hover:text-slate-200">
          <User size={20} />
          <span>Profile</span>
        </button>
      </div>
    </aside>
  );
}