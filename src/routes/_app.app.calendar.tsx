import { createFileRoute } from '@tanstack/react-router'
import { CalendarScreen } from '@/features/calendar/calendar-screen'
export const Route = createFileRoute('/_app/app/calendar')({ component: CalendarScreen })
