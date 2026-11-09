import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full min-w-0 rounded-lg border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full resize-y rounded-lg border border-border bg-card p-3 text-sm leading-7 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10',
        className,
      )}
      {...props}
    />
  )
}
export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-9 w-full min-w-0 rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20',
        className,
      )}
      {...props}
    />
  )
}
