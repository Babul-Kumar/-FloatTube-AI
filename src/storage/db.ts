import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'floattube-ai'
const DB_VERSION = 2

interface Note {
  id?: number
  videoId: string
  siteId: string
  timestamp: number   // video time in seconds
  content: string
  createdAt: number   // Date.now()
}

interface Bookmark {
  id?: number
  videoId: string
  siteId: string
  timestamp: number
  label: string
  screenshotUrl?: string
  createdAt: number
}

interface Session {
  id?: number
  videoId: string
  siteId: string
  title: string
  watchTime: number
  resumeAt: number
  lastWatched: number
}

let _db: IDBPDatabase | null = null

async function getDB() {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
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
    },
  })
  return _db
}

// Notes
export async function getNotes(videoId: string): Promise<Note[]> {
  const db = await getDB()
  return db.getAllFromIndex('notes', 'videoId', videoId)
}

export async function addNote(note: Omit<Note, 'id' | 'createdAt'>): Promise<void> {
  const db = await getDB()
  await db.add('notes', { ...note, createdAt: Date.now() })
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('notes', id)
}

// Bookmarks
export async function getBookmarks(videoId: string): Promise<Bookmark[]> {
  const db = await getDB()
  return db.getAllFromIndex('bookmarks', 'videoId', videoId)
}

export async function addBookmark(bm: Omit<Bookmark, 'id' | 'createdAt'>): Promise<void> {
  const db = await getDB()
  await db.add('bookmarks', { ...bm, createdAt: Date.now() })
}

export async function deleteBookmark(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('bookmarks', id)
}

// Sessions
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
