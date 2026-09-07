import { Home, ClipboardList, Receipt, ShieldCheck, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/register', icon: ClipboardList, label: 'Viajes' },
    { href: '/expenses', icon: Receipt, label: 'Gastos' },
    { href: '/ezpass', icon: ShieldCheck, label: 'E-ZPass' },
    { href: '/reports', icon: BarChart3, label: 'Reportes' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-800/80 flex justify-around items-center py-2 z-40 px-2">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`flex flex-col items-center gap-1 flex-1 py-1.5 rounded-xl transition-all ${
              isActive ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <item.icon size={20} />
            <span className="text-[10px] tracking-wide font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;
