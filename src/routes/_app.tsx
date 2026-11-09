import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { getSessionFn } from '@/server/functions/auth'
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const session = await getSessionFn()
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
    return { session }
  },
  component: Outlet,
})
