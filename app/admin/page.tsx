"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import useSWR, { mutate } from "swr"
import { Trash2, Upload, ArrowLeft, GripVertical, X } from "lucide-react"
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

interface QueueItem {
  key: string
  file: File
  preview: string
  title: string
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

// ── Sortable row ──────────────────────────────────────────────────────────────

function SortableImageRow({
  img,
  onDelete,
  deletingId,
  selected,
  onToggle,
}: {
  img: PortfolioImage
  onDelete: (id: number) => void
  deletingId: number | null
  selected: boolean
  onToggle: (id: number) => void
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
      className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3 group"
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(img.id)}
        className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
          selected ? "bg-white border-white" : "border-white/30 hover:border-white/60"
        }`}
        aria-label={selected ? "Deselect" : "Select"}
      >
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

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
        <Image src={img.url} alt={img.title} fill className="object-cover" sizes="80px" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{img.title}</p>
        <p className="text-xs text-white/30 font-mono truncate mt-0.5">ID: {img.id}</p>
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
  const [localImages, setLocalImages] = useState<PortfolioImage[] | null>(null)
  const images = localImages ?? serverImages

  // Upload queue
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  // Bulk selection / delete
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  // ── Queue management ──────────────────────────────────────────────────────

  const addFilesToQueue = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"))
    if (imageFiles.length === 0) return
    const items: QueueItem[] = imageFiles.map((f) => ({
      key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
      preview: URL.createObjectURL(f),
      title: f.name.replace(/\.[^.]+$/, ""),
    }))
    setQueue((prev) => [...prev, ...items])
  }, [])

  const removeFromQueue = (key: string) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.key === key)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter((i) => i.key !== key)
    })
  }

  const updateQueueTitle = (key: string, title: string) => {
    setQueue((prev) => prev.map((i) => (i.key === key ? { ...i, title } : i)))
  }

  // ── Drop zone ─────────────────────────────────────────────────────────────

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    addFilesToQueue(Array.from(e.dataTransfer.files))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    addFilesToQueue(files)
    e.target.value = ""
  }

  // ── Upload all (filename A→Z order) ──────────────────────────────────────

  const sortedQueue = [...queue].sort((a, b) =>
    a.file.name.localeCompare(b.file.name)
  )

  const handleUploadAll = async () => {
    if (sortedQueue.length === 0 || uploading) return
    setUploading(true)
    setUploadError(null)
    try {
      for (const item of sortedQueue) {
        const formData = new FormData()
        formData.append("image", item.file)
        formData.append("title", item.title.trim() || item.file.name.replace(/\.[^.]+$/, ""))
        const res = await fetch("/api/images", { method: "POST", body: formData })
        if (!res.ok) throw new Error(`Failed: ${item.file.name}`)
      }
      queue.forEach((item) => URL.revokeObjectURL(item.preview))
      setQueue([])
      setLocalImages(null)
      mutate("/api/images")
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  // ── Individual delete ─────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (deletingId !== null) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/images/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setSelectedIds((prev) => {
        const s = new Set(prev)
        s.delete(id)
        return s
      })
      setLocalImages(null)
      mutate("/api/images")
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  // ── Bulk delete ───────────────────────────────────────────────────────────

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || deleting) return
    setDeleting(true)
    try {
      const res = await fetch("/api/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      if (!res.ok) throw new Error("Delete failed")
      setSelectedIds(new Set())
      setLocalImages(null)
      mutate("/api/images")
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(images.map((i) => i.id)))
    }
  }

  // ── Sort order (drag) ─────────────────────────────────────────────────────

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex((img) => img.id === active.id)
    const newIndex = images.findIndex((img) => img.id === over.id)
    const reordered = arrayMove(images, oldIndex, newIndex)

    setLocalImages(reordered)

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

  // ── Render ────────────────────────────────────────────────────────────────

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
        <h1 className="text-sm font-mono tracking-widest text-white/80 uppercase">Admin</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-12">
        {/* Upload section */}
        <section>
          <h2 className="text-xs font-mono tracking-widest text-white/40 uppercase mb-6">
            Upload Images
          </h2>

          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
              isDragOver
                ? "border-white/60 bg-white/5"
                : "border-white/20 hover:border-white/35"
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 pointer-events-none">
              <Upload
                size={28}
                className={isDragOver ? "text-white/60" : "text-white/20"}
              />
              <span className="text-sm text-white/40">
                {isDragOver ? "Drop to add" : "Drop images here, or click to select"}
              </span>
              <span className="text-xs text-white/25">
                PNG, JPG, WEBP — multiple files supported
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              aria-label="Select image files"
              onChange={handleFileChange}
            />
          </div>

          {/* Queue */}
          {queue.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-mono text-white/30">
                Upload order: filename A→Z ({queue.length} file{queue.length > 1 ? "s" : ""})
              </p>

              {sortedQueue.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3"
                >
                  <div className="relative shrink-0 w-20 h-[45px] rounded overflow-hidden bg-white/10">
                    <Image
                      src={item.preview}
                      alt={item.file.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateQueueTitle(item.key, e.target.value)}
                      aria-label={`Title for ${item.file.name}`}
                      placeholder="Title"
                      className="w-full bg-white/5 border border-white/15 rounded px-3 py-1.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors"
                    />
                    <p className="text-xs text-white/25 font-mono truncate">{item.file.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromQueue(item.key)
                    }}
                    className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
                    aria-label="Remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {uploadError && (
                <p className="text-red-400 text-xs font-mono">{uploadError}</p>
              )}

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleUploadAll}
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Upload size={14} />
                  {uploading ? "Uploading..." : `Upload All (${queue.length})`}
                </button>
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => {
                      queue.forEach((i) => URL.revokeObjectURL(i.preview))
                      setQueue([])
                    }}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Image list */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-mono tracking-widest text-white/40 uppercase">
              Images ({images.length})
            </h2>
            {images.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors font-mono"
                >
                  {selectedIds.size === images.length ? "Deselect All" : "Select All"}
                </button>
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 size={12} />
                    {deleting ? "Deleting..." : `Delete (${selectedIds.size})`}
                  </button>
                )}
              </div>
            )}
          </div>

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
                      selected={selectedIds.has(img.id)}
                      onToggle={toggleSelect}
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
