import { mkdir, open, readFile, rename, unlink, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { WorkspaceState } from '@/features/tasks/types'
import { emptyWorkspace, type Actor, type WorkspaceRepository } from './types'

/** Development adapter only. The lock also serializes different Vite worker processes. */
export class LocalRepository implements WorkspaceRepository {
  constructor(private file = resolve(process.env.LOCAL_DATA_FILE ?? '.data/dayflow.json')) {}
  private async locked<T>(run: () => Promise<T>): Promise<T> {
    await mkdir(dirname(this.file), { recursive: true })
    const lock = `${this.file}.lock`,
      deadline = Date.now() + 10000
    let handle
    while (!handle) {
      try {
        handle = await open(lock, 'wx', 0o600)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
        try {
          if (Date.now() - (await stat(lock)).mtimeMs > 30000) await unlink(lock)
        } catch {
          /* Another worker released it. */
        }
        if (Date.now() > deadline) throw new Error('Local storage lock timed out')
        await new Promise((resolve) => setTimeout(resolve, 15))
      }
    }
    try {
      return await run()
    } finally {
      await handle.close()
      await unlink(lock)
    }
  }
  async transaction<T>(actor: Actor, run: (state: WorkspaceState) => T | Promise<T>): Promise<T> {
    return this.locked(async () => {
      let store: Record<string, WorkspaceState>
      try {
        store = JSON.parse(await readFile(this.file, 'utf8'))
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
        store = {}
      }
      const state = store[actor.id] ?? emptyWorkspace(actor)
      const result = await run(state)
      store[actor.id] = state
      const temporary = `${this.file}.${crypto.randomUUID()}.tmp`
      await import('node:fs/promises').then((fs) =>
        fs.writeFile(temporary, JSON.stringify(store), { mode: 0o600 }),
      )
      await rename(temporary, this.file)
      return structuredClone(result)
    })
  }
  read(actor: Actor) {
    return this.transaction(actor, (state) => structuredClone(state))
  }
}
