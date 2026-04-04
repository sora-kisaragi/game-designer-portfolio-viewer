"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import useSWR from "swr"
import { ZoomIn, ArrowLeftRight, Volume2, VolumeX } from "lucide-react"

interface PortfolioImage {
  id: number
  title: string
  url: string
  media_type?: "image" | "video"
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
type TransitionType = "flip" | "slide" | "fade" | "zoom" | "stack" | "wipe" | "blur"
type IndicatorStyle = "zeroPad" | "bar" | "dotsNum"

const INDICATOR_STYLES: IndicatorStyle[] = ["zeroPad", "bar", "dotsNum"]

const TRANSITIONS: { type: TransitionType; label: string }[] = [
  { type: "flip",  label: "Flip"  },
  { type: "slide", label: "Slide" },
  { type: "fade",  label: "Fade"  },
  { type: "zoom",  label: "Zoom"  },
  { type: "stack", label: "Stack" },
  { type: "wipe",  label: "Wipe"  },
  { type: "blur",  label: "Blur"  },
]

function getAnimNames(type: TransitionType, dir: "forward" | "backward"): { out: string; in: string } {
  switch (type) {
    case "flip":  return dir === "forward" ? { out: "pageFlipOut", in: "pageFlipIn" } : { out: "pageFlipOutReverse", in: "pageFlipInReverse" }
    case "slide": return dir === "forward" ? { out: "slideOutLeft", in: "slideInRight" } : { out: "slideOutRight", in: "slideInLeft" }
    case "fade":  return { out: "fadeOut",     in: "fadeIn"     }
    case "zoom":  return { out: "zoomFadeOut", in: "zoomFadeIn" }
    case "stack": return { out: "stackOut",    in: "stackIn"    }
    case "wipe":  return dir === "forward" ? { out: "wipeOut", in: "wipeIn" } : { out: "wipeOutReverse", in: "wipeInReverse" }
    case "blur":  return { out: "blurFadeOut", in: "blurFadeIn" }
  }
}

export default function PortfolioViewer() {
  const { data } = useSWR<PortfolioImage[]>("/api/images", fetcher, {
    fallbackData: MOCK_IMAGES,
  })

  const images = data && data.length > 0 ? data : MOCK_IMAGES
  const [current, setCurrent] = useState(0)
  const [flipping, setFlipping] = useState<FlipDirection>(null)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
  const [isZoomMode, setIsZoomMode] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [transitionType, setTransitionType] = useState<TransitionType>("flip")
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>("zeroPad")
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isAnimating = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleZoomMode = useCallback(() => {
    setIsZoomMode((prev) => {
      const next = !prev
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute(
          "content",
          next
            ? "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
            : "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        )
      }
      return next
    })
  }, [])

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
        setIsMuted(true)
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
      onTouchStart={isZoomMode ? undefined : handleTouchStart}
      onTouchEnd={isZoomMode ? undefined : handleTouchEnd}
      onClick={isZoomMode ? undefined : handleClick}
      style={{ touchAction: isZoomMode ? "auto" : "none" }}
    >
      {/* Page flip scene */}
      <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: transitionType === "flip" ? "1200px" : undefined }}>
        {/* Letterboxed image stage */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Current page */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transformStyle: transitionType === "flip" ? "preserve-3d" : undefined,
              animation: flipping
                ? `${getAnimNames(transitionType, flipping).out} 0.6s cubic-bezier(0.4,0,0.2,1) forwards`
                : undefined,
            }}
          >
            <PageImage image={displayedImage} isMuted={isMuted} />
          </div>

          {/* Incoming page */}
          {pendingImage && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transformStyle: transitionType === "flip" ? "preserve-3d" : undefined,
                animation: flipping
                  ? `${getAnimNames(transitionType, flipping).in} 0.6s cubic-bezier(0.4,0,0.2,1) forwards`
                  : undefined,
              }}
            >
              <PageImage image={pendingImage} isMuted={true} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom-left group: mute + page indicator */}
      <div className="absolute bottom-4 left-4 z-30 flex flex-col items-start gap-2 pointer-events-none">
        {displayedImage.media_type === "video" && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsMuted((v) => !v) }}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white/90 transition-colors"
            aria-label={isMuted ? "ミュート解除" : "ミュート"}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span className="text-xs font-mono">{isMuted ? "Muted" : "Sound"}</span>
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            const idx = INDICATOR_STYLES.indexOf(indicatorStyle)
            setIndicatorStyle(INDICATOR_STYLES[(idx + 1) % INDICATOR_STYLES.length])
          }}
          className="pointer-events-auto px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10"
        >
          {indicatorStyle === "zeroPad" && (
            <span className="text-white/70 text-sm font-mono tracking-widest">
              {String(current + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
            </span>
          )}
          {indicatorStyle === "bar" && (
            <div className="w-20 h-0.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="progress-bar-fill h-full bg-white/60 rounded-full"
                style={{ "--bar-progress": `${((current + 1) / images.length) * 100}%` } as React.CSSProperties}
              />
            </div>
          )}
          {indicatorStyle === "dotsNum" && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-200 ${
                      i === current ? "w-1.5 h-1.5 bg-white/80" : "w-1 h-1 bg-white/25"
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/50 text-xs font-mono">{current + 1} / {images.length}</span>
            </div>
          )}
        </button>
      </div>

      {/* Transition type cycle button */}
      <button
        type="button"
        onClick={() => {
          const idx = TRANSITIONS.findIndex(t => t.type === transitionType)
          setTransitionType(TRANSITIONS[(idx + 1) % TRANSITIONS.length].type)
        }}
        className="absolute bottom-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
      >
        ✦ {TRANSITIONS.find(t => t.type === transitionType)?.label}
      </button>

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


      {/* Zoom / Navigate toggle */}
      <div className="absolute top-4 right-4 z-30">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleZoomMode() }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-sm border transition-colors ${
            isZoomMode
              ? "bg-white/15 border-white/30 text-white"
              : "bg-black/50 border-white/10 text-white/50 hover:text-white/80"
          }`}
          aria-label={isZoomMode ? "ナビゲーションモードに切り替え" : "ズームモードに切り替え"}
        >
          {isZoomMode ? <ArrowLeftRight size={13} /> : <ZoomIn size={13} />}
          <span className="text-xs font-mono">{isZoomMode ? "Swipe" : "Zoom"}</span>
        </button>
      </div>

    </div>
  )
}

function PageImage({ image, isMuted }: { image: PortfolioImage; isMuted: boolean }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 16:9 letterbox container */}
      <div className="relative overflow-hidden letterbox-stage">
        {image.media_type === "video" ? (
          <video
            key={image.url}
            src={image.url}
            autoPlay
            muted={isMuted}
            playsInline
            loop
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Image
            src={image.url}
            alt={image.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
      </div>
    </div>
  )
}
