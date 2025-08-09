"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from "react"
import { Trophy, Users, Sparkles, Star, TextIcon as Telegram } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GRID_CONFIG, GRID_SIZE, ANIMATIONS, DEFAULT_PROFILE } from "@/lib/constants"
import BottomNav from "@/app/components/bottom-nav"
import { Tile } from "@/app/components/tile"
import { ProfileCard, type ProfileData } from "@/app/components/profile-card"
import LeaderboardItem from "@/app/components/leaderboard-item"
import { ZoomedTile } from "@/app/components/zoomed-tile"
import { StorageStatus } from "@/app/components/storage-status"
import { TelegramDetector, TelegramGuide } from "@/app/components/telegram-detector"
import { useTelegram } from '@/hooks/use-telegram'
import { useTelegramTheme } from '@/hooks/use-telegram-theme'
import { useCloudStorage } from '@/hooks/use-cloud-storage'
import TelegramShareButton from '@/app/components/telegram-share-button'
import AchievementSystem from '@/app/components/achievement-system'
import styles from "@/styles/animations.module.css"

// Lazy-loaded components for better initial load performance
const CompletionAnimation = lazy(() => import("@/app/components/completion-animation"))
const SubmissionModal = lazy(() => import("@/app/components/submission-modal"))

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

export default function BingoPage() {
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
    daysActive: 1,
    streakDays: 1,
    partnerActivities: Math.floor(flippedTiles.size / 2),
    socialShares: 0
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
        const res = await fetch('/api/quests')
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
        const res = await fetch('/api/leaderboard?limit=10')
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
      telegram.selectionFeedback()
      if (flippedTiles.has(index)) {
        setFlippedTiles((prev) => {
          const newSet = new Set(prev)
          newSet.delete(index)
          setCloudFlippedTiles(Array.from(newSet))
          return newSet
        })
      } else {
        setSubmissionTileIndex(index)
        setShowSubmissionModal(true)
        setSubmissionImage(null)
        setSubmissionImageUrl(null)
        setSubmissionCaption("")
      }
    },
    [flippedTiles, telegram, setCloudFlippedTiles],
  )

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSubmissionImage(file)
      const url = URL.createObjectURL(file)
      setSubmissionImageUrl(url)
    }
  }, [])

  const handleSubmissionSubmit = useCallback(async () => {
    if (!submissionImage || !submissionCaption.trim() || submissionTileIndex === null) return
    setIsSubmitting(true)
    telegram.notificationFeedback('success')
    const modal = document.querySelector(".submission-modal")
    if (modal) { modal.classList.add(styles.modalExit) }
    setTimeout(() => {
      setShowSubmissionModal(false)
      setIsSubmitting(false)
      if (submissionImageUrl) { URL.revokeObjectURL(submissionImageUrl) }
      setZoomedTile(submissionTileIndex)
      const gridContainer = document.querySelector(`[data-grid-container="true"]`)
      const targetTile = gridContainer?.children[submissionTileIndex] as HTMLElement
      if (targetTile && gridContainer) {
        const tileRect = targetTile.getBoundingClientRect()
        const targetX = tileRect.left + tileRect.width / 2 - window.innerWidth / 2
        const targetY = tileRect.top + tileRect.height / 2 - window.innerHeight / 2
        setTimeout(() => {
          const zoomedElement = document.getElementById(`zoomed-tile-${submissionTileIndex}`)
          if (zoomedElement) {
            zoomedElement.style.setProperty("--target-x", `${targetX}px`)
            zoomedElement.style.setProperty("--target-y", `${targetY}px`)
            zoomedElement.classList.add(styles.tileDragToGrid)
          }
        }, 1500)
      }
      setTimeout(() => {
        setFlippedTiles((prev) => {
          const newSet = new Set(prev)
          newSet.add(submissionTileIndex!)
          setCloudFlippedTiles(Array.from(newSet))
          return newSet
        })
        setTimeout(() => { setZoomedTile(null); setSubmissionTileIndex(null) }, 1000)
      }, 2500)
    }, 500)
  }, [submissionImage, submissionCaption, submissionTileIndex, submissionImageUrl, telegram, setCloudFlippedTiles])

  const handleModalClose = useCallback(() => {
    if (!isSubmitting) {
      setShowSubmissionModal(false)
      setSubmissionTileIndex(null)
      setSubmissionImage(null)
      if (submissionImageUrl) { URL.revokeObjectURL(submissionImageUrl) }
      setSubmissionImageUrl(null)
      setSubmissionCaption("")
    }
  }, [isSubmitting, submissionImageUrl])

  useEffect(() => {
    if (flippedTiles.size === GRID_SIZE && !bingoCompleted) {
      setShowCompletionAnimation(true)
      setBingoCompleted(true)
      telegram.notificationFeedback('success')
      telegram.impactFeedback('heavy')
    } else if (flippedTiles.size < GRID_SIZE && bingoCompleted) {
      setBingoCompleted(false)
    }
  }, [flippedTiles.size, bingoCompleted, telegram])

  useEffect(() => {
    if (showCompletionAnimation) {
      const timer = setTimeout(() => { setShowCompletionAnimation(false) }, ANIMATIONS.COMPLETION_ANIMATION_DURATION)
      return () => clearTimeout(timer)
    }
  }, [showCompletionAnimation])

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDark ? 'text-gray-100' : 'text-white'}`}>
      <TelegramDetector />
      <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-gray-950 via-slate-900 to-gray-800' : 'bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-800'}`}></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-green-800/50 via-transparent to-emerald-600/30"></div>
      {zoomedTile !== null && <div className="fixed inset-0 bg-black/70 z-40 animate-in fade-in duration-500"></div>}
      {zoomedTile !== null && activities[zoomedTile] && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none p-4">
          <div className="mb-4 text-center animate-in fade-in duration-500 delay-300">
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-2xl">Achievement Unlocked!</h2>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-2 rounded-full text-sm font-bold shadow-2xl border-2 border-yellow-300">
              <Sparkles className="inline h-4 w-4 mr-1" />
              {activities[zoomedTile]?.points ?? 0} Points
              <Star className="inline h-4 w-4 ml-1" />
            </div>
          </div>
          <ZoomedTile tileIndex={zoomedTile} isFlipped={flippedTiles.has(zoomedTile)} activity={activities[zoomedTile]} bgPosition={{ left: 0, top: 0 }} />
        </div>
      )}
      <Suspense fallback={null}>{showCompletionAnimation && <CompletionAnimation totalPoints={totalPoints} gridSize={GRID_SIZE} />}</Suspense>
      <Suspense fallback={null}>{showSubmissionModal && (
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
      )}</Suspense>
      <TelegramGuide />
      <div className="relative z-10">
        {currentView === "profile" && (
          <div className="container mx-auto px-2 py-4 animate-in slide-in-from-left duration-500">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img src="/pgpals-logo.png" alt="PGPals Logo" className={cn("h-8 w-8 object-contain", styles.animateFloat)} loading="lazy" />
                <h1 className="text-2xl font-bold text-emerald-100 tracking-wider drop-shadow-2xl">PGPals Profiles</h1>
              </div>
              <p className="text-emerald-200 text-sm font-medium">Your Partnership Details</p>
              <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-green-300 mx-auto mt-2 rounded-full"></div>
            </div>
            <div className="max-w-md mx-auto flex flex-col gap-8">
              <ProfileCard profile={userProfile} isUser={true} isEditing={editingUser} tempProfile={tempUserProfile} onEdit={() => { setTempUserProfile(userProfile); setEditingUser(true) }} onSave={() => { setUserProfile(tempUserProfile); setCloudUserProfile(tempUserProfile); setEditingUser(false); telegram.notificationFeedback('success') }} onCancel={() => { setTempUserProfile(userProfile); setEditingUser(false) }} onProfileChange={(field, value) => setTempUserProfile((prev) => ({ ...prev, [field]: value }))} />
              <ProfileCard profile={partnerProfile} isUser={false} />
            </div>
            <div className="text-center mt-6">
              <Button onClick={() => window.open("https://t.me/pgpals_bot", "_blank")} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-2xl transform transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"><Telegram className="text-lg" />Join PGPals Telegram</Button>
              <p className="text-emerald-200 text-xs mt-2">Connect with your PGPals community!</p>
            </div>
          </div>
        )}
        {currentView === "bingo" && (
          <div className="container mx-auto px-2 py-4 animate-in slide-in-from-right duration-500">
            <div className="text-center mb-4 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-full max-w-2xl">
                <div className={cn("absolute -top-2 -left-4", styles.animateFloat)}><Sparkles className="h-3 w-3 text-emerald-300/60" /></div>
                <div className={cn("absolute -top-1 -right-4 delay-1000", styles.animateFloat)}><Star className="h-2.5 w-2.5 text-green-300/50" /></div>
                <div className={cn("absolute -bottom-2 -left-6 delay-2000", styles.animateFloat)}><Star className="h-2 w-2 text-emerald-400/40" /></div>
                <div className={cn("absolute -bottom-1 -right-6 delay-3000", styles.animateFloat)}><Sparkles className="h-2.5 w-2.5 text-green-200/50" /></div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <img src="/pgpals-logo.png" alt="PGPals Logo" className={cn("h-12 w-12 object-contain drop-shadow-2xl", styles.animateFloat)} loading="lazy" />
                  <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-green-100 to-emerald-300 tracking-wider drop-shadow-2xl animate-in fade-in duration-1000 relative leading-none">
                    <span className="relative inline-block animate-[titleGlow_3s_ease-in-out_infinite]">PGPals</span>
                    <div className="absolute inset-0 text-5xl font-bold text-emerald-300/20 animate-pulse leading-none">PGPals</div>
                  </h1>
                </div>
                <div className="relative">
                  <p className="text-emerald-200 text-sm font-medium animate-in fade-in duration-1000 delay-300 mb-2">Prince George's Park Pair Activities</p>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-green-300 mx-auto rounded-full animate-in slide-in-from-bottom duration-1000 delay-500 relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_ease-in-out_infinite] w-full h-full"></div></div>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-1">
              <div className={`grid gap-1 p-2 bg-emerald-800/30 rounded-2xl backdrop-blur-sm border border-emerald-400/20 shadow-2xl animate-in zoom-in duration-700 delay-700`} style={{ gridTemplateColumns: `repeat(${GRID_CONFIG.COLS}, minmax(0, 1fr))` }} data-grid-container="true">
                {activities.map((activity, index) => (
                  <Tile key={index} activity={activity} index={index} isFlipped={flippedTiles.has(index)} onTileClick={handleTileClick} animationDelay={ANIMATIONS.TILE_ANIMATION_BASE_DELAY + index * ANIMATIONS.TILE_ANIMATION_STEP_DELAY} />
                ))}
              </div>
              <div className="text-center mt-3 animate-in fade-in duration-1000 delay-1000">
                <p className="text-emerald-200 text-xs">Completed: <span className="font-bold text-emerald-100">{flippedTiles.size}</span>/{GRID_SIZE}</p>
                <p className="text-yellow-300 text-xs font-semibold">Total Points: <span className="text-yellow-200">{totalPoints}</span></p>
                <div className="w-32 h-1.5 bg-emerald-800/50 rounded-full mx-auto mt-1 overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full transition-all duration-500 ease-out" style={{ width: `${(flippedTiles.size / GRID_SIZE) * 100}%` }}></div></div>
                <StorageStatus isUsingLocalStorage={tilesUsingLocal} className="mt-2 justify-center" />
                {flippedTiles.size === GRID_SIZE && (<p className="text-yellow-300 text-[10px] mt-1 animate-pulse font-bold">🎉 BINGO COMPLETE! 🎉</p>)}
              </div>
              <AchievementSystem gameStats={gameStats} onAchievementUnlocked={(achievement) => { telegram.showAlert(`🎉 Achievement Unlocked!\n\n${achievement.title}\n${achievement.description}\n\n+${achievement.points} points!`) }} />
              <div className="text-center mt-4">
                <TelegramShareButton completedActivities={flippedTiles.size} totalActivities={GRID_SIZE} totalPoints={totalPoints} />
              </div>
            </div>
          </div>
        )}
        {currentView === "leaderboard" && (
          <div className="container mx-auto px-2 py-4 animate-in slide-in-from-right duration-500">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-yellow-400 animate-bounce" />
                <img src="/pgpals-logo.png" alt="PGPals Logo" className={cn("h-6 w-6 object-contain", styles.animateFloat)} loading="lazy" />
                <h1 className="text-2xl font-bold text-emerald-100 tracking-wider drop-shadow-2xl">Leaderboard</h1>
                <Trophy className="h-6 w-6 text-yellow-400 animate-bounce" style={{ animationDelay: "0.5s" }} />
              </div>
              <p className="text-emerald-200 text-sm font-medium">Top PGPals Pairs</p>
              <div className="w-12 h-0.5 bg-gradient-to-r from-yellow-400 to-emerald-300 mx-auto mt-2 rounded-full"></div>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="bg-emerald-800/30 rounded-2xl backdrop-blur-sm border border-emerald-400/20 shadow-2xl p-3">
                {leaderboardLoading && (<div className="text-center text-emerald-200 text-sm py-4">Loading leaderboard...</div>)}
                {!leaderboardLoading && leaderboard.length === 0 && (<div className="text-center text-emerald-200 text-sm py-4">No leaderboard entries yet.</div>)}
                {leaderboard.map((pair, index) => (<LeaderboardItem key={index} pair={pair} index={index} />))}
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  )
}

 


