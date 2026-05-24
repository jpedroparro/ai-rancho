import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'green' | 'blue' | 'amber' | 'rose'
}

const colors = {
  green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'green' }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2.5 rounded-lg', colors[color])}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', trend.value >= 0
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
          )}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}
