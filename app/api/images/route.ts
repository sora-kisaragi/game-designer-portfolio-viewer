import { NextResponse } from "next/server"
import { getImages, addImage } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

export async function GET() {
  try {
    const images = getImages()
    return NextResponse.json(images)
  } catch {
    return NextResponse.json([], { status: 200 })
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

    const uploadDir = path.join(process.cwd(), "data", "uploads")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filepath = path.join(uploadDir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    const image = addImage(title, `/uploads/${filename}`, filename)
    return NextResponse.json(image, { status: 201 })
  } catch (err) {
    console.error("[v0] POST /api/images error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
