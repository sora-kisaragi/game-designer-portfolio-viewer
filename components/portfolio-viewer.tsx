"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import useSWR from "swr"

interface PortfolioImage {
  id: number
  title: string
  url: string
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

type FlipDirection = "forward" | "backward" | null

export default function PortfolioViewer() {
  const { data } = useSWR<PortfolioImage[]>("/api/images", fetcher, {
    fallbackData: MOCK_IMAGES,
  })

  const images = data && data.length > 0 ? data : MOCK_IMAGES
  const [current, setCurrent] = useState(0)
  const [flipping, setFlipping] = useState<FlipDirection>(null)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isAnimating = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const goTo = useCallback(
    (index: number, direction: FlipDirection) => {
      if (isAnimating.current) return
      if (index < 0 || index >= images.length) return
      if (index === current) return

      isAnimating.current = true
      setPendingIndex(index)
      setFlipping(direction)

      setTimeout(() => {
        setCurrent(index)
        setFlipping(null)
        setPendingIndex(null)
        isAnimating.current = false
      }, 600)
    },
    [current, images.length]
  )

  const goNext = useCallback(() => goTo(current + 1, "forward"), [current, goTo])
  const goPrev = useCallback(() => goTo(current - 1, "backward"), [current, goTo])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext()
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [goNext, goPrev])

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  // Tap zones
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const w = rect.width
    if (x < w * 0.3) goPrev()
    else if (x > w * 0.7) goNext()
  }

  const displayedImage = images[current]
  const pendingImage = pendingIndex !== null ? images[pendingIndex] : null

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] flex items-center justify-center select-none"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      style={{ touchAction: "none" }}
    >
      {/* Page flip scene */}
      <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: "1200px" }}>
        {/* Letterboxed image stage */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Current page */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transformStyle: "preserve-3d",
              animation: flipping
                ? `${flipping === "forward" ? "pageFlipOut" : "pageFlipOutReverse"} 0.6s cubic-bezier(0.4,0,0.2,1) forwards`
                : undefined,
            }}
          >
            <PageImage image={displayedImage} />
          </div>

          {/* Incoming page */}
          {pendingImage && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transformStyle: "preserve-3d",
                animation: flipping
                  ? `${flipping === "forward" ? "pageFlipIn" : "pageFlipInReverse"} 0.6s cubic-bezier(0.4,0,0.2,1) forwards`
                  : undefined,
              }}
            >
              <PageImage image={pendingImage} />
            </div>
          )}
        </div>
      </div>

      {/* Page indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
          <span className="text-white/70 text-sm font-mono tracking-widest">
            {current + 1} / {images.length}
          </span>
        </div>
      </div>

      {/* Tap zone hints (subtle arrows, only when hoverable) */}
      <div className="absolute left-0 top-0 h-full w-[30%] flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        {current > 0 && (
          <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
            </svg>
          </div>
        )}
      </div>
      <div className="absolute right-0 top-0 h-full w-[30%] flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        {current < images.length - 1 && (
          <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
            </svg>
          </div>
        )}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 pointer-events-none">
        {images.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? "20px" : "6px",
              height: "6px",
              backgroundColor: i === current ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
            }}
          />
        ))}
      </div>
    </div>
  )
}

function PageImage({ image }: { image: PortfolioImage }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 16:9 letterbox container */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "min(100vw, calc(100vh * 16/9))",
          height: "min(100vh, calc(100vw * 9/16))",
          maxWidth: "100vw",
          maxHeight: "100vh",
        }}
      >
        <Image
          src={image.url}
          alt={image.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        {/* Title badge */}
        <div className="absolute top-5 left-5">
          <span className="text-xs font-mono tracking-widest text-white/50 uppercase">
            {image.title}
          </span>
        </div>
      </div>
    </div>
  )
}
