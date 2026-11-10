import { createHash } from 'node:crypto'
import { createServer } from 'vite'
import { and, eq, getTableName, inArray } from 'drizzle-orm'
import { getTableConfig, pgSchema, text } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/neon-serverless'

// Read catalog metadata through Drizzle; never run DDL or read application rows.
const indexes = pgSchema('pg_catalog')
  .view('pg_indexes', {
    schemaName: text('schemaname'),
    tableName: text('tablename'),
    indexName: text('indexname'),
    definition: text('indexdef'),
  })
  .existing()

const dryRun = process.argv.includes('--dry-run')
const key = process.argv.includes('--direct') ? 'DATABASE_URL_DIRECT' : 'DATABASE_URL'
const connection = process.env[key]

function targetFingerprint(value) {
  const url = new URL(value)
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Invalid DB URL')
  const host = url.hostname.toLowerCase().replace(/-pooler(?=\.)/, '')
  return createHash('sha256')
    .update(`${host}:${url.port || '5432'}${url.pathname}`)
    .digest('hex')
    .slice(0, 12)
}

async function main() {
  if (!dryRun) {
    if (!connection) {
      console.error(`${key}가 없습니다. .env에 점검할 DB 주소를 설정하세요.`)
      console.error('앱 DB 점검은 DATABASE_URL, 마이그레이션 DB 점검은 --direct를 사용합니다.')
      process.exitCode = 1
      return
    }
    try {
      console.log(`${key} 대상 식별자: ${targetFingerprint(connection)}`)
      if (process.env.DATABASE_URL && process.env.DATABASE_URL_DIRECT) {
        const same =
          targetFingerprint(process.env.DATABASE_URL) ===
          targetFingerprint(process.env.DATABASE_URL_DIRECT)
        console.log(
          `런타임/마이그레이션 호스트·DB: ${same ? '일치' : '다름 — Neon 브랜치·DB를 확인하세요'}`,
        )
      }
    } catch {
      console.error('DB URL 형식이 잘못되었습니다. 연결 문자열은 출력하지 않습니다.')
      process.exitCode = 1
      return
    }
    process.env.DATABASE_URL = connection
  }
  const server = await createServer({
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'silent',
  })
  try {
    const runner = server.environments.ssr.runner
    const schema = await runner.import('/src/db/schema/index.ts')
    const tables = Object.values(schema)
    const { describeAuthFailure } = await runner.import('/src/server/auth/failure.server.ts')
    const inspect = async (db) => {
      let failures = 0
      let connectionFailed = false
      for (const table of tables) {
        const name = getTableName(table)
        const query = db.select().from(table).limit(0)
        if (dryRun) {
          const generated = query.toSQL()
          if (
            !/^select\s/i.test(generated.sql) ||
            !/limit\s+\$\d+\s*$/i.test(generated.sql) ||
            generated.params.at(-1) !== 0
          )
            throw new Error('Read-only probe validation failed')
          console.log(`DRY-RUN ${name}: SELECT, 반환 행 0개`)
          continue
        }
        try {
          await query
          console.log(`OK ${name}`)
        } catch (error) {
          failures++
          const diagnostic = describeAuthFailure(error)
          console.error(`FAIL ${name}`, diagnostic)
          if (!diagnostic.driverCodes.some((code) => ['42P01', '42703', '42501'].includes(code))) {
            connectionFailed = true
            console.error(
              '연결 또는 쿼리 실행이 실패해 나머지 검사를 중단합니다. 테이블 누락 여부를 확정한 결과는 아닙니다.',
            )
            break
          }
        }
      }
      // Tables can exist after a partial manual migration while the final
      // unique indexes are missing. ON CONFLICT(owner_id) then fails with 42P10.
      if (!connectionFailed) {
        for (const table of tables) {
          const config = getTableConfig(table)
          const required = config.indexes
            .filter((index) => index.config.unique)
            .map((index) => index.config.name)
          if (!required.length) continue
          const query = db
            .select({ name: indexes.indexName, definition: indexes.definition })
            .from(indexes)
            .where(
              and(
                eq(indexes.schemaName, config.schema ?? 'public'),
                eq(indexes.tableName, config.name),
                inArray(indexes.indexName, required),
              ),
            )
          if (dryRun) {
            const generated = query.toSQL()
            if (!/^select\s/i.test(generated.sql)) throw new Error('Read-only index probe failed')
            console.log(`DRY-RUN ${config.name}: 고유 인덱스 ${required.length}개 메타데이터 조회`)
            continue
          }
          try {
            const existing = await query
            for (const name of required) {
              const found = existing.find((row) => row.name === name)
              if (found && /^CREATE UNIQUE INDEX\s/i.test(found.definition)) {
                console.log(`OK INDEX ${name}`)
              } else {
                failures++
                console.error(`FAIL INDEX ${name}: 마이그레이션에 정의된 고유 인덱스 누락`)
              }
            }
          } catch (error) {
            failures++
            console.error('FAIL INDEX metadata', describeAuthFailure(error))
            break
          }
        }
      }
      if (failures) process.exitCode = 1
      console.log(
        dryRun
          ? `${tables.length}개 테이블·고유 인덱스의 읽기 전용 쿼리 생성 검증 완료. DB 연결 없음.`
          : failures
            ? 'DB 스키마 점검 실패. 위 FAIL 항목을 확인하세요.'
            : `${tables.length}개 테이블·컬럼 및 정의된 고유 인덱스 조회 확인 완료. 데이터·스키마 변경 없음.`,
      )
    }
    if (dryRun) await inspect(drizzle.mock({ schema }))
    else {
      const { withDatabase } = await runner.import('/src/db/client.server.ts')
      process.env.DATABASE_URL = connection
      await withDatabase(inspect)
    }
  } finally {
    await server.close()
  }
}

try {
  await main()
} catch {
  console.error(
    'DB 점검을 완료하지 못했습니다. 의존성과 연결 설정을 확인하세요. 연결 문자열·오류 원문은 출력하지 않습니다.',
  )
  process.exitCode = 1
}
