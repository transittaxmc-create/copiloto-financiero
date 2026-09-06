import { Home, ClipboardList, Camera, BarChart3, Bot } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/register', icon: ClipboardList, label: 'Register' },
    { href: '/expenses', icon: Camera, label: 'Expenses' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/ai', icon: Bot, label: 'AI' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around items-center py-3 z-50">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 ${isActive ? 'text-green-400' : 'text-gray-400'}`}>
            <item.icon size={22} />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
