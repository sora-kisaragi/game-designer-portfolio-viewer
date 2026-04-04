import { NextRequest, NextResponse } from "next/server"
import { createReadStream, existsSync, statSync } from "fs"
import { Readable } from "stream"
import path from "path"

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params

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

  const ext = path.extname(filename).slice(1).toLowerCase()
  const contentType = MIME[ext] ?? "application/octet-stream"
  const fileSize = statSync(filepath).size
  const rangeHeader = req.headers.get("range")

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/)
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0
      const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
      const chunkSize = end - start + 1

      const nodeStream = createReadStream(filepath, { start, end })
      const webStream = Readable.toWeb(nodeStream) as ReadableStream

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
        },
      })
    }
  }

  const nodeStream = createReadStream(filepath)
  const webStream = Readable.toWeb(nodeStream) as ReadableStream

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Content-Length": String(fileSize),
    },
  })
}
