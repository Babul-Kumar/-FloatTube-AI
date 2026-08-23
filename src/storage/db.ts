import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'floattube-ai'
const DB_VERSION = 3

export interface Note {
  id?: number
  videoId: string
  siteId: string
  timestamp: number // video time in seconds
  content: string
  createdAt: number // Date.now()
  updatedAt?: number
}

export interface Bookmark {
  id?: number
  videoId: string
  siteId: string
  timestamp: number
  label: string
  screenshotUrl?: string
  createdAt: number
}

export interface Session {
  id?: number
  videoId: string
  siteId: string
  title: string
  watchTime: number
  resumeAt: number
  lastWatched: number
}

export interface AICacheRecord {
  id?: number
  cacheKey: string
  videoId: string
  type: 'summary' | 'flashcards' | 'quiz' | 'chat'
  data: any
  createdAt: number
}

let _db: IDBPDatabase | null = null

async function getDB() {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('notes')) {
        const notes = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true })
        notes.createIndex('videoId', 'videoId')
        notes.createIndex('siteId', 'siteId')
      }
      if (!db.objectStoreNames.contains('bookmarks')) {
        const bm = db.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true })
        bm.createIndex('videoId', 'videoId')
      }
      if (!db.objectStoreNames.contains('sessions')) {
        const s = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true })
        s.createIndex('videoId', 'videoId')
      }
      if (!db.objectStoreNames.contains('aiCache')) {
        const ai = db.createObjectStore('aiCache', { keyPath: 'id', autoIncrement: true })
        ai.createIndex('cacheKey', 'cacheKey', { unique: true })
        ai.createIndex('videoId', 'videoId')
      }
    },
  })
  return _db
}

// ─── Notes Operations ─────────────────────────────────────────────────────────

export async function getNotes(videoId: string): Promise<Note[]> {
  const db = await getDB()
  const notes = await db.getAllFromIndex('notes', 'videoId', videoId)
  return notes.sort((a, b) => a.timestamp - b.timestamp)
}

export async function addNote(note: Omit<Note, 'id' | 'createdAt'>): Promise<number> {
  const db = await getDB()
  const id = await db.add('notes', {
    ...note,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  return id as number
}

export async function updateNote(id: number, content: string): Promise<void> {
  const db = await getDB()
  const existing = await db.get('notes', id)
  if (existing) {
    await db.put('notes', {
      ...existing,
      content,
      updatedAt: Date.now(),
    })
  }
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('notes', id)
}

export async function clearNotes(videoId?: string): Promise<void> {
  const db = await getDB()
  if (videoId) {
    const tx = db.transaction('notes', 'readwrite')
    const index = tx.store.index('videoId')
    let cursor = await index.openCursor(IDBKeyRange.only(videoId))
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    await tx.done
  } else {
    await db.clear('notes')
  }
}

// ─── Bookmarks Operations ─────────────────────────────────────────────────────

export async function getBookmarks(videoId: string): Promise<Bookmark[]> {
  const db = await getDB()
  const bms = await db.getAllFromIndex('bookmarks', 'videoId', videoId)
  return bms.sort((a, b) => a.timestamp - b.timestamp)
}

export async function addBookmark(bm: Omit<Bookmark, 'id' | 'createdAt'>): Promise<number> {
  const db = await getDB()
  const id = await db.add('bookmarks', {
    ...bm,
    createdAt: Date.now(),
  })
  return id as number
}

export async function updateBookmark(id: number, label: string): Promise<void> {
  const db = await getDB()
  const existing = await db.get('bookmarks', id)
  if (existing) {
    await db.put('bookmarks', {
      ...existing,
      label,
    })
  }
}

export async function deleteBookmark(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('bookmarks', id)
}

export async function clearBookmarks(videoId?: string): Promise<void> {
  const db = await getDB()
  if (videoId) {
    const tx = db.transaction('bookmarks', 'readwrite')
    const index = tx.store.index('videoId')
    let cursor = await index.openCursor(IDBKeyRange.only(videoId))
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    await tx.done
  } else {
    await db.clear('bookmarks')
  }
}

// ─── AI Cache Operations ──────────────────────────────────────────────────────

export async function getAICache<T = any>(cacheKey: string): Promise<T | null> {
  try {
    const db = await getDB()
    const index = db.transaction('aiCache').store.index('cacheKey')
    const record = await index.get(cacheKey)
    return record?.data ?? null
  } catch (error) {
    console.warn('[FloatTube AI] Cache read error:', error)
    return null
  }
}

export async function setAICache(
  cacheKey: string,
  videoId: string,
  type: 'summary' | 'flashcards' | 'quiz' | 'chat',
  data: any,
): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction('aiCache', 'readwrite')
    const index = tx.store.index('cacheKey')
    const existing = await index.get(cacheKey)

    if (existing?.id != null) {
      await tx.store.put({
        ...existing,
        data,
        createdAt: Date.now(),
      })
    } else {
      await tx.store.add({
        cacheKey,
        videoId,
        type,
        data,
        createdAt: Date.now(),
      })
    }
    await tx.done
  } catch (error) {
    console.warn('[FloatTube AI] Cache write error:', error)
  }
}

export async function getLatestAICacheForVideo<T = any>(
  videoId: string,
  type: 'summary' | 'flashcards' | 'quiz' | 'chat',
): Promise<T | null> {
  try {
    const db = await getDB()
    const index = db.transaction('aiCache').store.index('videoId')
    const records = await index.getAll(videoId)
    const filtered = records
      .filter((r) => r.type === type)
      .sort((a, b) => b.createdAt - a.createdAt)
    return (filtered[0]?.data as T) ?? null
  } catch (error) {
    console.warn('[FloatTube AI] Cache read error:', error)
    return null
  }
}

export async function clearAICache(videoId?: string): Promise<void> {
  const db = await getDB()
  if (videoId) {
    const tx = db.transaction('aiCache', 'readwrite')
    const index = tx.store.index('videoId')
    let cursor = await index.openCursor(IDBKeyRange.only(videoId))
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    await tx.done
  } else {
    await db.clear('aiCache')
  }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function getSession(videoId: string): Promise<Session | undefined> {
  const db = await getDB()
  const all = await db.getAllFromIndex('sessions', 'videoId', videoId)
  return all[0]
}

export async function upsertSession(session: Omit<Session, 'id'>): Promise<void> {
  const db = await getDB()
  const existing = await getSession(session.videoId)
  if (existing?.id != null) {
    await db.put('sessions', { ...existing, ...session })
  } else {
    await db.add('sessions', session)
  }
}
