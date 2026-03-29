import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params

  // Only serve flat filenames — no subdirectory traversal
  if (segments.length !== 1) {
    return new NextResponse(null, { status: 404 })
  }

  const filename = segments[0]
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse(null, { status: 404 })
  }

  const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads")
  const filepath = path.join(uploadDir, filename)
  if (!existsSync(filepath)) {
    return new NextResponse(null, { status: 404 })
  }

  const buffer = await readFile(filepath)
  const ext = path.extname(filename).slice(1).toLowerCase()
  const contentType = MIME[ext] ?? "application/octet-stream"

  return new NextResponse(buffer, {
    headers: { "Content-Type": contentType },
  })
}
