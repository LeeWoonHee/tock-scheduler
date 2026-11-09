import { createFileRoute } from '@tanstack/react-router'
import { TaskScreen } from '@/features/tasks/task-screen'
export const Route = createFileRoute('/_app/app/upcoming')({
  component: () => <TaskScreen view="upcoming" />,
})
