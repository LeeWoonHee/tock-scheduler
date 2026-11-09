import { sql } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  date,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  foreignKey,
  check,
} from 'drizzle-orm/pg-core'

export const user = pgTable('auth_user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
export const session = pgTable('auth_session', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})
export const account = pgTable(
  'auth_account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('account_provider_unique').on(table.providerId, table.accountId)],
)
export const verification = pgTable('auth_verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
export const workspaces = pgTable(
  'workspaces',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => user.id),
    name: text('name').notNull(),
    timeZone: text('time_zone').notNull().default('Asia/Seoul'),
  },
  (table) => [uniqueIndex('personal_workspace_owner').on(table.ownerId)],
)
export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('owner'),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.userId] })],
)
export const lists = pgTable(
  'lists',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: text('kind').$type<'inbox' | 'list'>().notNull(),
    color: text('color').notNull(),
    position: doublePrecision('position').notNull(),
  },
  (table) => [
    uniqueIndex('list_workspace_identity').on(table.id, table.workspaceId),
    uniqueIndex('one_inbox_per_workspace')
      .on(table.workspaceId)
      .where(sql`${table.kind} = 'inbox'`),
    check('list_kind', sql`${table.kind} in ('inbox','list')`),
  ],
)
export const sections = pgTable(
  'sections',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    listId: text('list_id').notNull(),
    name: text('name').notNull(),
    position: doublePrecision('position').notNull(),
  },
  (table) => [
    uniqueIndex('section_workspace_list_identity').on(table.id, table.workspaceId, table.listId),
    foreignKey({
      columns: [table.listId, table.workspaceId],
      foreignColumns: [lists.id, lists.workspaceId],
    }).onDelete('cascade'),
  ],
)
export const tasks = pgTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    listId: text('list_id').notNull(),
    sectionId: text('section_id'),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    status: text('status').$type<'open' | 'done'>().notNull().default('open'),
    priority: integer('priority').$type<0 | 1 | 2 | 3>().notNull().default(0),
    position: doublePrecision('position').notNull(),
    version: integer('version').notNull().default(1),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
  },
  (table) => [
    uniqueIndex('task_workspace_identity').on(table.id, table.workspaceId),
    foreignKey({
      columns: [table.listId, table.workspaceId],
      foreignColumns: [lists.id, lists.workspaceId],
    }),
    foreignKey({
      columns: [table.sectionId, table.workspaceId, table.listId],
      foreignColumns: [sections.id, sections.workspaceId, sections.listId],
    }),
    check('task_status', sql`${table.status} in ('open','done')`),
    check(
      'completed_task_timestamp',
      sql`(${table.status} = 'done') = (${table.completedAt} is not null)`,
    ),
    check('task_priority', sql`${table.priority} between 0 and 3`),
    check('task_version', sql`${table.version} > 0`),
    index('task_workspace_status_completed').on(table.workspaceId, table.status, table.completedAt),
    index('task_list_section_position').on(table.listId, table.sectionId, table.position),
  ],
)
export const taskSchedules = pgTable(
  'task_schedules',
  {
    taskId: text('task_id')
      .primaryKey()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<'allDay' | 'timed'>().notNull(),
    startDate: date('start_date'),
    endDateExclusive: date('end_date_exclusive'),
    startAt: timestamp('start_at', { withTimezone: true, mode: 'string' }),
    endAt: timestamp('end_at', { withTimezone: true, mode: 'string' }),
    zoneId: text('zone_id'),
  },
  (table) => [
    check(
      'schedule_shape',
      sql`(${table.kind} = 'allDay' and ${table.startDate} is not null and ${table.endDateExclusive} > ${table.startDate} and ${table.startAt} is null and ${table.endAt} is null and ${table.zoneId} is null) or (${table.kind} = 'timed' and ${table.startDate} is null and ${table.endDateExclusive} is null and ${table.startAt} is not null and ${table.zoneId} is not null and (${table.endAt} is null or ${table.endAt} > ${table.startAt}))`,
    ),
    index('schedule_dates').on(table.startDate, table.endDateExclusive),
    index('schedule_instants').on(table.startAt, table.endAt),
  ],
)
export const tags = pgTable(
  'tags',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    color: text('color').notNull(),
  },
  (table) => [
    uniqueIndex('tag_workspace_name').on(table.workspaceId, table.normalizedName),
    uniqueIndex('tag_workspace_identity').on(table.id, table.workspaceId),
  ],
)
export const taskTags = pgTable(
  'task_tags',
  {
    taskId: text('task_id').notNull(),
    tagId: text('tag_id').notNull(),
    workspaceId: text('workspace_id').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.tagId] }),
    foreignKey({
      columns: [table.taskId, table.workspaceId],
      foreignColumns: [tasks.id, tasks.workspaceId],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.tagId, table.workspaceId],
      foreignColumns: [tags.id, tags.workspaceId],
    }).onDelete('cascade'),
  ],
)
export const mutationReceipts = pgTable(
  'mutation_receipts',
  {
    actorId: text('actor_id').notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    operation: text('operation').notNull(),
    requestId: text('request_id').notNull(),
    inputHash: text('input_hash').notNull(),
    response: jsonb('response').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.actorId, table.workspaceId, table.operation, table.requestId] }),
    index('receipt_expiry').on(table.expiresAt),
  ],
)
