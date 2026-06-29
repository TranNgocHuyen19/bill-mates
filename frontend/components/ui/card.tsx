import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'primary' | 'success' | 'destructive' | 'warning'
  hoverable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, accent, hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-card text-card-foreground border border-border rounded-lg p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200",
          accent === 'primary' && 'border-l-4 border-l-primary',
          accent === 'success' && 'border-l-4 border-l-secondary', // Emerald
          accent === 'destructive' && 'border-l-4 border-l-tertiary', // Coral/Red
          accent === 'warning' && 'border-l-4 border-l-amber-500', // Amber
          hoverable && 'hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:border-primary/20 cursor-pointer',
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

export { Card }
