"use client";
import { usePathname, useRouter } from "next/navigation";
import { Home, ClipboardList, Camera, TrendingUp, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Inicio", icon: Home },
  { path: "/register", label: "Register", icon: ClipboardList },
  { path: "/ezpass", label: "E-ZPass", icon: Camera },
  { path: "/growth", label: "Growth", icon: TrendingUp },
  { path: "/ledger", label: "Ledger", icon: BookOpen },
];

export function BottomNav(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)]">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = pathname === path || pathname.startsWith(path + "/");
          return (
            <button key={path} onClick={() => router.push(path)} className={cn("relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-all active:scale-95", active ? "text-emerald-400" : "text-slate-500 hover:text-slate-300")} aria-current={active ? "page" : undefined}>
              {active && <span className="absolute -top-1 h-0.5 w-8 rounded-full bg-emerald-400" />}
              <Icon size={active ? 22 : 20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}