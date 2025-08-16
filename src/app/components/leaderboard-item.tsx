"use client"

import { memo } from "react"
import { Users } from "lucide-react"

interface LeaderboardItemProps {
  pair: {
    name: string
    score: number
    avatar: string
    users?: Array<{ id: string; name: string; telegram_username?: string | null }>
    completed?: number
    rank?: number
  }
  index: number
  max?: number
}

export const LeaderboardItem = memo<LeaderboardItemProps>(
  ({ pair, index, max = 1 }) => {
    const percent = Math.max(0, Math.min(100, Math.round((pair.score / max) * 100)))
    return (
      <div className="relative p-3 mb-3 rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-800/40 to-emerald-900/30 shadow-xl overflow-hidden">
        {/* Accent rank badge */}
        <div className="absolute -left-2 -top-2">
          <div className="rounded-br-xl rounded-tl-xl bg-yellow-400 text-yellow-900 text-xs font-extrabold px-2 py-1 shadow">
            #{pair.rank ?? index + 1}
          </div>
        </div>

        {/* Progress background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-0 h-full bg-emerald-500/10" style={{ width: `${percent}%` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-2xl select-none">{pair.avatar}</div>
            <div className="min-w-0">
              <h3 className="truncate text-emerald-100 font-bold text-sm">{pair.name}</h3>
              {pair.users && pair.users.length === 2 && (
                <p className="truncate text-emerald-200/80 text-[11px]">
                  @{pair.users[0]?.telegram_username || pair.users[0]?.name} & @{pair.users[1]?.telegram_username || pair.users[1]?.name}
                </p>
              )}
              <p className="text-emerald-300 text-[11px] flex items-center gap-1">
                <Users className="h-3 w-3" /> Pair #{pair.rank ?? index + 1}
                {typeof pair.completed === 'number' && <span className="ml-2 text-emerald-200/90">• {pair.completed} quests</span>}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-extrabold text-emerald-100 tracking-tight">{pair.score}</div>
            <p className="text-emerald-300 text-[11px]">pts</p>
          </div>
        </div>
      </div>
    )
  },
)

LeaderboardItem.displayName = "LeaderboardItem"

export default LeaderboardItem


