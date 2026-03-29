/**
 * Lightweight file-based image store for the portfolio viewer.
 * In the Docker/production deployment this module can be replaced with
 * a better-sqlite3 implementation while keeping the same exported API.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import path from "path"

interface ImageRecord {
  id: number
  title: string
  url: string
  filename: string | null
  created_at: string
}

const DATA_DIR = path.join(process.cwd(), "data")
const DB_FILE = path.join(DATA_DIR, "images.json")

function ensureDb(): ImageRecord[] {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(DB_FILE)) {
    writeFileSync(DB_FILE, JSON.stringify([]), "utf-8")
    return []
  }
  try {
    return JSON.parse(readFileSync(DB_FILE, "utf-8")) as ImageRecord[]
  } catch {
    return []
  }
}

function saveDb(records: ImageRecord[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DB_FILE, JSON.stringify(records, null, 2), "utf-8")
}

export function getImages(): ImageRecord[] {
  return ensureDb().sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

export function getImageById(id: number): ImageRecord | undefined {
  return ensureDb().find((r) => r.id === id)
}

export function addImage(title: string, url: string, filename: string | null): ImageRecord {
  const records = ensureDb()
  const newId = records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1
  const record: ImageRecord = {
    id: newId,
    title,
    url,
    filename,
    created_at: new Date().toISOString(),
  }
  records.push(record)
  saveDb(records)
  return record
}

export function deleteImage(id: number): void {
  const records = ensureDb().filter((r) => r.id !== id)
  saveDb(records)
}
