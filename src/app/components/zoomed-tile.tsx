"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"
import { GRID_CONFIG } from "@/lib/constants"
import styles from "@/styles/animations.module.css"

interface ZoomedTileProps {
  tileIndex: number
  isFlipped: boolean
  activity: { task: string; points: number }
  bgPosition: { left: number; top: number }
}

export const ZoomedTile = memo<ZoomedTileProps>(({ tileIndex, isFlipped, activity, bgPosition }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className={styles.tileZoomDisplay} id={`zoomed-tile-${tileIndex}`}>
        <div className={cn("relative w-full h-full", styles.preserve3d)}>
          <div className={cn("absolute inset-0 w-full h-full transition-transform duration-700", styles.backfaceHidden, isFlipped ? styles.rotateY180 : "") }>
            <div className="w-full h-full bg-gradient-to-b from-amber-50 via-stone-50 to-amber-100 rounded-lg border-2 border-stone-300 shadow-2xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-stone-200/40 rounded-md"></div>
              <div className="absolute inset-1 bg-gradient-to-b from-stone-100 to-amber-50 rounded-sm border border-stone-200/50 shadow-inner"></div>
              <div className="absolute top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-stone-400/60 rounded-tl-sm"></div>
              <div className="absolute top-1 right-1 w-2 h-2 border-r-2 border-t-2 border-stone-400/60 rounded-tr-sm"></div>
              <div className="absolute bottom-1 left-1 w-2 h-2 border-l-2 border-b-2 border-stone-400/60 rounded-bl-sm"></div>
              <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-stone-400/60 rounded-br-sm"></div>
              <div className="relative z-10 text-stone-700 font-semibold text-lg text-center px-4 leading-tight drop-shadow-sm">{activity.task}</div>
              <div className="absolute bottom-3 right-3 bg-emerald-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md border border-emerald-300">{activity.points} pts</div>
            </div>
          </div>
          <div className={cn("absolute inset-0 w-full h-full transition-transform duration-700", styles.backfaceHidden, styles.rotateY180, isFlipped ? styles.rotateY0 : "") }>
            <div className="w-full h-full bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-700 rounded-lg border-2 border-emerald-400 shadow-2xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-300/20 via-transparent to-emerald-800/10 rounded-md"></div>
              <div className="absolute inset-1 bg-gradient-to-b from-emerald-400/10 to-emerald-600/10 rounded-sm border border-emerald-300/20 shadow-inner"></div>
              <div className="absolute top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-emerald-200/40 rounded-tl-sm"></div>
              <div className="absolute top-1 right-1 w-2 h-2 border-r-2 border-t-2 border-emerald-200/40 rounded-tr-sm"></div>
              <div className="absolute bottom-1 left-1 w-2 h-2 border-l-2 border-b-2 border-emerald-200/40 rounded-bl-sm"></div>
              <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-emerald-200/40 rounded-br-sm"></div>
              <div className="absolute inset-0 opacity-40 bg-cover" style={{ backgroundImage: "url(/pgpals-logo.png)", backgroundPosition: `${bgPosition.left}% ${bgPosition.top}%`, backgroundSize: `${GRID_CONFIG.COLS * 100}% ${GRID_CONFIG.ROWS * 100}%` }}></div>
              <div className="relative z-10 text-emerald-100 font-bold text-4xl drop-shadow-xl">✓</div>
              <div className="absolute bottom-3 right-3 bg-emerald-200 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full shadow-md">{activity.points} pts</div>
              <div className="absolute inset-1 bg-gradient-to-br from-emerald-200/20 to-transparent opacity-100 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

ZoomedTile.displayName = "ZoomedTile"


