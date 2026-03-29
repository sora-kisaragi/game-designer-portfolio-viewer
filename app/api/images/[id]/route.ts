import { NextResponse } from "next/server"
import { deleteImage, getImageById, updateSortOrder } from "@/lib/db"
import { unlink } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads")

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

    if (image.filename) {
      const filepath = path.join(UPLOAD_DIR, image.filename)
      if (existsSync(filepath)) {
        await unlink(filepath)
      }
    }

    deleteImage(numericId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[api] DELETE /api/images error:", err)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

    const body = await request.json()
    const sort_order = Number(body?.sort_order)
    if (!Number.isFinite(sort_order)) {
      return NextResponse.json({ error: "Invalid sort_order" }, { status: 400 })
    }

    const image = getImageById(numericId)
    if (!image) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    updateSortOrder(numericId, sort_order)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[api] PATCH /api/images error:", err)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
