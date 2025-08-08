"use client"

import { Users, Trophy, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  currentView: "profile" | "bingo" | "leaderboard"
  setCurrentView: (view: "profile" | "bingo" | "leaderboard") => void
}

const navItems = [
  { id: "profile", label: "Profile", icon: Users },
  { id: "bingo", label: "Bingo", icon: LayoutGrid },
  { id: "leaderboard", label: "Ranks", icon: Trophy },
] as const

export default function BottomNav({ currentView, setCurrentView }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-emerald-900/80 backdrop-blur-lg border-t border-emerald-400/20 z-40">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className="flex flex-col items-center justify-center gap-1 text-emerald-300 w-20 transition-all duration-300"
              aria-label={`Go to ${item.label}`}
            >
              <item.icon
                className={cn(
                  "h-6 w-6 transition-all duration-300",
                  isActive ? "text-yellow-300 scale-125 -translate-y-1" : "text-emerald-300",
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-all duration-300",
                  isActive ? "text-yellow-300" : "text-emerald-300",
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-2 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-in fade-in zoom-in"></div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
