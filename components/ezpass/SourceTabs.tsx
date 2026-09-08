'use client';

import type { EZPassSource } from '@/lib/ezpass-types';
import { SOURCE_CONFIG } from '@/lib/ezpass-types';
import { cn } from '@/lib/utils';

interface Props {
  activeTab: EZPassSource | 'all';
  onTabChange: (tab: EZPassSource | 'all') => void;
  counts: Record<EZPassSource | 'all', number>;
}

const tabs: (EZPassSource | 'all')[] = ['all', 'gps', 'screenshot', 'ezpass_statement', 'company_invoice'];

export default function SourceTabs({ activeTab, onTabChange, counts }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map((tab) => {
        const config = tab === 'all' ? { label: 'Todos', icon: '📋', color: 'text-slate-300' } : SOURCE_CONFIG[tab];
        const isActive = activeTab === tab;
        const count = counts[tab] || 0;

        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
              isActive
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
            )}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
            {count > 0 && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-slate-600 text-slate-200' : 'bg-slate-700/50 text-slate-500'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}