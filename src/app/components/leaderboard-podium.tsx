"use client"

import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

type PodiumUser = { id: string; name: string; telegram_username?: string | null }

export interface PodiumEntry {
  name: string
  score: number
  avatar: string
  users?: PodiumUser[]
  completed?: number
  rank?: number
}

interface LeaderboardPodiumProps {
  entries: PodiumEntry[]
  max: number
}

function PodiumCard({ entry, place, max }: { entry: PodiumEntry; place: 1 | 2 | 3; max: number }) {
  const ringPercent = Math.max(0, Math.min(100, Math.round((entry.score / Math.max(1, max)) * 100)))
  const palette = {
    1: { from: 'from-yellow-300', to: 'to-amber-500', ring: 'bg-yellow-400/30', text: 'text-yellow-900' },
    2: { from: 'from-slate-200', to: 'to-slate-500', ring: 'bg-slate-300/30', text: 'text-slate-900' },
    3: { from: 'from-amber-300', to: 'to-orange-500', ring: 'bg-amber-300/30', text: 'text-amber-900' },
  }[place]
  return (
    <div className={cn(
      "relative rounded-2xl p-4 shadow-2xl backdrop-blur-sm border",
      place === 1 ? "scale-105 z-10 border-yellow-300/50 bg-gradient-to-br from-emerald-800/60 to-emerald-900/60" :
      place === 2 ? "border-slate-300/40 bg-gradient-to-br from-emerald-800/40 to-emerald-900/40" :
                    "border-amber-300/40 bg-gradient-to-br from-emerald-800/40 to-emerald-900/40"
    )}>
      {/* Ring progress */}
      <div className="mx-auto mb-3 h-24 w-24 relative">
        <div className="absolute inset-0 rounded-full bg-emerald-700/30" />
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className={cn("absolute inset-0", palette.ring)} style={{ clipPath: `polygon(0 0, ${ringPercent}% 0, ${ringPercent}% 100%, 0% 100%)` }} />
        </div>
        <div className="absolute inset-2 rounded-full bg-emerald-950/60 border border-emerald-400/20 flex items-center justify-center">
          <span className="text-3xl select-none">{entry.avatar}</span>
        </div>
        <div className="absolute -top-3 -right-3 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-1 shadow">
          {Math.round(ringPercent)}%
        </div>
      </div>
      {/* Place badge */}
      <div className={cn("mx-auto mb-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold shadow border", palette.from, palette.to, "bg-gradient-to-r text-emerald-950 border-emerald-200/40") }>
        <Trophy className="h-3 w-3" />
        {place === 1 ? "Champion" : place === 2 ? "Runner-Up" : "Third Place"}
      </div>
      {/* Names */}
      <h3 className="text-center text-emerald-100 font-bold text-sm truncate">{entry.name}</h3>
      {entry.users && entry.users.length === 2 && (
        <p className="text-center text-emerald-300/90 text-[11px] truncate">
          @{entry.users[0]?.telegram_username || entry.users[0]?.name} & @{entry.users[1]?.telegram_username || entry.users[1]?.name}
        </p>
      )}
      {/* Numbers */}
      <div className="mt-3 flex items-end justify-center gap-4">
        <div className="text-center">
          <div className="text-[10px] text-emerald-300/80">Points</div>
          <div className="text-lg font-extrabold text-emerald-100">{entry.score}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-emerald-300/80">Quests</div>
          <div className="text-lg font-extrabold text-emerald-100">{entry.completed ?? 0}</div>
        </div>
      </div>
    </div>
  )
}

export default function LeaderboardPodium({ entries, max }: LeaderboardPodiumProps) {
  const podium = [entries[1], entries[0], entries[2]].map((e, i) => ({ e, place: ([2,1,3] as const)[i] }))
  return (
    <div className="relative">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-green-300/10 blur-2xl" />
      <div className="grid grid-cols-3 gap-4 items-end">
        <div className="pt-6">
          {entries[1] && <PodiumCard entry={entries[1]} place={2} max={max} />}
        </div>
        <div>
          {entries[0] && <PodiumCard entry={entries[0]} place={1} max={max} />}
        </div>
        <div className="pt-10">
          {entries[2] && <PodiumCard entry={entries[2]} place={3} max={max} />}
        </div>
      </div>
    </div>
  )
}


