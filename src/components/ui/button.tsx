import type { ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const variants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-foreground hover:bg-secondary/75',
        ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        outline: 'border border-border bg-card hover:bg-secondary',
        destructive: 'bg-destructive-background text-destructive hover:bg-destructive/15',
      },
      size: { default: 'h-10 px-4', sm: 'h-8 px-3 text-xs', icon: 'size-9', lg: 'h-12 px-6' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)
export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants>) {
  return <button className={cn(variants({ variant, size }), className)} {...props} />
}
