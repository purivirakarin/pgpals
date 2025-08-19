"use client"

import type React from 'react'
import { useState, useEffect } from 'react'
import { Trophy, Star, Zap, Target, Users, Calendar, Sparkles } from 'lucide-react'
import { useTelegram } from '@/hooks/use-telegram'
import { useCloudStorage } from '@/hooks/use-cloud-storage'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  condition: (stats: GameStats) => boolean
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface GameStats {
  completedActivities: number
  totalPoints: number
  daysActive: number
  streakDays: number
  partnerActivities: number
  socialShares: number
}

interface UnlockedAchievement { id: string; unlockedAt: number }

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', title: 'First Steps', description: 'Complete your first activity', icon: Target, condition: (s) => s.completedActivities >= 1, points: 10, rarity: 'common' },
  { id: 'getting_started', title: 'Getting Started', description: 'Complete 5 activities', icon: Zap, condition: (s) => s.completedActivities >= 5, points: 25, rarity: 'common' },
  { id: 'halfway_hero', title: 'Halfway Hero', description: 'Complete 50% of all activities', icon: Star, condition: (s) => s.completedActivities >= 10, points: 50, rarity: 'rare' },
  { id: 'bingo_master', title: 'Bingo Master', description: 'Complete all activities', icon: Trophy, condition: (s) => s.completedActivities >= 20, points: 100, rarity: 'legendary' },
  { id: 'point_collector', title: 'Point Collector', description: 'Earn 200+ points', icon: Sparkles, condition: (s) => s.totalPoints >= 200, points: 30, rarity: 'rare' },
  { id: 'social_butterfly', title: 'Social Butterfly', description: 'Share your progress 3 times', icon: Users, condition: (s) => s.socialShares >= 3, points: 20, rarity: 'common' },
  { id: 'streak_master', title: 'Streak Master', description: 'Stay active for 7 days in a row', icon: Calendar, condition: (s) => s.streakDays >= 7, points: 75, rarity: 'epic' },
]

interface AchievementSystemProps { gameStats: GameStats; onAchievementUnlocked?: (achievement: Achievement) => void }

export default function AchievementSystem({ gameStats, onAchievementUnlocked }: AchievementSystemProps) {
  const { notificationFeedback } = useTelegram()
  const { data: unlockedAchievements, setData: setUnlockedAchievements } = useCloudStorage<UnlockedAchievement[]>('achievements', [])
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    const currentUnlockedIds = new Set(unlockedAchievements.map(a => a.id))
    const newlyUnlocked: Achievement[] = []
    ACHIEVEMENTS.forEach(achievement => {
      if (!currentUnlockedIds.has(achievement.id) && achievement.condition(gameStats)) {
        newlyUnlocked.push(achievement)
      }
    })
    if (newlyUnlocked.length > 0) {
      const updatedUnlocked = [ ...unlockedAchievements, ...newlyUnlocked.map(a => ({ id: a.id, unlockedAt: Date.now() })) ]
      setUnlockedAchievements(updatedUnlocked)
      setNewAchievements(newlyUnlocked)
      notificationFeedback('success')
      newlyUnlocked.forEach(a => onAchievementUnlocked?.(a))
      setTimeout(() => setNewAchievements([]), 5000)
    }
  }, [gameStats, unlockedAchievements, setUnlockedAchievements, notificationFeedback, onAchievementUnlocked])

  const getRarityColor = (rarity: Achievement['rarity']) => ({
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500'
  }[rarity])

  const getRarityBorder = (rarity: Achievement['rarity']) => ({
    common: 'border-gray-400',
    rare: 'border-blue-400',
    epic: 'border-purple-400',
    legendary: 'border-yellow-400'
  }[rarity])

  return (
    <>
      {newAchievements.map((achievement, index) => (
        <div key={achievement.id} className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-500" style={{ animationDelay: `${index * 200}ms` }}>
          <div className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} p-4 rounded-xl shadow-2xl border-2 ${getRarityBorder(achievement.rarity)} max-w-sm`}>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <achievement.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Achievement Unlocked!</h3>
                <p className="text-white/90 text-xs">{achievement.title}</p>
                <p className="text-white/70 text-xs">+{achievement.points} points</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}


