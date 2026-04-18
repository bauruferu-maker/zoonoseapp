import * as SQLite from 'expo-sqlite'
import * as Crypto from 'expo-crypto'

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const database = await SQLite.openDatabaseAsync('zoonoseapp.db')
      await initSchema(database)
      return database
    })()
  }
  return dbPromise
}

async function initSchema(database: SQLite.SQLiteDatabase) {
  // Criar tabelas primeiro (ordem correta)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS pending_visits (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      property_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      visited_at TEXT NOT NULL,
      status TEXT NOT NULL,
      visit_type TEXT DEFAULT 'rotina',
      focus_type TEXT,
      action_taken TEXT,
      notes TEXT,
      photo_uri TEXT,
      lat_start REAL,
      lng_start REAL,
      lat_end REAL,
      lng_end REAL,
      accuracy_meters REAL,
      started_at TEXT,
      duration_seconds INTEGER,
      confidence_score INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cached_queue (
      property_id TEXT PRIMARY KEY,
      address TEXT,
      sector_name TEXT,
      owner_name TEXT,
      priority TEXT,
      priority_reason TEXT,
      total_visits INTEGER DEFAULT 0,
      last_visited_at TEXT,
      lat REAL,
      lng REAL,
      cached_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cached_route (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      route_date TEXT NOT NULL,
      property_ids TEXT NOT NULL,
      completed_ids TEXT NOT NULL,
      cached_at TEXT DEFAULT (datetime('now'))
    );
  `)

  // Migrations: adicionar colunas novas se nao existirem (silencia erro se ja existem)
  const migrations = [
    'ALTER TABLE cached_queue ADD COLUMN lat REAL',
    'ALTER TABLE cached_queue ADD COLUMN lng REAL',
  ]
  for (const sql of migrations) {
    try { await database.execAsync(sql) } catch { /* coluna ja existe */ }
  }
}

// Salvar visita offline
export async function savePendingVisit(visit: {
  property_id: string
  agent_id: string
  visited_at: string
  status: string
  visit_type?: string
  focus_type?: string | null
  action_taken?: string | null
  notes?: string | null
  photo_uri?: string | null
  lat_start?: number | null
  lng_start?: number | null
  lat_end?: number | null
  lng_end?: number | null
  accuracy_meters?: number | null
  started_at?: string | null
  duration_seconds?: number | null
  confidence_score?: number | null
}): Promise<string> {
  const database = await getDb()
  const id = Crypto.randomUUID()

  await database.runAsync(
    `INSERT INTO pending_visits (id, property_id, agent_id, visited_at, status, visit_type, focus_type, action_taken, notes, photo_uri, lat_start, lng_start, lat_end, lng_end, accuracy_meters, started_at, duration_seconds, confidence_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    visit.property_id,
    visit.agent_id,
    visit.visited_at,
    visit.status,
    visit.visit_type ?? 'rotina',
    visit.focus_type ?? null,
    visit.action_taken ?? null,
    visit.notes ?? null,
    visit.photo_uri ?? null,
    visit.lat_start ?? null,
    visit.lng_start ?? null,
    visit.lat_end ?? null,
    visit.lng_end ?? null,
    visit.accuracy_meters ?? null,
    visit.started_at ?? null,
    visit.duration_seconds ?? null,
    visit.confidence_score ?? 0,
  )

  return id
}

// Buscar visitas pendentes de sync
export async function getPendingVisits(): Promise<any[]> {
  const database = await getDb()
  return await database.getAllAsync('SELECT * FROM pending_visits WHERE synced = 0 ORDER BY created_at')
}

// Marcar visita como sincronizada
export async function markVisitSynced(id: string): Promise<void> {
  const database = await getDb()
  await database.runAsync('UPDATE pending_visits SET synced = 1 WHERE id = ?', id)
}

// Cache da fila de trabalho (com transaction para evitar perda de dados)
export async function cacheQueue(items: any[]): Promise<void> {
  const database = await getDb()
  await database.execAsync('BEGIN TRANSACTION')
  try {
    await database.execAsync('DELETE FROM cached_queue')
    for (const item of items) {
      await database.runAsync(
        `INSERT OR REPLACE INTO cached_queue (property_id, address, sector_name, owner_name, priority, priority_reason, total_visits, last_visited_at, lat, lng)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.property_id,
        item.address,
        item.sector_name,
        item.owner_name,
        item.priority,
        item.priority_reason,
        item.total_visits ?? 0,
        item.last_visited_at,
        item.lat ?? null,
        item.lng ?? null,
      )
    }
    await database.execAsync('COMMIT')
  } catch (err) {
    await database.execAsync('ROLLBACK')
    throw err
  }
}

// Buscar fila do cache
export async function getCachedQueue(): Promise<any[]> {
  const database = await getDb()
  return await database.getAllAsync('SELECT * FROM cached_queue ORDER BY CASE priority WHEN \'alta\' THEN 1 WHEN \'media\' THEN 2 ELSE 3 END')
}

// Cache da rota do dia
export async function cacheRoute(route: any): Promise<void> {
  const database = await getDb()
  await database.runAsync(
    'INSERT OR REPLACE INTO cached_route (id, agent_id, route_date, property_ids, completed_ids) VALUES (?, ?, ?, ?, ?)',
    route.id,
    route.agent_id,
    route.route_date,
    JSON.stringify(route.property_ids ?? []),
    JSON.stringify(route.completed_ids ?? []),
  )
}

// Buscar rota do cache
export async function getCachedRoute(agentId: string, date: string): Promise<any | null> {
  const database = await getDb()
  const row = await database.getFirstAsync(
    'SELECT * FROM cached_route WHERE agent_id = ? AND route_date = ?',
    agentId, date,
  ) as any
  if (!row) return null
  let propertyIds: string[] = []
  let completedIds: string[] = []
  try { propertyIds = JSON.parse(row.property_ids) } catch { propertyIds = [] }
  try { completedIds = JSON.parse(row.completed_ids) } catch { completedIds = [] }
  return {
    ...row,
    property_ids: propertyIds,
    completed_ids: completedIds,
  }
}

// Atualizar completed_ids no cache local
export async function updateCachedRouteCompleted(routeId: string, completedIds: string[]): Promise<void> {
  const database = await getDb()
  await database.runAsync(
    'UPDATE cached_route SET completed_ids = ? WHERE id = ?',
    JSON.stringify(completedIds),
    routeId,
  )
}

// Contar pendentes de sync
export async function getPendingCount(): Promise<number> {
  const database = await getDb()
  const row = await database.getFirstAsync('SELECT COUNT(*) as count FROM pending_visits WHERE synced = 0') as any
  return row?.count ?? 0
}

// Limpar dados locais (para logout)
export async function clearLocalData(): Promise<void> {
  const database = await getDb()
  await database.execAsync(`
    DELETE FROM pending_visits WHERE synced = 1;
    DELETE FROM cached_queue;
    DELETE FROM cached_route;
  `)
}
