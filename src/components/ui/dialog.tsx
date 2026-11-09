import * as Primitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = Primitive.Root
export const DialogTrigger = Primitive.Trigger
export const DialogClose = Primitive.Close
export const DialogTitle = Primitive.Title
export const DialogDescription = Primitive.Description
export function DialogContent({
  children,
  className,
  sheet = false,
  ...props
}: React.ComponentProps<typeof Primitive.Content> & { sheet?: boolean }) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fixed inset-0 z-40 bg-slate-950/25 dark:bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-in" />
      <Primitive.Content
        className={cn(
          'fixed z-50 flex flex-col bg-card p-6 shadow-xl outline-none',
          sheet
            ? 'inset-y-0 right-0 w-full max-w-[420px] overflow-y-auto border-l border-border'
            : 'left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-border',
          className,
        )}
        {...props}
      >
        {children}
        <Primitive.Close
          aria-label="닫기"
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X size={18} />
        </Primitive.Close>
      </Primitive.Content>
    </Primitive.Portal>
  )
}
