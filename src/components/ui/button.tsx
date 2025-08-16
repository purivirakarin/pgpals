import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', size = 'md', variant = 'default', ...props }, ref) => {
    const sizeClass = size === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : size === 'lg'
      ? 'px-5 py-3 text-base'
      : 'px-4 py-2 text-sm'

    const variantClass = (
      variant === 'outline' ? 'border border-emerald-400/50 text-emerald-200 hover:bg-emerald-800/50' :
      variant === 'ghost' ? 'bg-transparent text-emerald-200 hover:bg-emerald-800/30' :
      variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' :
      'bg-emerald-600 text-white hover:bg-emerald-700'
    )

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50 ${sizeClass} ${variantClass} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export const buttonVariants = {}


