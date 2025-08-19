"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Trophy, Users, User, Sparkles, Star, TextIcon as Telegram, Copy, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { GRID_CONFIG, GRID_SIZE, ANIMATIONS } from "@/lib/constants"
import BottomNav from "@/app/components/bottom-nav"
import { Tile } from "@/app/components/tile"
import { ProfileCard, type ProfileData } from "@/app/components/profile-card"
import LeaderboardItem from "@/app/components/leaderboard-item"
import LeaderboardPodium from "@/app/components/leaderboard-podium"
import { ZoomedTile } from "@/app/components/zoomed-tile"
// Removed StorageStatus per request
// import { StorageStatus } from "@/app/components/storage-status"
// Removed TelegramDetector/TelegramGuide per request
import { useTelegram } from '@/hooks/use-telegram'
import { useTelegramTheme } from '@/hooks/use-telegram-theme'
import { useCloudStorage } from '@/hooks/use-cloud-storage'
// Removed Share to Telegram per request
// import TelegramShareButton from '@/app/components/telegram-share-button'
import AchievementSystem from '@/app/components/achievement-system'
import styles from "@/styles/animations.module.css"
import { useSession } from 'next-auth/react'
import { signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import CompletionAnimation from "@/app/components/completion-animation"
import SubmissionModal from "@/app/components/submission-modal"
import { getAppVersion } from '@/lib/buildInfo'

// Fallback activities used if API is unavailable
const FALLBACK_ACTIVITIES = [
  { task: "Fix the API!", points: 999 },
].slice(0, GRID_SIZE)

export default function BingoPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [activities, setActivities] = useState<{ task: string; points: number }[]>(FALLBACK_ACTIVITIES)
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; score: number; avatar: string; users?: Array<{ id: string; name: string; telegram_username?: string | null }>; completed?: number; rank?: number }>>([])
  const [maxLeaderboardPoints, setMaxLeaderboardPoints] = useState<number>(0)
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(true)
  const [flippedTiles, setFlippedTiles] = useState<Set<number>>(new Set())
  const [currentView, setCurrentView] = useState<"profile" | "bingo" | "leaderboard">("bingo")
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false)
  const [editingUser, setEditingUser] = useState(false)
  const [bingoCompleted, setBingoCompleted] = useState(false)

  const [userProfile, setUserProfile] = useState<ProfileData>({ name: '' })
  const [sessionInfo, setSessionInfo] = useState<string | null>(null)

  const [partnerProfile, setPartnerProfile] = useState<ProfileData>({
    name: '',
  })
  const [partnerCode, setPartnerCode] = useState<string>('')
  const [codeCopied, setCodeCopied] = useState(false)

  const [tempUserProfile, setTempUserProfile] = useState<ProfileData>(userProfile)

  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [submissionTileIndex, setSubmissionTileIndex] = useState<number | null>(null)
  const [submissionImage, setSubmissionImage] = useState<File | null>(null)
  const [submissionImageUrl, setSubmissionImageUrl] = useState<string | null>(null)
  const [submissionCaption, setSubmissionCaption] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [zoomedTile, setZoomedTile] = useState<number | null>(null)
  const [isTelegramContext, setIsTelegramContext] = useState(false)

  // Inline signup state
  const [signEmail, setSignEmail] = useState('')
  const [signName, setSignName] = useState('')
  const [signPassword, setSignPassword] = useState('')
  const [signConfirm, setSignConfirm] = useState('')
  const [signLoading, setSignLoading] = useState(false)
  const [signError, setSignError] = useState('')
  const [signFaculty, setSignFaculty] = useState('')
  const [signMajor, setSignMajor] = useState('')
  const [signImageUrl, setSignImageUrl] = useState('')
  const [signImageFile, setSignImageFile] = useState<File | null>(null)
  const [signImagePreviewUrl, setSignImagePreviewUrl] = useState<string>('')

  const FACULTIES: string[] = [
    'Arts and Social Sciences',
    'Business (NUS Business School)',
    'Computing (School of Computing)',
    'Dentistry',
    'Design and Engineering (CDE)',
    'Law',
    'Medicine (Yong Loo Lin School of Medicine)',
    'Science',
    'Public Health (SSHSPH)',
    'Integrative Sciences and Engineering (NUS Graduate School)',
  ]

  const MAJORS_BY_FACULTY: Record<string, string[]> = {
    'Arts and Social Sciences': ['Economics', 'English Language', 'English Literature', 'Geography', 'History', 'Philosophy', 'Political Science', 'Psychology', 'Social Work', 'Sociology', 'Communications and New Media'],
    'Business (NUS Business School)': ['Accounting', 'Business Administration', 'Business Analytics', 'Finance', 'Management', 'Marketing', 'Operations and Supply Chain'],
    'Computing (School of Computing)': ['Computer Science', 'Information Security', 'Information Systems', 'Business Analytics', 'Computer Engineering'],
    'Dentistry': ['Dentistry'],
    'Design and Engineering (CDE)': ['Biomedical Engineering', 'Chemical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Industrial and Systems Engineering', 'Materials Science and Engineering', 'Mechanical Engineering', 'Architecture', 'Industrial Design'],
    'Law': ['Law'],
    'Medicine (Yong Loo Lin School of Medicine)': ['Medicine', 'Nursing'],
    'Science': ['Chemistry', 'Life Sciences', 'Mathematics', 'Physics', 'Data Science and Analytics', 'Pharmaceutical Science', 'Food Science and Technology', 'Statistics'],
    'Public Health (SSHSPH)': ['Public Health'],
    'Integrative Sciences and Engineering (NUS Graduate School)': ['ISEP'],
  }

  // Telegram integration
  const telegram = useTelegram()
  const { isDark } = useTelegramTheme()

  // Cloud storage for game state
  const { 
    data: cloudFlippedTiles, 
    setData: setCloudFlippedTiles, 
    isUsingLocalStorage: tilesUsingLocal 
  } = useCloudStorage<number[]>('flipped_tiles', [])
  
  // Deprecated: local profile mock storage removed
  const profileUsingLocal = false

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

  // Removed mock profile sync

  // Load real profile from API when signed in
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) return
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) return
        const me = await res.json()
        setUserProfile({
          name: me.name,
          faculty: me.faculty || undefined,
          major: me.major || undefined,
          imageUrl: me.profile_image_url || undefined,
        })
        if (me.partner_name) {
          setPartnerProfile({
            name: me.partner_name,
          })
        } else {
          // Load my partner code if no partner
          try {
            const codeRes = await fetch('/api/partners')
            if (codeRes.ok) {
              const data = await codeRes.json()
              setPartnerCode(String(data.code || ''))
            }
          } catch {}
        }
      } catch {}
    }
    loadProfile()
  }, [session?.user])

  // Auto sign-in inside Telegram Mini App (no manual signup)
  useEffect(() => {
    const maybeTelegramAutoLogin = async () => {
      if (session?.user) return
      const anyWindow = window as any
      const initData = anyWindow?.Telegram?.WebApp?.initData
      setIsTelegramContext(!!initData)
      if (!initData) return
      try {
        const res = await signIn('credentials', { isTelegram: 'true', telegramInitData: initData, redirect: false })
        await update?.({})
      } catch {}
    }
    maybeTelegramAutoLogin()
  }, [session?.user, update])

  // Load activities from API
  // Fetch Telegram profile photo as fallback when Mini App is present but photo_url is missing
  useEffect(() => {
    if (!isTelegramContext) return
    const uid = (telegram as any)?.user?.id
    const hasPhoto = Boolean(userProfile.imageUrl)
    if (!uid || hasPhoto) return
    fetch(`/api/telegram/user-photo?user_id=${uid}`)
      .then(r => r.json())
      .then(({ url }) => {
        if (url) setUserProfile(prev => ({ ...prev, imageUrl: url }))
      })
      .catch(() => {})
  }, [isTelegramContext, telegram, userProfile.imageUrl])
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
        type LeaderboardEntryResponse = {
          name?: string;
          total_points?: number;
          rank?: number;
          users?: Array<{ id: string; name: string; telegram_username?: string | null }>;
          completed_quests?: number;
        }
        const entries: LeaderboardEntryResponse[] = await res.json()
        const mapped = entries.map((e) => ({
          name: e.name || 'Participant',
          score: Number(e.total_points) || 0,
          avatar: e.rank === 1 ? '🏆' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : '⭐',
          users: e.users || [],
          completed: Number(e.completed_quests) || 0,
          rank: e.rank || 0,
        }))
        setLeaderboard(mapped)
        setMaxLeaderboardPoints(mapped.reduce((m, p) => Math.max(m, p.score), 0))
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
      // Require authentication before opening submission modal
      if (!session?.user) {
        // Not signed in; redirect directly to signup page
        try { router.push('/auth/signup') } catch {}
        return
      }

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
    [flippedTiles, telegram, setCloudFlippedTiles, session?.user, router],
  )

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSubmissionImage(file)
      const url = URL.createObjectURL(file)
      setSubmissionImageUrl(url)
    }
  }, [])

  const handleInlineSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSignError('')
    if (signPassword !== signConfirm) {
      setSignError('Passwords do not match')
      return
    }
    if (signPassword.length < 6) {
      setSignError('Password must be at least 6 characters')
      return
    }
    try {
      setSignLoading(true)
      // 1) If a file was selected, upload it first to get a URL
      let uploadedUrl: string | undefined
      if (signImageFile) {
        const fd = new FormData()
        fd.append('file', signImageFile)
        const upRes = await fetch('/api/upload/profile-image', { method: 'POST', body: fd })
        if (upRes.ok) {
          const { url } = await upRes.json()
          uploadedUrl = url
        }
      }

      const res = await signIn('credentials', {
        redirect: false,
        email: signEmail,
        name: signName,
        password: signPassword,
        isSignUp: 'true',
        faculty: signFaculty,
        major: signMajor,
        profileImageUrl: uploadedUrl || signImageUrl,
      })
      if (res?.error) {
        setSignError('Failed to create account. Email may already be in use.')
      } else {
        // Refresh auth session and load profile immediately
        try { await update?.({}); } catch {}
        router.refresh()
        try {
          const meRes = await fetch('/api/users/me')
          if (meRes.ok) {
            const me = await meRes.json()
            setUserProfile({
              name: me.name,
              faculty: me.faculty || undefined,
              major: me.major || undefined,
              imageUrl: me.profile_image_url || undefined,
            })
            if (me.partner_name) setPartnerProfile({ name: me.partner_name })
          }
        } catch {}
      }
    } catch {
      setSignError('Unexpected error. Please try again.')
    } finally {
      setSignLoading(false)
    }
  }, [signEmail, signName, signPassword, signConfirm])

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
    <div className={`min-h-screen relative overflow-hidden pb-24 ${isDark ? 'text-gray-100' : 'text-white'}`}>
      <div className={`absolute inset-0 pointer-events-none ${isDark ? 'bg-gradient-to-br from-gray-950 via-slate-900 to-gray-800' : 'bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-800'}`}></div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-green-800/50 via-transparent to-emerald-600/30"></div>
      {zoomedTile !== null && <div className="fixed inset-0 z-40 duration-500 bg-black/70 animate-in fade-in pointer-events-none"></div>}
      {zoomedTile !== null && activities[zoomedTile] && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 pointer-events-none">
          <div className="mb-4 text-center duration-500 delay-300 animate-in fade-in">
            <h2 className="mb-2 text-2xl font-bold text-white drop-shadow-2xl">Achievement Unlocked!</h2>
            <div className="px-3 py-2 text-sm font-bold text-black border-2 border-yellow-300 rounded-full shadow-2xl bg-gradient-to-r from-yellow-400 to-orange-400">
              <Sparkles className="inline w-4 h-4 mr-1" />
              {activities[zoomedTile]?.points ?? 0} Points
              <Star className="inline w-4 h-4 ml-1" />
            </div>
          </div>
          {/* Move useMemo outside JSX to avoid conditional hook call */}
          <ZoomedTile tileIndex={zoomedTile} isFlipped={flippedTiles.has(zoomedTile)} activity={activities[zoomedTile]} bgPosition={{ left: 0, top: 0 }} />
        </div>
      )}
      {showCompletionAnimation && <CompletionAnimation totalPoints={totalPoints} gridSize={GRID_SIZE} />}
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
      <div className="relative z-10">
        {currentView === "profile" && (
          <div className="container px-2 py-4 mx-auto duration-500 animate-in slide-in-from-left">
            <div className="mb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img src="/pgpals-logo.png" alt="PGPals Logo" className={cn("h-8 w-8 object-contain", styles.animateFloat)} loading="lazy" />
                <h1 className="text-2xl font-bold tracking-wider text-emerald-100 drop-shadow-2xl">PGPals Profiles</h1>
              </div>
              <p className="text-sm font-medium text-emerald-200">Your Partnership Details</p>
              <p className="text-xs text-emerald-300 mt-1">{getAppVersion()}</p>
              <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-green-300 mx-auto mt-2 rounded-full"></div>
            </div>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative h-24 w-24 rounded-full overflow-hidden border border-emerald-400/30 bg-emerald-900/30">
                {userProfile.imageUrl ? (
                  <img src={userProfile.imageUrl} alt={userProfile.name || 'User'} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-emerald-200/80">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              <div className="mt-3 text-emerald-100 text-lg font-semibold">
                {telegram?.user?.username ? `@${telegram.user.username}` : (userProfile.name || 'User')}
              </div>
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/auth/session')
                    const json = await res.json()
                    const text = JSON.stringify(json, null, 2)
                    setSessionInfo(text)
                    if ((telegram as any)?.showAlert) {
                      (telegram as any).showAlert(text)
                    } else {
                      // Fallback if Telegram API not available
                      // eslint-disable-next-line no-alert
                      alert(text)
                    }
                  } catch {
                    const msg = 'Failed to fetch session'
                    if ((telegram as any)?.showAlert) (telegram as any).showAlert(msg)
                    else alert(msg)
                  }
                }}
                variant="outline"
                className="mt-3 text-xs border-emerald-400/40 text-emerald-100 hover:bg-emerald-800/40"
              >
                Check session
              </Button>
              {sessionInfo && (
                <pre className="mt-2 max-w-full overflow-auto text-[10px] text-emerald-200/80 bg-emerald-900/30 p-2 rounded">
                  {sessionInfo}
                </pre>
              )}
            </div>
          </div>
        )}
        {currentView === "bingo" && (
          <div className="container px-2 py-4 mx-auto duration-500 animate-in slide-in-from-right">
            <div className="relative mb-4 text-center">
              <div className="absolute w-full max-w-2xl -translate-x-1/2 -top-4 left-1/2">
                <div className={cn("absolute -top-2 -left-4", styles.animateFloat)}><Sparkles className="w-3 h-3 text-emerald-300/60" /></div>
                <div className={cn("absolute -top-1 -right-4 delay-1000", styles.animateFloat)}><Star className="h-2.5 w-2.5 text-green-300/50" /></div>
                <div className={cn("absolute -bottom-2 -left-6 delay-2000", styles.animateFloat)}><Star className="w-2 h-2 text-emerald-400/40" /></div>
                <div className={cn("absolute -bottom-1 -right-6 delay-3000", styles.animateFloat)}><Sparkles className="h-2.5 w-2.5 text-green-200/50" /></div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <img src="/pgpals-logo.png" alt="PGPals Logo" className={cn("h-12 w-12 object-contain drop-shadow-2xl", styles.animateFloat)} loading="lazy" />
                  <h1 className="relative text-5xl font-bold leading-none tracking-wider text-transparent duration-1000 bg-clip-text bg-gradient-to-r from-emerald-200 via-green-100 to-emerald-300 drop-shadow-2xl animate-in fade-in">
                    <span className="relative inline-block animate-[titleGlow_3s_ease-in-out_infinite]">PGPals</span>
                    <div className="absolute inset-0 text-5xl font-bold leading-none text-emerald-300/20 animate-pulse">PGPals</div>
                  </h1>
                </div>
                <div className="relative">
                  <p className="mb-2 text-sm font-medium duration-1000 delay-300 text-emerald-200 animate-in fade-in">Prince George&apos;s Park Pair Activities</p>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-green-300 mx-auto rounded-full animate-in slide-in-from-bottom duration-1000 delay-500 relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_ease-in-out_infinite] w-full h-full"></div></div>
                </div>
              </div>
            </div>
            <div className="px-1 mx-auto max-w-7xl">
              <div className={`grid gap-1 p-2 bg-emerald-800/30 rounded-2xl backdrop-blur-sm border border-emerald-400/20 shadow-2xl animate-in zoom-in duration-700 delay-700 pointer-events-auto`} style={{ gridTemplateColumns: `repeat(${GRID_CONFIG.COLS}, minmax(0, 1fr))` }} data-grid-container="true">
                {activities.map((activity, index) => (
                  <Tile key={index} activity={activity} index={index} isFlipped={flippedTiles.has(index)} onTileClick={handleTileClick} animationDelay={ANIMATIONS.TILE_ANIMATION_BASE_DELAY + index * ANIMATIONS.TILE_ANIMATION_STEP_DELAY} />
                ))}
              </div>
              <div className="mt-3 text-center duration-1000 delay-1000 animate-in fade-in">
                <p className="text-xs text-emerald-200">Completed: <span className="font-bold text-emerald-100">{flippedTiles.size}</span>/{GRID_SIZE}</p>
                <p className="text-xs font-semibold text-yellow-300">Total Points: <span className="text-yellow-200">{totalPoints}</span></p>
                <div className="w-32 h-1.5 bg-emerald-800/50 rounded-full mx-auto mt-1 overflow-hidden"><div className="h-full transition-all duration-500 ease-out rounded-full bg-gradient-to-r from-emerald-400 to-green-300" style={{ width: `${(flippedTiles.size / GRID_SIZE) * 100}%` }}></div></div>
                {/* Storage status removed */}
                {flippedTiles.size === GRID_SIZE && (<p className="text-yellow-300 text-[10px] mt-1 animate-pulse font-bold">🎉 BINGO COMPLETE! 🎉</p>)}
              </div>
              <AchievementSystem gameStats={gameStats} onAchievementUnlocked={(achievement) => { telegram.showAlert(`🎉 Achievement Unlocked!\n\n${achievement.title}\n${achievement.description}\n\n+${achievement.points} points!`) }} />
              {/* Share to Telegram removed */}
            </div>
          </div>
        )}
        {currentView === "leaderboard" && (
          <div className="container px-2 py-4 mx-auto duration-500 animate-in slide-in-from-right">
            <div className="mb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-yellow-400 animate-bounce" />
                <img src="/pgpals-logo.png" alt="PGPals Logo" className={cn("h-6 w-6 object-contain", styles.animateFloat)} loading="lazy" />
                <h1 className="text-2xl font-bold tracking-wider text-emerald-100 drop-shadow-2xl">Leaderboard</h1>
                <Trophy className="w-6 h-6 text-yellow-400 animate-bounce" style={{ animationDelay: "0.5s" }} />
              </div>
              <p className="text-sm font-medium text-emerald-200">Top PGPals Pairs</p>
              <div className="w-12 h-0.5 bg-gradient-to-r from-yellow-400 to-emerald-300 mx-auto mt-2 rounded-full"></div>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {leaderboard.length >= 1 && (
                <LeaderboardPodium entries={leaderboard.slice(0,3)} max={maxLeaderboardPoints || 1} />
              )}
              {leaderboard.length > 0 && leaderboard.length < 3 && (
                <p className="mt-2 text-xs text-emerald-200 text-center">Not enough participants for full podium display.</p>
              )}
              <div className="p-3 border shadow-2xl bg-emerald-800/30 rounded-2xl backdrop-blur-sm border-emerald-400/20">
                {leaderboardLoading && (<div className="py-4 text-sm text-center text-emerald-200">Loading leaderboard...</div>)}
                {!leaderboardLoading && leaderboard.length === 0 && (<div className="py-4 text-sm text-center text-emerald-200">No leaderboard entries yet.</div>)}
                {leaderboard.slice(3).map((pair, index) => (
                  <LeaderboardItem key={index} pair={pair} index={index+3} max={maxLeaderboardPoints || 1} />
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

 


