"use client"

import type React from "react"
import { memo, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { GRID_CONFIG, LOGO_ASPECT_RATIO } from "@/lib/constants"
import styles from "@/styles/animations.module.css"

const isLogoFeatureEnabled = (() => {
  const gridAspectRatio = GRID_CONFIG.COLS / GRID_CONFIG.ROWS
  return gridAspectRatio >= LOGO_ASPECT_RATIO.MIN && gridAspectRatio <= LOGO_ASPECT_RATIO.MAX
})()

interface TileProps {
  activity: { task: string; points: number }
  index: number
  isFlipped: boolean
  onTileClick: (index: number) => void
  animationDelay: number
}

export const Tile = memo<TileProps>(({ activity, index, isFlipped, onTileClick, animationDelay }) => {
  const getTileBackgroundPosition = useCallback(() => {
    if (!isLogoFeatureEnabled) return { left: 0, top: 0 }
    const row = Math.floor(index / GRID_CONFIG.COLS)
    const col = index % GRID_CONFIG.COLS
    const left = GRID_CONFIG.COLS > 1 ? (col / (GRID_CONFIG.COLS - 1)) * 100 : 50
    const top = GRID_CONFIG.ROWS > 1 ? (row / (GRID_CONFIG.ROWS - 1)) * 100 : 50
    return { left, top }
  }, [index])

  const bgPosition = useMemo(() => getTileBackgroundPosition(), [getTileBackgroundPosition])

  return (
    <div className={cn("relative cursor-pointer group animate-in zoom-in duration-500 transition-transform h-28")} style={{ animationDelay: `${animationDelay}ms` }} onClick={() => onTileClick(index)}>
      <div className={cn("relative w-full h-full transition-transform duration-700 group-hover:scale-105", styles.preserve3d)}>
        <div className={cn("absolute inset-0 w-full h-full transition-transform duration-700", styles.backfaceHidden, isFlipped ? styles.rotateY180 : "") }>
          <div className="w-full h-full bg-gradient-to-b from-amber-50 via-stone-50 to-amber-100 rounded-md border border-stone-300 shadow-lg flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:border-stone-400">
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-stone-200/40 rounded-md"></div>
            <div className="absolute inset-0.5 bg-gradient-to-b from-stone-100 to-amber-50 rounded-sm border border-stone-200/50 shadow-inner"></div>
            <div className="absolute top-0.5 left-0.5 w-1 h-1 border-l border-t border-stone-400/60 rounded-tl-sm"></div>
            <div className="absolute top-0.5 right-0.5 w-1 h-1 border-r border-t border-stone-400/60 rounded-tr-sm"></div>
            <div className="absolute bottom-0.5 left-0.5 w-1 h-1 border-l border-b border-stone-400/60 rounded-bl-sm"></div>
            <div className="absolute bottom-0.5 right-0.5 w-1 h-1 border-r border-b border-stone-400/60 rounded-br-sm"></div>
            <div className="relative z-10 text-stone-700 font-semibold text-[10px] text-center px-1 leading-tight drop-shadow-sm">{activity.task}</div>
            <div className="absolute bottom-1 right-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md border border-emerald-300">{activity.points} pts</div>
            <div className="absolute inset-0.5 bg-gradient-to-br from-amber-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm"></div>
          </div>
        </div>

        <div className={cn("absolute inset-0 w-full h-full transition-transform duration-700", styles.backfaceHidden, styles.rotateY180, isFlipped ? styles.rotateY0 : "") }>
          <div className="w-full h-full bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-700 rounded-md border border-emerald-400 shadow-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-300/20 via-transparent to-emerald-800/10 rounded-md"></div>
            <div className="absolute inset-0.5 bg-gradient-to-b from-emerald-400/10 to-emerald-600/10 rounded-sm border border-emerald-300/20 shadow-inner"></div>
            <div className="absolute top-0.5 left-0.5 w-1 h-1 border-l border-t border-emerald-200/40 rounded-tl-sm"></div>
            <div className="absolute top-0.5 right-0.5 w-1 h-1 border-r border-t border-emerald-200/40 rounded-tr-sm"></div>
            <div className="absolute bottom-0.5 left-0.5 w-1 h-1 border-l border-b border-emerald-200/40 rounded-bl-sm"></div>
            <div className="absolute bottom-0.5 right-0.5 w-1 h-1 border-r border-b border-emerald-200/40 rounded-br-sm"></div>
            {isLogoFeatureEnabled && (
              <div className="absolute inset-0 opacity-40 bg-cover" style={{ backgroundImage: "url(/pgpals-logo.png)", backgroundPosition: `${bgPosition.left}% ${bgPosition.top}%`, backgroundSize: `${GRID_CONFIG.COLS * 100}% ${GRID_CONFIG.ROWS * 100}%` }}></div>
            )}
            <div className="relative z-10 text-emerald-100 font-bold text-lg drop-shadow-xl">✓</div>
            <div className="absolute bottom-1 right-1 bg-emerald-200 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md">{activity.points} pts</div>
            <div className="absolute inset-0.5 bg-gradient-to-br from-emerald-200/20 to-transparent opacity-100 rounded-sm"></div>
          </div>
        </div>
      </div>
    </div>
  )
})

Tile.displayName = "Tile"


