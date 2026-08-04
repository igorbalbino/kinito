import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon,
  badge,
  className,
}) => {
  return (
    <div className={cn(
      'p-5 rounded-xl border transition-all duration-200 w-full min-w-0',
      'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 shadow-xs',
      className
    )}>
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 break-words">
              {value}
            </h3>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
        </div>
        {icon && (
          <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {(change || subtitle) && (
        <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
          {change && (
            <span className={cn('inline-flex items-center font-medium gap-1', isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {change}
            </span>
          )}
          {subtitle && (
            <span className="text-zinc-500 dark:text-zinc-400 font-normal ml-auto">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
