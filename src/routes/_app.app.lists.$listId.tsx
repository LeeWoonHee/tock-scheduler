import { createFileRoute } from '@tanstack/react-router'
import { TaskScreen } from '@/features/tasks/task-screen'
export const Route = createFileRoute('/_app/app/lists/$listId')({ component: ListPage })
function ListPage() {
  const { listId } = Route.useParams()
  return <TaskScreen key={listId} view="list" listId={listId} />
}
