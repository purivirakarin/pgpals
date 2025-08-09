"use client"

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

interface UnlockedAchievement {
  id: string
  unlockedAt: number
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Steps',
    description: 'Complete your first activity',
    icon: Target,
    condition: (stats) => stats.completedActivities >= 1,
    points: 10,
    rarity: 'common'
  },
  {
    id: 'getting_started',
    title: 'Getting Started',
    description: 'Complete 5 activities',
    icon: Zap,
    condition: (stats) => stats.completedActivities >= 5,
    points: 25,
    rarity: 'common'
  },
  {
    id: 'halfway_hero',
    title: 'Halfway Hero',
    description: 'Complete 50% of all activities',
    icon: Star,
    condition: (stats) => stats.completedActivities >= 10,
    points: 50,
    rarity: 'rare'
  },
  {
    id: 'bingo_master',
    title: 'Bingo Master',
    description: 'Complete all activities',
    icon: Trophy,
    condition: (stats) => stats.completedActivities >= 20,
    points: 100,
    rarity: 'legendary'
  },
  {
    id: 'point_collector',
    title: 'Point Collector',
    description: 'Earn 200+ points',
    icon: Sparkles,
    condition: (stats) => stats.totalPoints >= 200,
    points: 30,
    rarity: 'rare'
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Share your progress 3 times',
    icon: Users,
    condition: (stats) => stats.socialShares >= 3,
    points: 20,
    rarity: 'common'
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Stay active for 7 days in a row',
    icon: Calendar,
    condition: (stats) => stats.streakDays >= 7,
    points: 75,
    rarity: 'epic'
  }
]

interface AchievementSystemProps {
  gameStats: GameStats
  onAchievementUnlocked?: (achievement: Achievement) => void
}

function AchievementSystem({ gameStats, onAchievementUnlocked }: AchievementSystemProps) {
  const { notificationFeedback } = useTelegram()
  const { data: unlockedAchievements, setData: setUnlockedAchievements } = useCloudStorage<UnlockedAchievement[]>('achievements', [])
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    // Check for newly unlocked achievements
    const currentUnlockedIds = new Set(unlockedAchievements.map(a => a.id))
    const newlyUnlocked: Achievement[] = []

    ACHIEVEMENTS.forEach(achievement => {
      if (!currentUnlockedIds.has(achievement.id) && achievement.condition(gameStats)) {
        newlyUnlocked.push(achievement)
      }
    })

    if (newlyUnlocked.length > 0) {
      // Add new achievements to unlocked list
      const updatedUnlocked = [
        ...unlockedAchievements,
        ...newlyUnlocked.map(a => ({ id: a.id, unlockedAt: Date.now() }))
      ]
      setUnlockedAchievements(updatedUnlocked)
      
      // Show achievement notifications
      setNewAchievements(newlyUnlocked)
      
      // Trigger haptic feedback
      notificationFeedback('success')
      
      // Call callback for each achievement
      newlyUnlocked.forEach(achievement => {
        onAchievementUnlocked?.(achievement)
      })

      // Clear notifications after 5 seconds
      setTimeout(() => setNewAchievements([]), 5000)
    }
  }, [gameStats, unlockedAchievements, setUnlockedAchievements, notificationFeedback, onAchievementUnlocked])

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600'
      case 'rare': return 'from-blue-400 to-blue-600'
      case 'epic': return 'from-purple-400 to-purple-600'
      case 'legendary': return 'from-yellow-400 to-orange-500'
    }
  }

  const getRarityBorder = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-400'
      case 'rare': return 'border-blue-400'
      case 'epic': return 'border-purple-400'
      case 'legendary': return 'border-yellow-400'
    }
  }

  return (
    <>
      {/* Achievement Notifications */}
      {newAchievements.map((achievement, index) => (
        <div
          key={achievement.id}
          className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-500"
          style={{ animationDelay: `${index * 200}ms` }}
        >
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

      {/* Achievement Progress (could be shown in a modal or separate view) */}
      <div className="hidden">
        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map(achievement => {
            const isUnlocked = unlockedAchievements.some(a => a.id === achievement.id)
            return (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                  isUnlocked 
                    ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)} ${getRarityBorder(achievement.rarity)} text-white` 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <achievement.icon className={`h-5 w-5 ${isUnlocked ? 'text-white' : 'text-gray-400'}`} />
                  <span className="font-semibold text-sm">{achievement.title}</span>
                </div>
                <p className={`text-xs ${isUnlocked ? 'text-white/90' : 'text-gray-500'}`}>
                  {achievement.description}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${isUnlocked ? 'text-white/80' : 'text-gray-400'}`}>
                    {achievement.points} pts
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isUnlocked ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {achievement.rarity}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default AchievementSystem
