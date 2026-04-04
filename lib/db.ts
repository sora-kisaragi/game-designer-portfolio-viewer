import Database from "better-sqlite3"
import path from "path"
import { mkdirSync } from "fs"

export interface ImageRecord {
  id: number
  filename: string
  title: string | null
  sort_order: number
  created_at: string
  url: string
  media_type: "image" | "video"
}

const DB_PATH =
  process.env.DB_PATH ?? path.join(process.cwd(), "data", "portfolio.db")

function getDb() {
  mkdirSync(path.dirname(DB_PATH), { recursive: true })
  const db = new Database(DB_PATH)
  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      filename   TEXT NOT NULL,
      title      TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  // Migration: add media_type column for existing databases
  const cols = db.prepare("PRAGMA table_info(images)").all() as { name: string }[]
  if (!cols.some((c) => c.name === "media_type")) {
    db.exec("ALTER TABLE images ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image'")
  }
  return db
}

function toRecord(row: Omit<ImageRecord, "url">): ImageRecord {
  return { ...row, url: `/uploads/${row.filename}` }
}

export function getImages(): ImageRecord[] {
  const db = getDb()
  const rows = db
    .prepare("SELECT * FROM images ORDER BY sort_order ASC, id ASC")
    .all() as Omit<ImageRecord, "url">[]
  db.close()
  return rows.map(toRecord)
}

export function getImageById(id: number): ImageRecord | undefined {
  const db = getDb()
  const row = db
    .prepare("SELECT * FROM images WHERE id = ?")
    .get(id) as Omit<ImageRecord, "url"> | undefined
  db.close()
  return row ? toRecord(row) : undefined
}

export function addImage(
  title: string,
  filename: string,
  mediaType: "image" | "video" = "image"
): ImageRecord {
  const db = getDb()
  const maxRow = db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) AS max FROM images")
    .get() as { max: number }
  const sort_order = maxRow.max + 1
  const result = db
    .prepare(
      "INSERT INTO images (filename, title, sort_order, media_type) VALUES (?, ?, ?, ?)"
    )
    .run(filename, title, sort_order, mediaType)
  const row = db
    .prepare("SELECT * FROM images WHERE id = ?")
    .get(result.lastInsertRowid) as Omit<ImageRecord, "url">
  db.close()
  return toRecord(row)
}

export function deleteImage(id: number): void {
  const db = getDb()
  db.prepare("DELETE FROM images WHERE id = ?").run(id)
  db.close()
}

export function deleteImages(ids: number[]): void {
  if (ids.length === 0) return
  const db = getDb()
  const placeholders = ids.map(() => "?").join(",")
  db.prepare(`DELETE FROM images WHERE id IN (${placeholders})`).run(...ids)
  db.close()
}

export function updateSortOrder(id: number, sort_order: number): void {
  const db = getDb()
  db.prepare("UPDATE images SET sort_order = ? WHERE id = ?").run(
    sort_order,
    id
  )
  db.close()
}
