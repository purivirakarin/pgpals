"use client"

import { memo } from "react"
import { Users } from "lucide-react"

interface LeaderboardItemProps {
  pair: { name: string; score: number; avatar: string }
  index: number
}

export const LeaderboardItem = memo<LeaderboardItemProps>(
  ({ pair, index }) => {
    return (
      <div
        className="flex items-center justify-between p-2 mb-2 bg-gradient-to-r from-emerald-700/40 to-green-700/40 rounded-lg border border-emerald-400/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-emerald-600/40 animate-in slide-in-from-bottom duration-500"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="flex items-center gap-2">
          <div className="text-lg">{pair.avatar}</div>
          <div>
            <h3 className="text-emerald-100 font-bold text-sm">{pair.name}</h3>
            <p className="text-emerald-300 text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              Pair #{index + 1}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-emerald-100">{pair.score}</div>
          <p className="text-emerald-300 text-xs">pts</p>
        </div>
      </div>
    )
  },
)

LeaderboardItem.displayName = "LeaderboardItem"

export default LeaderboardItem


