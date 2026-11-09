import * as Primitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
export function Checkbox({ className, ...props }: React.ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={cn(
        'flex size-[19px] shrink-0 items-center justify-center rounded-md border-[1.5px] border-control bg-card outline-none transition hover:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        className,
      )}
      {...props}
    >
      <Primitive.Indicator>
        <Check size={13} strokeWidth={3} />
      </Primitive.Indicator>
    </Primitive.Root>
  )
}
