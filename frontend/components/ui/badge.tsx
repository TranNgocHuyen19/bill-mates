import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'destructive' | 'warning' | 'info' | 'secondary' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold select-none transition-colors border",
        // Low-saturation background, high-saturation text as per DESIGN.md guidelines
        variant === 'default' && 'bg-primary/5 text-primary border-primary/10',
        variant === 'secondary' && 'bg-secondary/10 text-secondary border-secondary/20',
        variant === 'outline' && 'bg-transparent text-muted-foreground border-border',
        variant === 'success' && 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
        variant === 'destructive' && 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',
        variant === 'warning' && 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
        variant === 'info' && 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
        className
      )}
      {...props}
    />
  )
}
