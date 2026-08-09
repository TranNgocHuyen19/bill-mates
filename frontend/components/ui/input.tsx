import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  trailingIcon?: React.ReactNode
  label?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, trailingIcon, label, error, id, ...props }, ref) => {
    const defaultId = React.useId()
    const inputId = id || defaultId

    const inputElement = (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-muted-foreground pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-hidden focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
            error && 'border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive',
            icon && "pl-10",
            trailingIcon && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {trailingIcon && (
          <div className="absolute right-3 text-muted-foreground pointer-events-none flex items-center justify-center">
            {trailingIcon}
          </div>
        )}
      </div>
    )

    if (label || error) {
      return (
        <div className="space-y-1.5 w-full">
          {label && (
            <label className="text-xs font-semibold text-muted-foreground" htmlFor={inputId}>
              {label}
            </label>
          )}
          {inputElement}
          {error && (
            <p className="text-xs text-destructive mt-1 font-medium">{error}</p>
          )}
        </div>
      )
    }

    return inputElement
  }
)
Input.displayName = 'Input'

export { Input }
