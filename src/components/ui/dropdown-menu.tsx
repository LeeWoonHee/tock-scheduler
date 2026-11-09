import * as Primitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
export const DropdownMenu = Primitive.Root
export const DropdownMenuTrigger = Primitive.Trigger
export const DropdownMenuSeparator = () => <Primitive.Separator className="my-1 h-px bg-border" />
export function DropdownMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={6}
        align="end"
        className={cn(
          'z-50 min-w-44 rounded-xl border border-border bg-card p-1.5 shadow-lg',
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  )
}
export function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none focus:bg-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        className,
      )}
      {...props}
    />
  )
}
