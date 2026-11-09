import { create } from 'zustand'

// Only shared navigation state lives here; server data belongs to Query.
export const useUIStore = create<{ sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }>(
  (set) => ({ sidebarOpen: false, setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }) }),
)
