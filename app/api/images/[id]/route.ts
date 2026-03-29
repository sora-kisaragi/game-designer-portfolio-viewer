import { NextResponse } from "next/server"
import { deleteImage, getImageById } from "@/lib/db"
import { unlink } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

    const image = getImageById(numericId)
    if (!image) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Delete file from disk if it's a local upload
    if (image.filename) {
      const filepath = path.join(process.cwd(), "data", "uploads", image.filename)
      if (existsSync(filepath)) {
        await unlink(filepath)
      }
    }

    deleteImage(numericId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[v0] DELETE /api/images error:", err)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
