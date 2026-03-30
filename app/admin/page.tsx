"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import useSWR, { mutate } from "swr"
import { Trash2, Upload, ImageIcon, ArrowLeft, GripVertical } from "lucide-react"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface PortfolioImage {
  id: number
  title: string
  url: string
  filename?: string
}

const MOCK_IMAGES: PortfolioImage[] = [
  { id: 1, title: "Work 01", url: "https://picsum.photos/seed/work01/1600/900" },
  { id: 2, title: "Work 02", url: "https://picsum.photos/seed/work02/1600/900" },
  { id: 3, title: "Work 03", url: "https://picsum.photos/seed/work03/1600/900" },
  { id: 4, title: "Work 04", url: "https://picsum.photos/seed/work04/1600/900" },
  { id: 5, title: "Work 05", url: "https://picsum.photos/seed/work05/1600/900" },
  { id: 6, title: "Work 06", url: "https://picsum.photos/seed/work06/1600/900" },
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ── Sortable row ─────────────────────────────────────────────────────────────

function SortableImageRow({
  img,
  onDelete,
  deletingId,
}: {
  img: PortfolioImage
  onDelete: (id: number) => void
  deletingId: number | null
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: img.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-lg p-3 group"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 w-6 flex items-center justify-center text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>

      {/* Thumbnail */}
      <div className="relative shrink-0 w-20 h-[45px] rounded overflow-hidden bg-white/10">
        <Image
          src={img.url}
          alt={img.title}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{img.title}</p>
        <p className="text-xs text-white/30 font-mono truncate mt-0.5">
          ID: {img.id}
        </p>
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(img.id)}
        disabled={deletingId === img.id}
        className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30"
        aria-label={`Delete ${img.title}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ── Admin page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data, isLoading } = useSWR<PortfolioImage[]>("/api/images", fetcher, {
    fallbackData: MOCK_IMAGES,
  })
  const serverImages = data && data.length > 0 ? data : MOCK_IMAGES

  // Local ordering state for optimistic UI
  const [localImages, setLocalImages] = useState<PortfolioImage[] | null>(null)
  const images = localImages ?? serverImages

  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f) {
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title.trim()) return
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("title", title.trim())
      const res = await fetch("/api/images", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      setTitle("")
      setFile(null)
      setPreview(null)
      setLocalImages(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      mutate("/api/images")
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (deletingId !== null) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/images/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setLocalImages(null)
      mutate("/api/images")
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  // ── Drag end ────────────────────────────────────────────────────────────────

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex((img) => img.id === active.id)
    const newIndex = images.findIndex((img) => img.id === over.id)
    const reordered = arrayMove(images, oldIndex, newIndex)

    // Optimistic update
    setLocalImages(reordered)

    // Persist new sort_order for all items
    await Promise.all(
      reordered.map((img, index) =>
        fetch(`/api/images/${img.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: index }),
        })
      )
    )

    mutate("/api/images")
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          <span>View Portfolio</span>
        </Link>
        <div className="h-4 w-px bg-white/20" />
        <h1 className="text-sm font-mono tracking-widest text-white/80 uppercase">
          Admin
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-12">
        {/* Upload Form */}
        <section>
          <h2 className="text-xs font-mono tracking-widest text-white/40 uppercase mb-6">
            Upload Image
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File drop zone */}
            <div
              className="relative border border-dashed border-white/20 rounded-lg overflow-hidden cursor-pointer hover:border-white/40 transition-colors min-h-40"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <div className="relative w-full aspect-video">
                  <Image src={preview} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-xs text-white/70 font-mono">Click to change</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-12 px-4">
                  <ImageIcon size={32} className="text-white/20" />
                  <span className="text-sm text-white/40">Click to select an image</span>
                  <span className="text-xs text-white/25">PNG, JPG, WEBP — 16:9 recommended</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Select image file"
                onChange={handleFileChange}
              />
            </div>

            {/* Title input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-white/40 uppercase tracking-widest">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Work 07"
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-base text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>

            {uploadError && (
              <p className="text-red-400 text-xs font-mono">{uploadError}</p>
            )}

            <button
              type="submit"
              disabled={!file || !title.trim() || uploading}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Upload size={15} />
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </section>

        {/* Image list */}
        <section>
          <h2 className="text-xs font-mono tracking-widest text-white/40 uppercase mb-6">
            Images ({images.length})
          </h2>

          {isLoading ? (
            <div className="text-white/30 text-sm font-mono">Loading...</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map((img) => img.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {images.map((img) => (
                    <SortableImageRow
                      key={img.id}
                      img={img}
                      onDelete={handleDelete}
                      deletingId={deletingId}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </main>
    </div>
  )
}
