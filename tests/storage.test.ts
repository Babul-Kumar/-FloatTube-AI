import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import {
  addNote,
  getNotes,
  updateNote,
  deleteNote,
  clearNotes,
  addBookmark,
  getBookmarks,
  updateBookmark,
  deleteBookmark,
  clearBookmarks,
  setAICache,
  getAICache,
  getLatestAICacheForVideo,
  clearAICache,
} from '../src/storage/db'

describe('IndexedDB Storage Layer', () => {
  const testVideoId = 'test_video_123'
  const testSiteId = 'youtube'

  beforeEach(async () => {
    await clearNotes()
    await clearBookmarks()
    await clearAICache()
  })

  it('should add, retrieve, sort, update, and delete timestamped notes', async () => {
    // Add multiple notes in non-chronological order
    const id1 = await addNote({
      videoId: testVideoId,
      siteId: testSiteId,
      timestamp: 120,
      content: 'Second important point',
    })
    const id2 = await addNote({
      videoId: testVideoId,
      siteId: testSiteId,
      timestamp: 30,
      content: 'First introduction point',
    })

    expect(typeof id1).toBe('number')
    expect(typeof id2).toBe('number')

    // Verify retrieval and timestamp sorting
    let notes = await getNotes(testVideoId)
    expect(notes.length).toBe(2)
    expect(notes[0].timestamp).toBe(30)
    expect(notes[0].content).toBe('First introduction point')
    expect(notes[1].timestamp).toBe(120)

    // Update note
    await updateNote(id1, 'Updated second point with extra details')
    notes = await getNotes(testVideoId)
    expect(notes[1].content).toBe('Updated second point with extra details')

    // Delete note
    await deleteNote(id2)
    notes = await getNotes(testVideoId)
    expect(notes.length).toBe(1)
    expect(notes[0].id).toBe(id1)

    // Clear notes for video
    await clearNotes(testVideoId)
    notes = await getNotes(testVideoId)
    expect(notes.length).toBe(0)
  })

  it('should isolate notes between different video IDs', async () => {
    await addNote({ videoId: 'vid_A', siteId: 'youtube', timestamp: 10, content: 'Note for Video A' })
    await addNote({ videoId: 'vid_B', siteId: 'youtube', timestamp: 10, content: 'Note for Video B' })

    const notesA = await getNotes('vid_A')
    const notesB = await getNotes('vid_B')

    expect(notesA.length).toBe(1)
    expect(notesA[0].content).toBe('Note for Video A')
    expect(notesB.length).toBe(1)
    expect(notesB[0].content).toBe('Note for Video B')
  })

  it('should add, update, delete, and clear bookmarks', async () => {
    const id = await addBookmark({
      videoId: testVideoId,
      siteId: testSiteId,
      timestamp: 45,
      label: 'Formula explanation',
    })

    let bms = await getBookmarks(testVideoId)
    expect(bms.length).toBe(1)
    expect(bms[0].label).toBe('Formula explanation')

    await updateBookmark(id, 'Updated formula explanation')
    bms = await getBookmarks(testVideoId)
    expect(bms[0].label).toBe('Updated formula explanation')

    await deleteBookmark(id)
    bms = await getBookmarks(testVideoId)
    expect(bms.length).toBe(0)
  })

  it('should store, read, and query latest AI Cache by videoId and type', async () => {
    const summaryData = {
      overview: 'This is a test lecture overview.',
      keyTakeaways: ['Point 1', 'Point 2'],
      importantConcepts: [{ term: 'Hooks', explanation: 'State manager' }],
      applications: ['Web Apps'],
      difficulty: 'Beginner' as const,
    }

    const cacheKey1 = `summary_${testVideoId}_hash1`
    await setAICache(cacheKey1, testVideoId, 'summary', summaryData)

    // Direct cache key lookup
    const cached = await getAICache(cacheKey1)
    expect(cached).toEqual(summaryData)

    // Query latest AI cache by videoId
    const latest = await getLatestAICacheForVideo(testVideoId, 'summary')
    expect(latest).toEqual(summaryData)

    // Clear AI cache
    await clearAICache(testVideoId)
    const cleared = await getAICache(cacheKey1)
    expect(cleared).toBeNull()
  })
})
