import { isLocalMode } from '../auth/auth.server'
import { LocalRepository } from '../repositories/local.server'
import { PostgresRepository } from '../repositories/postgres.server'
import { TaskService } from './task.service'

export function taskService() {
  return new TaskService(isLocalMode() ? new LocalRepository() : new PostgresRepository())
}
