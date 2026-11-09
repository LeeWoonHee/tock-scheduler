import { createFileRoute } from '@tanstack/react-router'
import { TaskScreen } from '@/features/tasks/task-screen'
export const Route = createFileRoute('/_app/app/today')({
  component: () => <TaskScreen view="today" />,
})
