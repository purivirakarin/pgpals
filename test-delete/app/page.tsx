"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo, memo, Suspense, lazy } from "react"
import { Trophy, Users, Sparkles, Star, Edit3, Save, X, TextIcon as Telegram } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { GRID_CONFIG, GRID_SIZE, ANIMATIONS, DEFAULT_PROFILE } from "@/lib/constants"
import BottomNav from "./components/bottom-nav"
import { Tile } from "./components/tile"
import { ProfileCard, type ProfileData } from "./components/profile-card"
import { LeaderboardItem } from "./components/leaderboard-item"
import { ZoomedTile } from "./components/zoomed-tile"
import { StorageStatus } from "./components/storage-status"
import { TelegramDetector, TelegramGuide } from "./components/telegram-detector"
import { useTelegram } from '@/hooks/use-telegram'
import { useTelegramTheme } from '@/hooks/use-telegram-theme'
import { useCloudStorage } from '@/hooks/use-cloud-storage'
import TelegramShareButton from './components/telegram-share-button'
import AchievementSystem from './components/achievement-system'
import styles from "@/styles/animations.module.css"

// Lazy-loaded components for better initial load performance
const CompletionAnimation = lazy(() => import("./components/completion-animation"))
const SubmissionModal = lazy(() => import("./components/submission-modal"))

// Grid configuration moved to constants file

// API base URL for backend
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

// Fallback activities used if API is unavailable
const FALLBACK_ACTIVITIES = [
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
  {
    task: "Create a Spotify Playlist with your partner to be played at finale - winning playlist gets 50 bonus points",
    points: 35,
  },
  { task: "Have a picnic at NUS UTown Green with at least 1 other Pair", points: 25 },
  {
    task: "Play card games/Watch a movie/Anything bonding in any PGP Lounge with at least 2 other partner Pairs",
    points: 20,
  },
  { task: "Visit the 'Al Amaan' in NUS and eat with at least 1 other pair", points: 25 },
  { task: "Take a selfie at the Merlion", points: 15 },
  { task: "Visit Marina Bay Sands SkyPark", points: 20 },
  { task: "Explore Gardens by the Bay", points: 25 },
  { task: "Try local street food at a hawker center", points: 15 },
].slice(0, GRID_SIZE)

// No leaderboard fallback; we rely on API and show empty/loading states





// Components now imported from separate files



// Main component
export default function PGPals() {
  const [activities, setActivities] = useState<{ task: string; points: number }[]>(FALLBACK_ACTIVITIES)
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number; avatar: string }[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(true)
  const [flippedTiles, setFlippedTiles] = useState<Set<number>>(new Set())
  const [currentView, setCurrentView] = useState<"profile" | "bingo" | "leaderboard">("bingo")
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false)
  const [editingUser, setEditingUser] = useState(false)
  const [bingoCompleted, setBingoCompleted] = useState(false)

  const [userProfile, setUserProfile] = useState<ProfileData>({
    name: DEFAULT_PROFILE.USER_NAME,
    major: DEFAULT_PROFILE.USER_MAJOR,
    hobby: DEFAULT_PROFILE.USER_HOBBY,
  })

  const [partnerProfile, setPartnerProfile] = useState<ProfileData>({
    name: DEFAULT_PROFILE.PARTNER_NAME,
    major: DEFAULT_PROFILE.PARTNER_MAJOR,
    hobby: DEFAULT_PROFILE.PARTNER_HOBBY,
  })

  const [tempUserProfile, setTempUserProfile] = useState<ProfileData>(userProfile)

  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [submissionTileIndex, setSubmissionTileIndex] = useState<number | null>(null)
  const [submissionImage, setSubmissionImage] = useState<File | null>(null)
  const [submissionImageUrl, setSubmissionImageUrl] = useState<string | null>(null)
  const [submissionCaption, setSubmissionCaption] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [zoomedTile, setZoomedTile] = useState<number | null>(null)

  // Telegram integration
  const telegram = useTelegram()
  const { isDark } = useTelegramTheme()

  // Cloud storage for game state
  const { 
    data: cloudFlippedTiles, 
    setData: setCloudFlippedTiles, 
    isUsingLocalStorage: tilesUsingLocal 
  } = useCloudStorage<number[]>('flipped_tiles', [])
  
  const { 
    data: cloudUserProfile, 
    setData: setCloudUserProfile,
    isUsingLocalStorage: profileUsingLocal 
  } = useCloudStorage<ProfileData>('user_profile', {
    name: telegram.user?.first_name || DEFAULT_PROFILE.USER_NAME,
    major: DEFAULT_PROFILE.USER_MAJOR,
    hobby: DEFAULT_PROFILE.USER_HOBBY
  })

  // Memoized total points calculation - moved before gameStats
  const totalPoints = useMemo(
    () => Array.from(flippedTiles).reduce((sum, index) => sum + (activities[index]?.points || 0), 0),
    [flippedTiles, activities],
  )

  // Game statistics for achievements - now totalPoints is available
  const gameStats = useMemo(() => ({
    completedActivities: flippedTiles.size,
    totalPoints,
    daysActive: 1, // This would be calculated based on usage
    streakDays: 1, // This would be calculated based on daily usage
    partnerActivities: Math.floor(flippedTiles.size / 2), // Estimate
    socialShares: 0 // This would be tracked
  }), [flippedTiles.size, totalPoints])

  // Sync local state with cloud storage
  useEffect(() => {
    if (cloudFlippedTiles.length > 0) {
      setFlippedTiles(new Set(cloudFlippedTiles))
    }
  }, [cloudFlippedTiles])

  useEffect(() => {
    if (cloudUserProfile.name !== DEFAULT_PROFILE.USER_NAME) {
      setUserProfile(cloudUserProfile)
    }
  }, [cloudUserProfile])

  // Load activities from API
  useEffect(() => {
    const loadActivities = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/quests`)
        if (!res.ok) throw new Error('Failed to fetch quests')
        const quests: Array<{ title?: string; description?: string; points?: number }> = await res.json()
        const mapped = quests
          .slice(0, GRID_SIZE)
          .map(q => ({ task: q.title || q.description || 'Quest', points: Number(q.points) || 0 }))
        setActivities(mapped.length ? mapped : FALLBACK_ACTIVITIES)
      } catch (e) {
        setActivities(FALLBACK_ACTIVITIES)
      }
    }
    loadActivities()
  }, [])

  // Load leaderboard from API
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLeaderboardLoading(true)
        const res = await fetch(`${API_BASE}/api/leaderboard?limit=10`)
        if (!res.ok) throw new Error('Failed to fetch leaderboard')
        const entries: Array<{ name?: string; total_points?: number; rank?: number }> = await res.json()
        const mapped = entries.map((e) => ({
          name: e.name || 'Participant',
          score: Number(e.total_points) || 0,
          avatar: e.rank === 1 ? '🏆' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : '⭐'
        }))
        setLeaderboard(mapped)
      } catch (e) {
        setLeaderboard([])
      } finally {
        setLeaderboardLoading(false)
      }
    }
    loadLeaderboard()
  }, [])



  // Handle tile click with useCallback for better performance
  const handleTileClick = useCallback(
    (index: number) => {
      // Haptic feedback
      telegram.selectionFeedback()

      if (flippedTiles.has(index)) {
        // If already flipped, unflip it
        setFlippedTiles((prev) => {
          const newSet = new Set(prev)
          newSet.delete(index)
          // Sync to cloud
          setCloudFlippedTiles(Array.from(newSet))
          return newSet
        })
      } else {
        // If not flipped, show submission modal
        setSubmissionTileIndex(index)
        setShowSubmissionModal(true)
        setSubmissionImage(null)
        setSubmissionImageUrl(null)
        setSubmissionCaption("")
      }
    },
    [flippedTiles, telegram, setCloudFlippedTiles],
  )

  // Handle image upload with useCallback
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSubmissionImage(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setSubmissionImageUrl(url)
    }
  }, [])

  // Handle submission submit with useCallback
  const handleSubmissionSubmit = useCallback(async () => {
    if (!submissionImage || !submissionCaption.trim() || submissionTileIndex === null) return

    setIsSubmitting(true)

    // Success haptic feedback
    telegram.notificationFeedback('success')

    // Start modal exit animation first
    const modal = document.querySelector(".submission-modal")
    if (modal) {
              modal.classList.add(styles.modalExit)
    }

    // Wait for modal to start closing, then begin dramatic tile zoom
    setTimeout(() => {
      setShowSubmissionModal(false)
      setIsSubmitting(false)

      // Clean up image URL
      if (submissionImageUrl) {
        URL.revokeObjectURL(submissionImageUrl)
      }

      // Start the dramatic zoom effect
      setZoomedTile(submissionTileIndex)

      // Calculate target position for the tile in the grid
      const gridContainer = document.querySelector(`[data-grid-container="true"]`)
      const targetTile = gridContainer?.children[submissionTileIndex] as HTMLElement

      if (targetTile && gridContainer) {
        const gridRect = gridContainer.getBoundingClientRect()
        const tileRect = targetTile.getBoundingClientRect()

        // Calculate relative position within the grid
        const targetX = tileRect.left + tileRect.width / 2 - window.innerWidth / 2
        const targetY = tileRect.top + tileRect.height / 2 - window.innerHeight / 2

        // Apply the drag animation after zoom
        setTimeout(() => {
          const zoomedElement = document.getElementById(`zoomed-tile-${submissionTileIndex}`)
          if (zoomedElement) {
            zoomedElement.style.setProperty("--target-x", `${targetX}px`)
            zoomedElement.style.setProperty("--target-y", `${targetY}px`)
            zoomedElement.classList.add(styles.tileDragToGrid)
          }
        }, 1500) // Start drag after 1.5s of zoom
      }

      // Simulate upload delay during zoom and drag
      setTimeout(() => {
        // Flip the tile while dragging
        setFlippedTiles((prev) => {
          const newSet = new Set(prev)
          newSet.add(submissionTileIndex!)
          // Sync to cloud
          setCloudFlippedTiles(Array.from(newSet))
          return newSet
        })

        // Reset zoom after drag completes
        setTimeout(() => {
          setZoomedTile(null)
          setSubmissionTileIndex(null)
        }, 1000) // Give time for drag animation
      }, 2500) // 2.5 seconds total (zoom + drag)
    }, 500) // Short delay for modal to start closing
  }, [submissionImage, submissionCaption, submissionTileIndex, submissionImageUrl, telegram, setCloudFlippedTiles])

  // Handle modal close with useCallback
  const handleModalClose = useCallback(() => {
    if (!isSubmitting) {
      setShowSubmissionModal(false)
      setSubmissionTileIndex(null)
      setSubmissionImage(null)
      if (submissionImageUrl) {
        URL.revokeObjectURL(submissionImageUrl)
      }
      setSubmissionImageUrl(null)
      setSubmissionCaption("")
    }
  }, [isSubmitting, submissionImageUrl])

  // Check for completion and trigger animation
  useEffect(() => {
    if (flippedTiles.size === GRID_SIZE && !bingoCompleted) {
      setShowCompletionAnimation(true)
      setBingoCompleted(true)
    // Telegram celebration feedback
    telegram.notificationFeedback('success')
    telegram.impactFeedback('heavy')
  } else if (flippedTiles.size < GRID_SIZE && bingoCompleted) {
    setBingoCompleted(false)
  }
}, [flippedTiles.size, bingoCompleted, telegram])

  // Handle animation timeout
  useEffect(() => {
    if (showCompletionAnimation) {
      const timer = setTimeout(() => {
        setShowCompletionAnimation(false)
      }, ANIMATIONS.COMPLETION_ANIMATION_DURATION)
      return () => clearTimeout(timer)
    }
  }, [showCompletionAnimation])

  // Navigation functions with useCallback
  const navigateToProfile = useCallback(() => setCurrentView("profile"), [])
  const navigateToLeaderboard = useCallback(() => setCurrentView("leaderboard"), [])
  const navigateToBingo = useCallback(() => setCurrentView("bingo"), [])

  // Profile editing functions with useCallback
  const handleEditUser = useCallback(() => {
    setTempUserProfile(userProfile)
    setEditingUser(true)
  }, [userProfile])

  const handleSaveUser = useCallback(() => {
    setUserProfile(tempUserProfile)
    setCloudUserProfile(tempUserProfile)
    setEditingUser(false)
    telegram.notificationFeedback('success')
  }, [tempUserProfile, setCloudUserProfile, telegram])

  const handleCancelUser = useCallback(() => {
    setTempUserProfile(userProfile)
    setEditingUser(false)
  }, [userProfile])

  const handleProfileChange = useCallback((field: keyof ProfileData, value: string) => {
    setTempUserProfile((prev) => ({ ...prev, [field]: value }))
  }, [])

  const openTelegram = useCallback(() => {
    window.open("https://t.me/pgpals_bot", "_blank")
  }, [])

  // Helper function to get background position for each tile (dynamic grid)
  const getTileBackgroundPosition = useCallback((index: number) => {
    // Check if grid dimensions are compatible with image aspect ratio
    const gridAspectRatio = GRID_CONFIG.COLS / GRID_CONFIG.ROWS
    const isLogoEnabled = gridAspectRatio >= 0.5 && gridAspectRatio <= 2.0
    
    if (!isLogoEnabled) return { left: 0, top: 0 }

    const row = Math.floor(index / GRID_CONFIG.COLS)
    const col = index % GRID_CONFIG.COLS

    // Calculate position as percentage
    const left = GRID_CONFIG.COLS > 1 ? (col / (GRID_CONFIG.COLS - 1)) * 100 : 50
    const top = GRID_CONFIG.ROWS > 1 ? (row / (GRID_CONFIG.ROWS - 1)) * 100 : 50

    return { left, top }
  }, [])

  // Memoized background position for zoomed tile
  const zoomedTileBgPosition = useMemo(
    () => (zoomedTile !== null ? getTileBackgroundPosition(zoomedTile) : { left: 0, top: 0 }),
    [zoomedTile, getTileBackgroundPosition],
  )

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isDark ? 'text-gray-100' : 'text-white'
    }`}>
      <TelegramDetector />
      {/* Primary Background Gradient */}
      <div className={`absolute inset-0 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-950 via-slate-900 to-gray-800' 
          : 'bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-800'
      }`}></div>

      {/* Secondary Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-green-800/50 via-transparent to-emerald-600/30"></div>

      {/* Animated Gradient Orbs - Responsive */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-gradient-radial from-emerald-400/20 to-transparent rounded-full blur-2xl animate-pulse will-change-transform"></div>
        <div
          className="absolute top-3/4 right-1/4 w-40 h-40 bg-gradient-radial from-green-300/15 to-transparent rounded-full blur-2xl animate-pulse will-change-transform"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-radial from-emerald-500/10 to-transparent rounded-full blur-xl animate-pulse will-change-transform"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(34,197,94,0.1)_41%,rgba(34,197,94,0.1)_43%,transparent_44%)] bg-[length:40px_40px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(-30deg,transparent_40%,rgba(16,185,129,0.1)_41%,rgba(16,185,129,0.1)_43%,transparent_44%)] bg-[length:40px_40px]"></div>
      </div>

      {/* Moving Particles - Responsive */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Horizontal moving particles */}
        <div className="absolute top-16 -left-4 w-0.5 h-0.5 bg-emerald-300/40 rounded-full animate-[moveRight_15s_linear_infinite] will-change-transform"></div>
        <div className="absolute top-24 -left-4 w-1 h-1 bg-green-200/30 rounded-full animate-[moveRight_20s_linear_infinite] delay-2000 will-change-transform"></div>
        <div className="absolute top-32 -left-4 w-0.5 h-0.5 bg-emerald-400/50 rounded-full animate-[moveRight_18s_linear_infinite] delay-4000 will-change-transform"></div>
        <div className="absolute top-40 -left-4 w-0.5 h-0.5 bg-green-300/35 rounded-full animate-[moveRight_22s_linear_infinite] delay-6000 will-change-transform"></div>
        <div className="absolute top-48 -left-4 w-1 h-1 bg-emerald-200/45 rounded-full animate-[moveRight_16s_linear_infinite] delay-8000 will-change-transform"></div>

        <div className="absolute bottom-16 -left-4 w-0.5 h-0.5 bg-emerald-300/40 rounded-full animate-[moveRight_19s_linear_infinite] delay-1000 will-change-transform"></div>
        <div className="absolute bottom-24 -left-4 w-0.5 h-0.5 bg-green-200/30 rounded-full animate-[moveRight_17s_linear_infinite] delay-3000 will-change-transform"></div>
        <div className="absolute bottom-32 -left-4 w-1 h-1 bg-emerald-400/50 rounded-full animate-[moveRight_21s_linear_infinite] delay-5000 will-change-transform"></div>
        <div className="absolute bottom-40 -left-4 w-0.5 h-0.5 bg-green-300/35 rounded-full animate-[moveRight_14s_linear_infinite] delay-7000 will-change-transform"></div>

        {/* Diagonal moving particles */}
        <div className="absolute top-8 -left-4 w-0.5 h-0.5 bg-emerald-300/30 rounded-full animate-[moveDiagonal_25s_linear_infinite] will-change-transform"></div>
        <div className="absolute top-48 -left-4 w-1 h-1 bg-green-200/25 rounded-full animate-[moveDiagonal_30s_linear_infinite] delay-5000 will-change-transform"></div>
        <div className="absolute bottom-8 -left-4 w-0.5 h-0.5 bg-emerald-400/40 rounded-full animate-[moveDiagonal_28s_linear_infinite] delay-10000 will-change-transform"></div>

        {/* Vertical floating particles */}
        <div className="absolute left-16 -top-4 w-0.5 h-0.5 bg-emerald-300/35 rounded-full animate-[moveDown_20s_linear_infinite] will-change-transform"></div>
        <div className="absolute left-32 -top-4 w-1 h-1 bg-green-200/30 rounded-full animate-[moveDown_24s_linear_infinite] delay-3000 will-change-transform"></div>
        <div className="absolute right-16 -top-4 w-0.5 h-0.5 bg-emerald-400/45 rounded-full animate-[moveDown_18s_linear_infinite] delay-6000 will-change-transform"></div>
        <div className="absolute right-32 -top-4 w-0.5 h-0.5 bg-green-300/40 rounded-full animate-[moveDown_22s_linear_infinite] delay-9000 will-change-transform"></div>
      </div>

      {/* Subtle Noise Texture */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml,%3Csvg viewBox=0 0 256 256 xmlns=http://www.w3.org/2000/svg%3E%3Cfilter id=noiseFilter%3E%3CfeTurbulence type=fractalNoise baseFrequency=0.9 numOctaves=4 stitchTiles=stitch/%3E%3C/filter%3E%3Crect width=100% height=100% filter=url(%23noiseFilter)/%3E%3C/svg%3E')]"></div>

      {/* Radial Spotlight Effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-emerald-950/40"></div>

      {/* Zoom overlay - only show when tile is actually zoomed */}
      {zoomedTile !== null && <div className="fixed inset-0 bg-black/70 z-40 animate-in fade-in duration-500"></div>}

      {/* Zoomed Tile Display - Responsive */}
      {zoomedTile !== null && activities[zoomedTile] && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none p-4">
          {/* Achievement Title - Responsive */}
          <div className="mb-4 text-center animate-in fade-in duration-500 delay-300">
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-2xl">Achievement Unlocked!</h2>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-2 rounded-full text-sm font-bold shadow-2xl border-2 border-yellow-300">
              <Sparkles className="inline h-4 w-4 mr-1" />
              {activities[zoomedTile]?.points ?? 0} Points
              <Star className="inline h-4 w-4 ml-1" />
            </div>
          </div>

          {/* Zoomed Tile - Memoized component */}
          <ZoomedTile
            tileIndex={zoomedTile}
            isFlipped={flippedTiles.has(zoomedTile)}
            activity={activities[zoomedTile]}
            bgPosition={zoomedTileBgPosition}
          />
        </div>
      )}

      {/* Completion Animation Overlay - Lazy loaded */}
      <Suspense fallback={null}>
        {showCompletionAnimation && <CompletionAnimation totalPoints={totalPoints} gridSize={GRID_SIZE} />}
      </Suspense>

      {/* Submission Modal - Lazy loaded */}
      <Suspense fallback={null}>
        {showSubmissionModal && (
          <SubmissionModal
            isSubmitting={isSubmitting}
            submissionTileIndex={submissionTileIndex}
            submissionImage={submissionImage}
            submissionImageUrl={submissionImageUrl}
            submissionCaption={submissionCaption}
            onClose={handleModalClose}
            onImageUpload={handleImageUpload}
            onCaptionChange={setSubmissionCaption}
            onSubmit={handleSubmissionSubmit}
            activity={submissionTileIndex !== null ? activities[submissionTileIndex] : null}
          />
        )}
      </Suspense>

      {/* Telegram Guide for non-Telegram users */}
      <TelegramGuide />

      {/* Main Content */}
      <div className="relative z-10">
        {currentView === "profile" && (
          <div className="container mx-auto px-2 py-4 animate-in slide-in-from-left duration-500">
            {/* Header - Responsive */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img
                  src="/pgpals-logo.png"
                  alt="PGPals Logo"
                  className={cn("h-8 w-8 object-contain", styles.animateFloat)}
                  loading="lazy"
                />
                <h1 className="text-2xl font-bold text-emerald-100 tracking-wider drop-shadow-2xl">PGPals Profiles</h1>
              </div>
              <p className="text-emerald-200 text-sm font-medium">Your Partnership Details</p>
              <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-green-300 mx-auto mt-2 rounded-full"></div>
            </div>

            {/* Clipboards - Responsive */}
            <div className="max-w-md mx-auto flex flex-col gap-8">
              {/* User Profile Card - Memoized component */}
              <ProfileCard
                profile={userProfile}
                isUser={true}
                isEditing={editingUser}
                tempProfile={tempUserProfile}
                onEdit={handleEditUser}
                onSave={handleSaveUser}
                onCancel={handleCancelUser}
                onProfileChange={handleProfileChange}
              />

              {/* Partner Profile Card - Memoized component */}
              <ProfileCard profile={partnerProfile} isUser={false} />
            </div>

            {/* Telegram Button - Responsive */}
            <div className="text-center mt-6">
              <Button
                onClick={openTelegram}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-2xl transform transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <Telegram className="text-lg" />
                Join PGPals Telegram
              </Button>
              <p className="text-emerald-200 text-xs mt-2">Connect with your PGPals community!</p>
            </div>
          </div>
        )}

        {currentView === "bingo" && (
          <div className="container mx-auto px-2 py-4 animate-in slide-in-from-right duration-500">
            {/* Enhanced Header - Responsive */}
            <div className="text-center mb-4 relative">
              {/* Floating decorative elements around title - Responsive */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-full max-w-2xl">
                <div className={cn("absolute -top-2 -left-4", styles.animateFloat)}>
                  <Sparkles className="h-3 w-3 text-emerald-300/60" />
                </div>
                <div className={cn("absolute -top-1 -right-4 delay-1000", styles.animateFloat)}>
                  <Star className="h-2.5 w-2.5 text-green-300/50" />
                </div>
                <div className={cn("absolute -bottom-2 -left-6 delay-2000", styles.animateFloat)}>
                  <Star className="h-2 w-2 text-emerald-400/40" />
                </div>
                <div className={cn("absolute -bottom-1 -right-6 delay-3000", styles.animateFloat)}>
                  <Sparkles className="h-2.5 w-2.5 text-green-200/50" />
                </div>
              </div>

              {/* Main title with enhanced styling - Responsive */}
              <div className="relative">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <img
                    src="/pgpals-logo.png"
                    alt="PGPals Logo"
                    className={cn("h-12 w-12 object-contain drop-shadow-2xl", styles.animateFloat)}
                    loading="lazy"
                  />
                  <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-green-100 to-emerald-300 tracking-wider drop-shadow-2xl animate-in fade-in duration-1000 relative leading-none">
                    <span className="relative inline-block animate-[titleGlow_3s_ease-in-out_infinite]">PGPals</span>
                    {/* Subtle glow effect behind text */}
                    <div className="absolute inset-0 text-5xl font-bold text-emerald-300/20 animate-pulse leading-none">
                      PGPals
                    </div>
                  </h1>
                </div>

                {/* Animated underline - Responsive */}
                <div className="relative">
                  <p className="text-emerald-200 text-sm font-medium animate-in fade-in duration-1000 delay-300 mb-2">
                    Prince George's Park Pair Activities
                  </p>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-green-300 mx-auto rounded-full animate-in slide-in-from-bottom duration-1000 delay-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_ease-in-out_infinite] w-full h-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bingo Board - Dynamic Grid - Responsive */}
            <div className="max-w-7xl mx-auto px-1">
              <div
                className={`grid gap-1 p-2 bg-emerald-800/30 rounded-2xl backdrop-blur-sm border border-emerald-400/20 shadow-2xl animate-in zoom-in duration-700 delay-700`}
                style={{
                  gridTemplateColumns: `repeat(${GRID_CONFIG.COLS}, minmax(0, 1fr))`,
                }}
                data-grid-container="true"
              >
                {activities.map((activity, index) => (
                  <Tile
                    key={index}
                    activity={activity}
                    index={index}
                    isFlipped={flippedTiles.has(index)}
                    onTileClick={handleTileClick}
                    animationDelay={ANIMATIONS.TILE_ANIMATION_BASE_DELAY + index * ANIMATIONS.TILE_ANIMATION_STEP_DELAY}
                  />
                ))}
              </div>

              {/* Progress indicator - Responsive */}
              <div className="text-center mt-3 animate-in fade-in duration-1000 delay-1000">
                <p className="text-emerald-200 text-xs">
                  Completed: <span className="font-bold text-emerald-100">{flippedTiles.size}</span>/{GRID_SIZE}
                </p>
                <p className="text-yellow-300 text-xs font-semibold">
                  Total Points: <span className="text-yellow-200">{totalPoints}</span>
                </p>
                <div className="w-32 h-1.5 bg-emerald-800/50 rounded-full mx-auto mt-1 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(flippedTiles.size / GRID_SIZE) * 100}%` }}
                  ></div>
                </div>
                <StorageStatus 
                  isUsingLocalStorage={tilesUsingLocal} 
                  className="mt-2 justify-center"
                />
                {flippedTiles.size === GRID_SIZE && (
                  <p className="text-yellow-300 text-[10px] mt-1 animate-pulse font-bold">🎉 BINGO COMPLETE! 🎉</p>
                )}
              </div>

              {/* Achievement System */}
              <AchievementSystem
                gameStats={gameStats}
                onAchievementUnlocked={(achievement) => {
                  telegram.showAlert(`🎉 Achievement Unlocked!\n\n${achievement.title}\n${achievement.description}\n\n+${achievement.points} points!`)
                }}
              />

              {/* Telegram Share Button */}
              <div className="text-center mt-4">
                <TelegramShareButton
                  completedActivities={flippedTiles.size}
                  totalActivities={GRID_SIZE}
                  totalPoints={totalPoints}
                />
              </div>
            </div>
          </div>
        )}

        {currentView === "leaderboard" && (
          <div className="container mx-auto px-2 py-4 animate-in slide-in-from-right duration-500">
            {/* Header - Responsive */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-yellow-400 animate-bounce" />
                <img
                  src="/pgpals-logo.png"
                  alt="PGPals Logo"
                  className={cn("h-6 w-6 object-contain", styles.animateFloat)}
                  loading="lazy"
                />
                <h1 className="text-2xl font-bold text-emerald-100 tracking-wider drop-shadow-2xl">Leaderboard</h1>
                <Trophy className="h-6 w-6 text-yellow-400 animate-bounce" style={{ animationDelay: "0.5s" }} />
              </div>
              <p className="text-emerald-200 text-sm font-medium">Top PGPals Pairs</p>
              <div className="w-12 h-0.5 bg-gradient-to-r from-yellow-400 to-emerald-300 mx-auto mt-2 rounded-full"></div>
            </div>

            {/* Leaderboard - Responsive */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-emerald-800/30 rounded-2xl backdrop-blur-sm border border-emerald-400/20 shadow-2xl p-3">
                {leaderboardLoading && (
                  <div className="text-center text-emerald-200 text-sm py-4">Loading leaderboard...</div>
                )}
                {!leaderboardLoading && leaderboard.length === 0 && (
                  <div className="text-center text-emerald-200 text-sm py-4">No leaderboard entries yet.</div>
                )}
                {leaderboard.map((pair, index) => (
                  <LeaderboardItem key={index} pair={pair} index={index} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />


    </div>
  )
}
