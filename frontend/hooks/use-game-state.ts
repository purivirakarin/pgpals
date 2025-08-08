import { useState, useCallback, useMemo } from 'react'
import { GRID_SIZE, ANIMATIONS } from '@/lib/constants'
import { useTelegram } from './use-telegram'
import { useCloudStorage } from './use-cloud-storage'

export interface GameStats {
  completedActivities: number
  totalPoints: number
  daysActive: number
  streakDays: number
  partnerActivities: number
  socialShares: number
}

export function useGameState() {
  const [flippedTiles, setFlippedTiles] = useState<Set<number>>(new Set())
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false)
  const [bingoCompleted, setBingoCompleted] = useState(false)
  const [zoomedTile, setZoomedTile] = useState<number | null>(null)

  const telegram = useTelegram()
  
  // Cloud storage for game state
  const { data: cloudFlippedTiles, setData: setCloudFlippedTiles } = useCloudStorage<number[]>('flipped_tiles', [])

  // Memoized calculations for better performance
  const totalPoints = useMemo(
    () => {
      // Import ACTIVITIES dynamically to avoid circular dependencies
      const ACTIVITIES = [
        { task: "Create a Team Name & Catchphrase with your partner!", points: 15 },
        { task: "Make a drawing of each other", points: 20 },
        { task: "Film a TikTok video challenge or Instagram story with your partner and tag PGPR Instagram", points: 25 },
        { task: "Visit all the NUS Libraries on campus", points: 30 },
        { task: "Visit the children's playground near BLK 14", points: 10 },
        { task: "Take an insta-worthy shot near the Singapore Flyer", points: 15 },
        { task: "Visit the NUS Bukit Timah Campus using the BTC bus", points: 20 },
        { task: "Have a meal at supper stretch with your partner", points: 15 },
        { task: "Make breakfast with your partner", points: 20 },
        { task: "Eat at Frontier Canteen with your partner", points: 10 },
        { task: "Film a food review (~1min) with your partner of any meal bought in PGPR canteen", points: 25 },
        { task: "Film a video of your partner disposing recyclables in at least 2 of the 3 bins", points: 15 },
        { task: "Visit the PGP gym with your partner", points: 10 },
        { task: "Visit West Coast Park and take a cinematic video of the waves", points: 20 },
        { task: "Follow the PGP TikTok and Instagram Account", points: 5 },
        { task: "Wear matching colours with your partner", points: 10 },
        { task: "Create a Spotify Playlist with your partner to be played at finale - winning playlist gets 50 bonus points", points: 35 },
        { task: "Have a picnic at NUS UTown Green with at least 1 other Pair", points: 25 },
        { task: "Play card games/Watch a movie/Anything bonding in any PGP Lounge with at least 2 other partner Pairs", points: 20 },
        { task: "Visit the 'Al Amaan' in NUS and eat with at least 1 other pair", points: 25 },
        { task: "Take a selfie at the Merlion", points: 15 },
        { task: "Visit Marina Bay Sands SkyPark", points: 20 },
        { task: "Explore Gardens by the Bay", points: 25 },
        { task: "Try local street food at a hawker center", points: 15 },
      ].slice(0, GRID_SIZE)
      
      return Array.from(flippedTiles).reduce((sum, index) => sum + ACTIVITIES[index].points, 0)
    },
    [flippedTiles]
  )

  const gameStats = useMemo((): GameStats => ({
    completedActivities: flippedTiles.size,
    totalPoints,
    daysActive: 1, // This would be calculated based on usage
    streakDays: 1, // This would be calculated based on daily usage
    partnerActivities: Math.floor(flippedTiles.size / 2), // Estimate
    socialShares: 0 // This would be tracked
  }), [flippedTiles.size, totalPoints])

  // Optimized tile click handler
  const handleTileClick = useCallback((index: number) => {
    // Haptic feedback
    telegram.selectionFeedback()

    setFlippedTiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      
      // Update cloud storage
      setCloudFlippedTiles(Array.from(newSet))
      
      return newSet
    })
  }, [telegram, setCloudFlippedTiles])

  // Check for completion and trigger animation
  const checkCompletion = useCallback(() => {
    if (flippedTiles.size === GRID_SIZE && !bingoCompleted) {
      setShowCompletionAnimation(true)
      setBingoCompleted(true)
      // Telegram celebration feedback
      telegram.notificationFeedback('success')
      telegram.impactFeedback('heavy')
      
      // Auto-hide animation
      setTimeout(() => {
        setShowCompletionAnimation(false)
      }, ANIMATIONS.COMPLETION_ANIMATION_DURATION)
    } else if (flippedTiles.size < GRID_SIZE && bingoCompleted) {
      setBingoCompleted(false)
    }
  }, [flippedTiles.size, bingoCompleted, telegram])

  return {
    // State
    flippedTiles,
    showCompletionAnimation,
    bingoCompleted,
    zoomedTile,
    totalPoints,
    gameStats,
    
    // Actions
    handleTileClick,
    checkCompletion,
    setZoomedTile,
    setFlippedTiles,
    
    // Cloud sync
    setCloudFlippedTiles,
    cloudFlippedTiles,
  }
}