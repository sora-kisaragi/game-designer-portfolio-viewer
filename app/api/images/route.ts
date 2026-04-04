import { NextResponse } from "next/server"
import { getImages, addImage, getImageById, deleteImages } from "@/lib/db"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads")

export async function GET() {
  try {
    const images = getImages()
    return NextResponse.json(images)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Missing ids" }, { status: 400 })
    }

    for (const id of ids) {
      const image = getImageById(Number(id))
      if (image?.filename) {
        const filepath = path.join(UPLOAD_DIR, image.filename)
        if (existsSync(filepath)) {
          await unlink(filepath)
        }
      }
    }

    deleteImages(ids.map(Number))
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[api] DELETE /api/images error:", err)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File | null
    const title = formData.get("title") as string | null

    if (!file || !title) {
      return NextResponse.json({ error: "Missing image or title" }, { status: 400 })
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    const mediaType = file.type.startsWith("video/") ? "video" : "image"
    const image = addImage(title, filename, mediaType)
    return NextResponse.json(image, { status: 201 })
  } catch (err) {
    console.error("[api] POST /api/images error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
