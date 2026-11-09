import * as Primitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
export const Popover = Primitive.Root
export const PopoverTrigger = Primitive.Trigger
export const PopoverClose = Primitive.Close
export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-80 rounded-xl border border-border bg-card p-4 text-sm shadow-lg outline-none',
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  )
}
